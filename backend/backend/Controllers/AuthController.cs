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

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        MainAppDbContext mainAppDbContext)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _mainAppDbContext = mainAppDbContext;
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
        return Conflict(new { error = "Multiple supporter matches found. Please contact support to link your donor account." });
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
        if (validationError is not null)
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
        var organizationName = string.IsNullOrWhiteSpace(dto.OrganizationName) ? null : dto.OrganizationName.Trim();

        createdSupporter = new Supporter
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
            AcquisitionChannel = acquisitionChannel
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
    {
        if (createdSupporter is not null)
        {
            _mainAppDbContext.Supporters.Remove(createdSupporter);
            await _mainAppDbContext.SaveChangesAsync();
        }

        return BadRequest(result.Errors.Select(e => new
        {
            code = e.Code,
            description = e.Description
        }));
    }

    
    var roleResult = await _userManager.AddToRoleAsync(user, AuthRoles.Donor);
    if (!roleResult.Succeeded)
    {
        await _userManager.DeleteAsync(user);
        if (createdSupporter is not null)
        {
            _mainAppDbContext.Supporters.Remove(createdSupporter);
            await _mainAppDbContext.SaveChangesAsync();
        }

        return StatusCode(500, new { error = "Unable to assign donor role." });
    }

    var claimResult = await _userManager.AddClaimAsync(user, new Claim(SupporterIdClaimType, supporterId.ToString()));
    if (!claimResult.Succeeded)
    {
        await _userManager.DeleteAsync(user);
        if (createdSupporter is not null)
        {
            _mainAppDbContext.Supporters.Remove(createdSupporter);
            await _mainAppDbContext.SaveChangesAsync();
        }

        return StatusCode(500, new { error = "Unable to link donor account to supporter profile." });
    }

    return Ok();
}
    // ======================
    // LOGIN
    // ======================
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _signInManager.PasswordSignInAsync(
            dto.Email,
            dto.Password,
            isPersistent: true,
            lockoutOnFailure: false
        );

        if (!result.Succeeded)
            return Unauthorized();

        return Ok();
    }

    // ======================
    // LOGOUT
    // ======================
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok();
    }

    // ======================
    // CURRENT USER
    // ======================
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Ok(new
            {
                isAuthenticated = false,
                userName = (string?)null,
                email = (string?)null,
            roles = Array.Empty<string>(),
            supporterId = (int?)null
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
            userName = user?.UserName,
            email = user?.Email,
        roles,
        supporterId = TryGetSupporterIdClaim(User)
        });
    }

    /// <summary>
    /// Links the current user to a supporter (triple match on first name, last name, email) or creates a supporter then links.
    /// Requires authentication. Email is always taken from the user account, not the body.
    /// </summary>
    [Authorize]
    [HttpPost("link-donor-profile")]
    public async Task<IActionResult> LinkDonorProfile([FromBody] LinkDonorProfileDto? dto)
    {
        if (dto == null)
            return BadRequest(new { error = "Request body is required." });

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        var accountEmail = user.Email?.Trim();
        if (string.IsNullOrWhiteSpace(accountEmail))
        {
            return BadRequest(new
            {
                error = "Your account has no email on file. Contact support to use the donor portal.",
            });
        }

        var normalizedEmail = accountEmail.ToLowerInvariant();

        if (await _userManager.IsInRoleAsync(user, AuthRoles.Donor))
        {
            var existingClaimId = TryGetSupporterIdClaim(User);
            if (existingClaimId is int sid &&
                sid > 0 &&
                await _mainAppDbContext.Supporters.AnyAsync(s => s.SupporterId == sid))
            {
                return Ok(new { linked = true });
            }
        }

        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
        {
            return BadRequest(new { error = "firstName and lastName are required." });
        }

        var normalizedFirstName = dto.FirstName.Trim();
        var normalizedLastName = dto.LastName.Trim();

        var wantsCreate = !string.IsNullOrWhiteSpace(dto.SupporterType);

        if (!wantsCreate)
        {
            var matchIds = await FindSupporterIdsByTripleAsync(
                normalizedFirstName,
                normalizedLastName,
                normalizedEmail);

            if (matchIds.Count == 0)
                return Ok(new { needsSupporterDetails = true });

            if (matchIds.Count > 1)
            {
                return Conflict(new
                {
                    error = "Multiple supporter profiles match this name and email. Contact support to link your account.",
                });
            }

            return await FinalizeDonorLinkAsync(user, matchIds[0]);
        }

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
        if (validationError is not null)
            return BadRequest(new { error = validationError });

        var supporterType = registerShape.SupporterType.Trim();
        var relationshipType = registerShape.RelationshipType.Trim();
        var region = registerShape.Region.Trim();
        var country = registerShape.Country.Trim();
        var phone = registerShape.Phone.Trim();
        var status = registerShape.Status.Trim();
        var acquisitionChannel = registerShape.AcquisitionChannel.Trim();
        var organizationName = string.IsNullOrWhiteSpace(registerShape.OrganizationName)
            ? null
            : registerShape.OrganizationName.Trim();

        if (supporterType != "PartnerOrganization")
        {
            if (string.IsNullOrWhiteSpace(normalizedFirstName) || string.IsNullOrWhiteSpace(normalizedLastName))
                return BadRequest(new { error = "firstName and lastName are required for this supporter type." });
        }

        var existingMatches = await FindSupporterIdsByTripleAsync(
            normalizedFirstName,
            normalizedLastName,
            normalizedEmail);

        if (existingMatches.Count > 1)
        {
            return Conflict(new
            {
                error = "Multiple supporter profiles match this name and email. Contact support.",
            });
        }

        if (existingMatches.Count == 1)
            return await FinalizeDonorLinkAsync(user, existingMatches[0]);

        var createdSupporter = new Supporter
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

        _mainAppDbContext.Supporters.Add(createdSupporter);
        await _mainAppDbContext.SaveChangesAsync();

        return await FinalizeDonorLinkAsync(user, createdSupporter.SupporterId);
    }

    private async Task<List<int>> FindSupporterIdsByTripleAsync(
        string firstName,
        string lastName,
        string normalizedEmail)
    {
        var fn = firstName.Trim().ToLowerInvariant();
        var ln = lastName.Trim().ToLowerInvariant();
        var em = normalizedEmail.Trim().ToLowerInvariant();

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
        var exists = await _mainAppDbContext.Supporters.AnyAsync(s => s.SupporterId == supporterId);
        if (!exists)
            return BadRequest(new { error = "Supporter record was not found." });

        if (!await _userManager.IsInRoleAsync(user, AuthRoles.Donor))
        {
            var roleResult = await _userManager.AddToRoleAsync(user, AuthRoles.Donor);
            if (!roleResult.Succeeded)
            {
                return StatusCode(500, new { error = "Unable to assign donor role." });
            }
        }

        var existingClaims = await _userManager.GetClaimsAsync(user);
        foreach (var c in existingClaims.Where(c => c.Type == SupporterIdClaimType))
        {
            var remove = await _userManager.RemoveClaimAsync(user, c);
            if (!remove.Succeeded)
                return StatusCode(500, new { error = "Unable to update donor profile link." });
        }

        var addClaim = await _userManager.AddClaimAsync(
            user,
            new Claim(SupporterIdClaimType, supporterId.ToString()));

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
            return "No supporter match found. Complete all supporter profile fields to create a new donor link.";
        }

        if (!AllowedSupporterTypes.Contains(supporterType))
        {
            return "Invalid supporterType.";
        }
        if (!AllowedRelationshipTypes.Contains(relationshipType))
        {
            return "Invalid relationshipType.";
        }
        if (!AllowedStatuses.Contains(status))
        {
            return "Invalid status.";
        }
        if (!AllowedAcquisitionChannels.Contains(acquisitionChannel))
        {
            return "Invalid acquisitionChannel.";
        }

        if (supporterType == "PartnerOrganization" && string.IsNullOrWhiteSpace(organizationName))
        {
            return "organizationName is required for PartnerOrganization supporter type.";
        }

        return null;
    }

    private static int? TryGetSupporterIdClaim(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(SupporterIdClaimType);
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return int.TryParse(raw, out var supporterId) ? supporterId : null;
    }
    [AllowAnonymous]
    [HttpGet("google-login")]

