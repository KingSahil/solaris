using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class EnergyProductionConfiguration : IEntityTypeConfiguration<EnergyProduction>
{
    public void Configure(EntityTypeBuilder<EnergyProduction> builder)
    {
        builder.ToTable("energy_production");
        builder.HasKey(x => new { x.InstallationId, x.Day }).HasName("pk_energy_production");
        builder.Property(x => x.InstallationId).HasColumnName("installation_id");
        builder.Property(x => x.Day).HasColumnName("day");
        builder.Property(x => x.ActualKwh).HasColumnName("actual_kwh").HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.ExpectedKwh).HasColumnName("expected_kwh").HasPrecision(10, 2).IsRequired();
        builder.Property(x => x.Health).HasColumnName("health").HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(x => x.ReadingCount).HasColumnName("reading_count").IsRequired();
        builder.Property(x => x.ComputedAt).HasColumnName("computed_at").IsRequired();
        builder.HasIndex(x => new { x.Day, x.Health }).HasDatabaseName("ix_energy_production_day_health");
        builder.HasOne(x => x.Installation).WithMany().HasForeignKey(x => x.InstallationId)
            .HasConstraintName("fk_energy_production_installations_installation_id").OnDelete(DeleteBehavior.Cascade);
    }
}
