using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using backend.Models.DTOs;
using backend.Models;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

   [HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    var user = new ApplicationUser
    {
        UserName = dto.Email,
        Email = dto.Email
    };

    var result = await _userManager.CreateAsync(user, dto.Password);

    if (!result.Succeeded)
    {
        return BadRequest(result.Errors.Select(e => new
        {
            code = e.Code,
            description = e.Description
        }));
    }

    
    await _userManager.AddToRoleAsync(user, AuthRoles.Donor);

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
                roles = Array.Empty<string>()
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
            roles
        });
    }
}