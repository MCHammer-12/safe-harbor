using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using backend.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

// ==============================
// SERVICES
// ==============================

// Controllers
builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Main application database
builder.Services.AddDbContext<MainAppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("MainAppDbConnection")));

// Identity database
builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("AuthConnection")));

// ASP.NET Identity with roles
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password policy
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 14;
})
.AddEntityFrameworkStores<AuthIdentityDbContext>()
.AddDefaultTokenProviders();

// Cookie settings
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
});

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://safe-harbor.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Authorization
builder.Services.AddAuthorization();

var app = builder.Build();

// ==============================
// SEED DEFAULT IDENTITY DATA
// ==============================

using (var scope = app.Services.CreateScope())
{
    await AuthIdentityGenerator.GenerateDefaultIdentityAsync(
        scope.ServiceProvider,
        app.Configuration);
}

// ==============================
// MIDDLEWARE PIPELINE
// ==============================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseSecurityHeaders();

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();