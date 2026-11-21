using Application.DTOs.Common;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Security;

namespace WebAPI.Controllers;

/// <summary>Read-only installation and daily production views for staff.</summary>
[Route("api/staff-data")]
[Authorize(Policy = Policies.Admin)]
public class StaffDataController(AppDbContext db) : ApiControllerBase
{
    [HttpGet("installations")]
    public async Task<ActionResult<PagedResponse<InstallationRow>>> Installations([FromQuery] PageRequest request, CancellationToken ct)
    {
        var query = db.Installations.AsNoTracking().OrderByDescending(x => x.Id);
        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Offset()).Take(request.PageSize)
            .Select(x => new InstallationRow(x.Id, x.Customer.FirstName + " " + x.Customer.LastName,
                x.Address.City + ", " + x.Address.State, x.Status.ToString(), x.TimeZone, x.CreatedAt))
            .ToListAsync(ct);
        return Ok(new PagedResponse<InstallationRow>(rows, request.Page, request.PageSize, total));
    }

    [HttpGet("production")]
    public async Task<ActionResult<ProductionOverview>> Production(CancellationToken ct)
    {
        var day = await db.EnergyProduction.MaxAsync(x => (DateOnly?)x.Day, ct);
        if (day is null) return Ok(new ProductionOverview(null, 0, [], []));
        var rows = await db.EnergyProduction.AsNoTracking().Where(x => x.Day == day)
            .Select(x => new ProductionRow(x.InstallationId,
                x.Installation.Customer.FirstName + " " + x.Installation.Customer.LastName,
                x.ActualKwh, x.ExpectedKwh, x.Health.ToString(), x.ReadingCount))
            .ToListAsync(ct);
        var counts = Enum.GetValues<ProductionHealth>()
            .Select(h => new HealthCount(h.ToString(), rows.Count(x => x.Health == h.ToString()))).ToList();
        var worst = rows.Where(x => x.ExpectedKwh > 0).OrderBy(x => x.ActualKwh / x.ExpectedKwh).Take(20).ToList();
        return Ok(new ProductionOverview(day, rows.Count, counts, worst));
    }
}

public sealed record InstallationRow(int Id, string CustomerName, string Location, string Status, string TimeZone, DateTime CreatedAt);
public sealed record HealthCount(string Health, int Count);
public sealed record ProductionRow(int InstallationId, string CustomerName, decimal ActualKwh, decimal ExpectedKwh,
    string Health, int ReadingCount);
public sealed record ProductionOverview(DateOnly? Day, int InstallationCount, IReadOnlyList<HealthCount> HealthCounts,
    IReadOnlyList<ProductionRow> WorstPerformers);
