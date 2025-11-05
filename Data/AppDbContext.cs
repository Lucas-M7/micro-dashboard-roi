using micro_dashboard_roi.Models;
using Microsoft.EntityFrameworkCore;

namespace micro_dashboard_roi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    { }

    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<DailyLog> DailyLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Campaign>(campaign =>
        {
            campaign.ToTable("tb_campanhas");

            campaign.Property(p => p.Name)
                .IsRequired()
                .HasColumnName("nome_campanha");

            campaign.Property(p => p.Product)
            .IsRequired()
            .HasColumnName("nome_produto");

            campaign.HasMany(c => c.Logs)
                .WithOne(l => l.Campaign)
                .HasForeignKey(l => l.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DailyLog>(daily =>
        {
            daily.ToTable("tb_lancamentos");

            daily.Property(p => p.Date)
                .HasColumnName("data_lancamento")
                .IsRequired()
                .HasDefaultValueSql("GETDATE()");

            daily.Property(p => p.Spend)
                .IsRequired()
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("gasto");

            daily.Property(p => p.Revenue)
                .IsRequired()
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("receita");
        });
    }
}