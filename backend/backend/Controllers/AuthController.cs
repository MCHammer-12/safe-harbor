using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models.DTOs;
using backend.Models;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private const string SupporterIdClaimType = "supporter_id";
    private static readonly HashSet<string> AllowedSupporterTypes = new(StringComparer.Ordinal)
    {
        "MonetaryDonor",
        "InKindDonor",
        "Volunteer",
        "SkillsContributor",
        "SocialMediaAdvocate",
        "PartnerOrganization",
    };
    private static readonly HashSet<string> AllowedRelationshipTypes = new(StringComparer.Ordinal)
    {
        "Local",
        "International",
        "PartnerOrganization",
    };
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.Ordinal)
    {
        "Active",
        "Inactive",
    };
    private static readonly HashSet<string> AllowedAcquisitionChannels = new(StringComparer.Ordinal)
    {
        "Website",
        "SocialMedia",
        "Event",
        "WordOfMouth",
        "PartnerReferral",
        "Church",
    };

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly MainAppDbContext _mainAppDbContext;

    // ✅ ADDED
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        MainAppDbContext mainAppDbContext,
        IConfiguration configuration) // ✅ ADDED
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _mainAppDbContext = mainAppDbContext;
        _configuration = configuration; // ✅ ADDED
    }

    [Authorize]
    [HttpPost("link-donor-profile")]
    public async Task<IActionResult> LinkDonorProfile([FromBody] LinkDonorProfileDto? dto)
    {
        if (dto == null)
            return BadRequest(new { error = "Request body is required." });

        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
            return BadRequest(new { error = "firstName and lastName are required." });

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        var accountEmail = user.Email?.Trim();
        if (string.IsNullOrWhiteSpace(accountEmail))
        {
            return BadRequest(new
            {
                error = "Your account has no email on file. Please contact support to link your donor profile.",
            });
        }

        var normalizedEmail = accountEmail.ToLowerInvariant();
        var normalizedFirstName = dto.FirstName.Trim();
        var normalizedLastName = dto.LastName.Trim();

        var wantsCreate = !string.IsNullOrWhiteSpace(dto.SupporterType);

        // Step 1: try to link via triple match.
        if (!wantsCreate)
        {
            var matchIds = await FindSupporterIdsByTripleAsync(normalizedFirstName, normalizedLastName, normalizedEmail);
            if (matchIds.Count == 0)
                return Ok(new { needsSupporterDetails = true });
            if (matchIds.Count > 1)
                return Conflict(new { error = "Multiple supporter profiles match this name and email. Please contact support." });

            return await FinalizeDonorLinkAsync(user, matchIds[0]);
        }

        // Step 2: create supporter if no triple match exists, then link.
        var registerShape = new RegisterDto
        {
            Email = normalizedEmail,
            Password = "",
            FirstName = normalizedFirstName,
            LastName = normalizedLastName,
            SupporterType = dto.SupporterType!.Trim(),
            OrganizationName = dto.OrganizationName,
            RelationshipType = dto.RelationshipType ?? "",
            Region = dto.Region ?? "",
            Country = dto.Country ?? "",
            Phone = dto.Phone ?? "",
            Status = dto.Status ?? "",
            AcquisitionChannel = dto.AcquisitionChannel ?? "",
        };

        var validationError = ValidateSupporterCreateFields(registerShape);
        if (validationError != null)
            return BadRequest(new { error = validationError });

        var existingMatches = await FindSupporterIdsByTripleAsync(normalizedFirstName, normalizedLastName, normalizedEmail);
        if (existingMatches.Count > 1)
            return Conflict(new { error = "Multiple supporter profiles match this name and email. Please contact support." });
        if (existingMatches.Count == 1)
            return await FinalizeDonorLinkAsync(user, existingMatches[0]);

        var supporterType = registerShape.SupporterType.Trim();
        var relationshipType = registerShape.RelationshipType.Trim();
        var region = registerShape.Region.Trim();
        var country = registerShape.Country.Trim();
        var phone = registerShape.Phone.Trim();
        var status = registerShape.Status.Trim();
        var acquisitionChannel = registerShape.AcquisitionChannel.Trim();
        var organizationName = string.IsNullOrWhiteSpace(registerShape.OrganizationName) ? null : registerShape.OrganizationName.Trim();

        var created = new Supporter
        {
            SupporterType = supporterType,
            DisplayName = supporterType == "PartnerOrganization"
                ? organizationName!
                : $"{normalizedFirstName} {normalizedLastName}",
            OrganizationName = organizationName,
            FirstName = normalizedFirstName,
            LastName = normalizedLastName,
            RelationshipType = relationshipType,
            Region = region,
            Country = country,
            Email = normalizedEmail,
            Phone = phone,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            AcquisitionChannel = acquisitionChannel,
        };

        _mainAppDbContext.Supporters.Add(created);
        await _mainAppDbContext.SaveChangesAsync();

        return await FinalizeDonorLinkAsync(user, created.SupporterId);
    }

    private async Task<List<int>> FindSupporterIdsByTripleAsync(string firstName, string lastName, string email)
    {
        var fn = firstName.Trim().ToLowerInvariant();
        var ln = lastName.Trim().ToLowerInvariant();
        var em = email.Trim().ToLowerInvariant();

        return await _mainAppDbContext.Supporters
            .AsNoTracking()
            .Where(s =>
                s.FirstName != null &&
                s.LastName != null &&
                s.Email != null &&
                s.FirstName.ToLower() == fn &&
                s.LastName.ToLower() == ln &&
                s.Email.ToLower() == em)
            .Select(s => s.SupporterId)
            .ToListAsync();
    }

    private async Task<IActionResult> FinalizeDonorLinkAsync(ApplicationUser user, int supporterId)
    {
        var supporterExists = await _mainAppDbContext.Supporters.AnyAsync(s => s.SupporterId == supporterId);
        if (!supporterExists)
            return BadRequest(new { error = "Supporter record was not found." });

        if (!await _userManager.IsInRoleAsync(user, AuthRoles.Donor))
        {
            var roleResult = await _userManager.AddToRoleAsync(user, AuthRoles.Donor);
            if (!roleResult.Succeeded)
                return StatusCode(500, new { error = "Unable to assign donor role." });
        }

        var existingClaims = await _userManager.GetClaimsAsync(user);
        foreach (var c in existingClaims.Where(c => c.Type == SupporterIdClaimType))
        {
            var remove = await _userManager.RemoveClaimAsync(user, c);
            if (!remove.Succeeded)
                return StatusCode(500, new { error = "Unable to update donor profile link." });
        }

        var addClaim = await _userManager.AddClaimAsync(user, new Claim(SupporterIdClaimType, supporterId.ToString()));
        if (!addClaim.Succeeded)
            return StatusCode(500, new { error = "Unable to link donor profile." });

        await _signInManager.RefreshSignInAsync(user);
        return Ok(new { linked = true });
    }

    private static string? ValidateSupporterCreateFields(RegisterDto dto)
    {
        var supporterType = dto.SupporterType.Trim();
        var relationshipType = dto.RelationshipType.Trim();
        var region = dto.Region.Trim();
        var country = dto.Country.Trim();
        var phone = dto.Phone.Trim();
        var status = dto.Status.Trim();
        var acquisitionChannel = dto.AcquisitionChannel.Trim();
        var organizationName = dto.OrganizationName?.Trim();

        if (string.IsNullOrWhiteSpace(supporterType) ||
            string.IsNullOrWhiteSpace(relationshipType) ||
            string.IsNullOrWhiteSpace(region) ||
            string.IsNullOrWhiteSpace(country) ||
            string.IsNullOrWhiteSpace(phone) ||
            string.IsNullOrWhiteSpace(status) ||
            string.IsNullOrWhiteSpace(acquisitionChannel))
        {
            return "No supporter match found. Please provide a bit more information to proceed to the donation portal.";
        }

        if (!AllowedSupporterTypes.Contains(supporterType))
            return "Invalid supporterType.";
        if (!AllowedRelationshipTypes.Contains(relationshipType))
            return "Invalid relationshipType.";
        if (!AllowedStatuses.Contains(status))
            return "Invalid status.";
        if (!AllowedAcquisitionChannels.Contains(acquisitionChannel))
            return "Invalid acquisitionChannel.";
        if (supporterType == "PartnerOrganization" && string.IsNullOrWhiteSpace(organizationName))
            return "organizationName is required for PartnerOrganization supporter type.";

        return null;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var normalizedFirstName = dto.FirstName.Trim();
        var normalizedLastName = dto.LastName.Trim();
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(normalizedFirstName) ||
            string.IsNullOrWhiteSpace(normalizedLastName) ||
            string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { error = "firstName, lastName, and email are required to register a donor account." });
        }

        var matchingSupporters = await _mainAppDbContext.Supporters
            .Where(s =>
                s.FirstName != null &&
                s.LastName != null &&
                s.Email != null &&
                s.FirstName.ToLower() == normalizedFirstName.ToLower() &&
                s.LastName.ToLower() == normalizedLastName.ToLower() &&
                s.Email.ToLower() == normalizedEmail)
            .Select(s => s.SupporterId)
            .ToListAsync();

        if (matchingSupporters.Count > 1)
        {
            return Conflict(new { error = "Multiple supporter matches found." });
        }

        Supporter? createdSupporter = null;
        int supporterId;

        if (matchingSupporters.Count == 1)
        {
            supporterId = matchingSupporters[0];
        }
        else
        {
            var validationError = ValidateSupporterCreateFields(dto);
            if (validationError != null)
            {
                return BadRequest(new { error = validationError });
            }

            var supporterType = dto.SupporterType.Trim();
            var relationshipType = dto.RelationshipType.Trim();
            var region = dto.Region.Trim();
            var country = dto.Country.Trim();
            var phone = dto.Phone.Trim();
            var status = dto.Status.Trim();
            var acquisitionChannel = dto.AcquisitionChannel.Trim();
            var organizationName = string.IsNullOrWhiteSpace(dto.OrganizationName)
                ? null
                : dto.OrganizationName.Trim();

            createdSupporter = new Supporter
            {
                FirstName = normalizedFirstName,
                LastName = normalizedLastName,
                Email = normalizedEmail,
                SupporterType = supporterType,
                DisplayName = supporterType == "PartnerOrganization"
                    ? organizationName!
                    : $"{normalizedFirstName} {normalizedLastName}",
                OrganizationName = organizationName,
                RelationshipType = relationshipType,
                Region = region,
                Country = country,
                Phone = phone,
                Status = status,
                AcquisitionChannel = acquisitionChannel,
                CreatedAt = DateTime.UtcNow
            };

            _mainAppDbContext.Supporters.Add(createdSupporter);
            await _mainAppDbContext.SaveChangesAsync();
            supporterId = createdSupporter.SupporterId;
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, AuthRoles.Donor);
        await _userManager.AddClaimAsync(user, new Claim(SupporterIdClaimType, supporterId.ToString()));

        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _signInManager.PasswordSignInAsync(
            dto.Email,
            dto.Password,
            true,
            false
        );

        if (!result.Succeeded)
            return Unauthorized();

        return Ok();
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok();
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Ok(new
            {
                isAuthenticated = false
            });
        }

        var user = await _userManager.GetUserAsync(User);

        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .ToArray();

        return Ok(new
        {
            isAuthenticated = true,
            email = user?.Email,
            roles,
            supporterId = TryGetSupporterIdClaim(User)
        });
    }

    [HttpGet("google-login")]
    public IActionResult GoogleLogin([FromQuery] string? returnUrl = null)
    {
        var redirectUrl = Url.Action(nameof(GoogleResponse), "Auth", new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl!);

        return Challenge(properties, "Google");
    }

    [HttpGet("google-response")]
    public async Task<IActionResult> GoogleResponse([FromQuery] string? returnUrl = null)
    {
        // ✅ FIXED (only change here)
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";

        var safeReturnUrl = string.IsNullOrWhiteSpace(returnUrl) ? "/" : returnUrl;

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            return Redirect($"{frontendBaseUrl}/login?error=external_login_failed");
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect($"{frontendBaseUrl}/login?error=no_email");
        }

        var normalizedEmail = email.ToLowerInvariant();

        var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);

        if (existingUser != null)
        {
            await _signInManager.SignInAsync(existingUser, true);
            return Redirect($"{frontendBaseUrl}{safeReturnUrl}");
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            EmailConfirmed = true
        };

        await _userManager.CreateAsync(user);
        await _userManager.AddToRoleAsync(user, AuthRoles.Donor);
        await _userManager.AddLoginAsync(user, info);
        await _signInManager.SignInAsync(user, true);

        return Redirect($"{frontendBaseUrl}{safeReturnUrl}");
    }

    private static int? TryGetSupporterIdClaim(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(SupporterIdClaimType);
        return int.TryParse(raw, out var id) ? id : null;
    }
}