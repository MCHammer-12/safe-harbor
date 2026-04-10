using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Infrastructure
{
    public static class SecurityHeaders
    {
        /// <summary>
        /// Optional space-, comma-, or semicolon-separated origins appended to connect-src in all environments.
        /// Set in Azure App Settings or appsettings, e.g. "https://api.example.com".
        /// </summary>
        private const string AdditionalConnectSrcConfigKey = "Csp:AdditionalConnectSrc";

        /// <summary>Production SPA / API hosts the browser may call via fetch/XHR (cross-origin from static hosts).</summary>
        private const string ProductionConnectSrcHosts =
            "https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com " +
            "https://safeharbor.mhammerventures.com " +
            "https://safe-harbor-agfugefsecgnafh2.centralus-01.azurewebsites.net";

        private static string ExpandOptionalConnectSrc(IConfiguration configuration)
        {
            var raw = configuration[AdditionalConnectSrcConfigKey];
            if (string.IsNullOrWhiteSpace(raw))
            {
                return string.Empty;
            }

            var sb = new System.Text.StringBuilder();
            foreach (var part in raw.Split([' ', ',', ';'], StringSplitOptions.RemoveEmptyEntries))
            {
                var p = part.Trim();
                if (p.Length > 0)
                {
                    sb.Append(' ').Append(p);
                }
            }

            return sb.ToString();
        }

        private static string BuildDevelopmentContentSecurityPolicy(IConfiguration configuration)
        {
            var extraConnect = ExpandOptionalConnectSrc(configuration);
            return
                "default-src 'self'; " +
                "base-uri 'self'; " +
                "frame-ancestors 'none'; " +
                "object-src 'none'; " +
                "form-action 'self' https://accounts.google.com; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data: https:; " +
                "connect-src 'self' " +
                "http://localhost:5173 https://localhost:5173 http://127.0.0.1:5173 https://127.0.0.1:5173 " +
                "ws://localhost:5173 wss://localhost:5173 ws://127.0.0.1:5173 wss://127.0.0.1:5173 " +
                "https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com " +
                ProductionConnectSrcHosts +
                extraConnect +
                ";";
        }

        private static string BuildProductionContentSecurityPolicy(IConfiguration configuration)
        {
            var extraConnect = ExpandOptionalConnectSrc(configuration);
            return
                "default-src 'self'; " +
                "base-uri 'self'; " +
                "frame-ancestors 'none'; " +
                "object-src 'none'; " +
                "form-action 'self' https://accounts.google.com; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data: https:; " +
                "connect-src 'self' " +
                ProductionConnectSrcHosts +
                extraConnect +
                ";";
        }

        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            var environment = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();
            var configuration = app.ApplicationServices.GetRequiredService<IConfiguration>();
            var developmentCsp = BuildDevelopmentContentSecurityPolicy(configuration);
            var productionCsp = BuildProductionContentSecurityPolicy(configuration);

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
                                developmentCsp;
                        }
                        else
                        {
                            context.Response.Headers["Content-Security-Policy"] =
                                productionCsp;
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
