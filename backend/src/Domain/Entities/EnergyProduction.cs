using Domain.Enums;

namespace Domain.Entities;

/// <summary>A daily production rollup for a solar installation.</summary>
public class EnergyProduction
{
    public int InstallationId { get; set; }
    public Installation Installation { get; set; } = null!;
    public DateOnly Day { get; set; }
    public decimal ActualKwh { get; set; }
    public decimal ExpectedKwh { get; set; }
    public ProductionHealth Health { get; set; }
    public int ReadingCount { get; set; }
    public DateTime ComputedAt { get; set; }
}
