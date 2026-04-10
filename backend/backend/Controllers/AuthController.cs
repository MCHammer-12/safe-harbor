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
            createdSupporter = new Supporter
            {
                FirstName = normalizedFirstName,
                LastName = normalizedLastName,
                Email = normalizedEmail,
                DisplayName = $"{normalizedFirstName} {normalizedLastName}",
                SupporterType = dto.SupporterType,
                RelationshipType = dto.RelationshipType,
                Region = dto.Region,
                Country = dto.Country,
                Phone = dto.Phone,
                Status = dto.Status,
                AcquisitionChannel = dto.AcquisitionChannel,
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
        await _userManager.AddClaimAsync(user,
            new Claim(SupporterIdClaimType, supporterId.ToString()));

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