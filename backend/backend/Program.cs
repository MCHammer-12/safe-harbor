using backend.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<MainAppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("MainAppDbConnection")));

builder.Services.AddHttpClient("MlApi", (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var baseUrl = cfg["Ml:BaseUrl"]?.Trim().TrimEnd('/');
    if (!string.IsNullOrWhiteSpace(baseUrl))
        client.BaseAddress = new Uri(baseUrl + "/");
    client.Timeout = TimeSpan.FromSeconds(120);
});

const string FrontendCorsPolicy = "FrontendCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://safe-harbor.vercel.app",
                "https://nice-beach-0045c401e.6.azurestaticapps.net",
                "https://safeharbor.mhammerventures.com"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors(FrontendCorsPolicy);

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/Ml", StringComparison.OrdinalIgnoreCase))
    {
        var started = DateTime.UtcNow;
        await next();
        var elapsedMs = (DateTime.UtcNow - started).TotalMilliseconds;
        app.Logger.LogInformation(
            "ML request {Method} {Path} -> {StatusCode} in {ElapsedMs:0.0}ms",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            elapsedMs);
        return;
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();

app.Run();
