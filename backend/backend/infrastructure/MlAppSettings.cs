using Microsoft.Extensions.Configuration;

namespace backend.Infrastructure;

/// <summary>
/// Resolves ML FastAPI base URL and API key from configuration and environment.
/// Azure App Service maps <c>Ml__BaseUrl</c> to <c>Ml:BaseUrl</c>; typo keys are checked explicitly.
/// In Production/Staging, a loopback <c>Ml:BaseUrl</c> from published JSON is ignored so a real app setting can win.
/// </summary>
public static class MlAppSettings
{
    public static string? ResolveBaseUrl(IConfiguration configuration)
    {
        var raw = configuration["Ml:BaseUrl"]?.Trim();
        if (!string.IsNullOrEmpty(raw))
        {
            if (!(IsProductionLike() && IsLoopbackUrl(raw)))
                return NormalizeBaseUrl(raw);
        }

        foreach (var key in new[] { "Ml__BaseUrl", "APPSETTING_Ml__BaseUrl", "Ml_BaseUrl" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrEmpty(v))
                return NormalizeBaseUrl(v);
        }

        return null;
    }

    public static string? ResolveApiKey(IConfiguration configuration)
    {
        var k = configuration["Ml:ApiKey"]?.Trim();
        if (!string.IsNullOrEmpty(k))
            return k;

        foreach (var key in new[] { "Ml__ApiKey", "APPSETTING_Ml__ApiKey", "Ml_ApiKey" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrEmpty(v))
                return v;
        }

        return null;
    }

    private static string NormalizeBaseUrl(string url) => url.TrimEnd('/');

    private static bool IsProductionLike()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        return string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(env, "Staging", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLoopbackUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return false;
        return uri.IsLoopback;
    }
}