public IActionResult GoogleLogin([FromQuery] string? returnUrl = null)
{
    var redirectUrl = Url.Action(nameof(GoogleResponse), "Auth", new { returnUrl });
    var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl!);

    return Challenge(properties, "Google");
}
[AllowAnonymous]
[HttpGet("google-response")]
public async Task<IActionResult> GoogleResponse([FromQuery] string? returnUrl = null)
{
    var frontendBaseUrl = "http://localhost:5173"; // move to config later
    var safeReturnUrl = string.IsNullOrWhiteSpace(returnUrl) ? "/" : returnUrl;

    var info = await _signInManager.GetExternalLoginInfoAsync();
    if (info == null)
    {
        return Redirect($"{frontendBaseUrl}/login?error=external_login_failed");
    }

    var email = info.Principal.FindFirstValue(ClaimTypes.Email);
    var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "Unknown";
    var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname) ?? "User";

    if (string.IsNullOrWhiteSpace(email))
    {
        return Redirect($"{frontendBaseUrl}/login?error=no_email");
    }

    var normalizedEmail = email.Trim().ToLowerInvariant();

    // ======================
    // STEP 1: CHECK EXISTING USER
    // ======================
    var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);

    if (existingUser != null)
    {
        await _signInManager.SignInAsync(existingUser, isPersistent: true);
        return Redirect($"{frontendBaseUrl}{safeReturnUrl}");
    }

    // ======================
    // STEP 2: FIND OR CREATE SUPPORTER
    // ======================
    var supporter = await _mainAppDbContext.Supporters
        .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

    if (supporter == null)
    {
        supporter = new Supporter
        {
            FirstName = firstName,
            LastName = lastName,
            Email = normalizedEmail,
            DisplayName = $"{firstName} {lastName}",

            // SAFE DEFAULTS (valid values from your enums)
            SupporterType = "MonetaryDonor",
            RelationshipType = "International",
            Region = "Unknown",
            Country = "Unknown",
            Phone = "Unknown",
            Status = "Active",
            AcquisitionChannel = "Website",

            CreatedAt = DateTime.UtcNow
        };

        _mainAppDbContext.Supporters.Add(supporter);
        await _mainAppDbContext.SaveChangesAsync();
    }

    // ======================
    // STEP 3: CREATE USER
    // ======================
    var user = new ApplicationUser
    {
        UserName = normalizedEmail,
        Email = normalizedEmail,
        EmailConfirmed = true
    };

    var createResult = await _userManager.CreateAsync(user);
    if (!createResult.Succeeded)
    {
        return Redirect($"{frontendBaseUrl}/login?error=user_create_failed");
    }

    // Assign role
    await _userManager.AddToRoleAsync(user, AuthRoles.Donor);

    // Add supporter claim
    await _userManager.AddClaimAsync(user,
        new Claim(SupporterIdClaimType, supporter.SupporterId.ToString()));

    // Link Google login
    await _userManager.AddLoginAsync(user, info);

    // Sign in
    await _signInManager.SignInAsync(user, isPersistent: true);

    return Redirect($"{frontendBaseUrl}{safeReturnUrl}");
}
}