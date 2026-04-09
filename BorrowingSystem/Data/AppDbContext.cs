using BorrowingSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace BorrowingSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<BorrowRecord> BorrowRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
            modelBuilder.Entity<User>()
                .HasIndex(u => u.IdNumber)
                .IsUnique();

            // Item configuration
            modelBuilder.Entity<Item>()
                .HasKey(i => i.Id);

            // BorrowRecord configuration
            modelBuilder.Entity<BorrowRecord>()
                .HasKey(br => br.Id);
            modelBuilder.Entity<BorrowRecord>()
                .HasOne(br => br.User)
                .WithMany(u => u.BorrowRecords)
                .HasForeignKey(br => br.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BorrowRecord>()
                .HasOne(br => br.Item)
                .WithMany()
                .HasForeignKey(br => br.ItemId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
