using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;


namespace backend.Models
{
    public class AuthIdentityDbContext : IdentityDbContext<ApplicationUser>
    {
        public AuthIdentityDbContext(DbContextOptions<AuthIdentityDbContext> options)
            : base(options)
        {
        }

        // You can add additional DbSet properties for other entities if needed
        // For example:
        // public DbSet<YourEntity> YourEntities { get; set; }
    }
}
