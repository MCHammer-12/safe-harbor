using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Infrastructure
{
    public static class SecurityHeaders
    {
        private const string DevelopmentContentSecurityPolicy =
            "default-src 'self'; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'; " +
            "object-src 'none'; " +
            "form-action 'self' https://accounts.google.com; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data: https:; " +
            "connect-src 'self' " +
                "http://localhost:5173 https://localhost:5173 ws://localhost:5173 wss://localhost:5173 " +
                "https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com;";

        private const string ProductionContentSecurityPolicy =
            "default-src 'self'; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'; " +
            "object-src 'none'; " +
            "form-action 'self' https://accounts.google.com; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data: https:; " +
            "connect-src 'self' " +
                "https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com " +
                "https://safeharbor.mhammerventures.com;";

        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            var environment = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();

            return app.Use(async (context, next) =>
            {
                context.Response.OnStarting(() =>
                {
                    var isSwaggerInDevelopment =
                        environment.IsDevelopment() &&
                        context.Request.Path.StartsWithSegments("/swagger");

                    if (!isSwaggerInDevelopment)
                    {
                        if (environment.IsDevelopment())
                        {
                            context.Response.Headers["Content-Security-Policy-Report-Only"] =
                                DevelopmentContentSecurityPolicy;
                        }
                        else
                        {
                            context.Response.Headers["Content-Security-Policy"] =
                                ProductionContentSecurityPolicy;
                        }

                        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                        context.Response.Headers["X-Frame-Options"] = "DENY";
                        context.Response.Headers["Permissions-Policy"] =
                            "accelerometer=(), autoplay=(), camera=(), display-capture=(), " +
                            "geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()";
                    }

                    return Task.CompletedTask;
                });

                await next();
            });
        }
    }
}