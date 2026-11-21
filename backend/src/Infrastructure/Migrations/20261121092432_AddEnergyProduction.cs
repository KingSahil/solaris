using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEnergyProduction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Preserve production rows made by the previous local demo version when adopting this migration chain.
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS energy_production (
                    installation_id integer NOT NULL,
                    day date NOT NULL,
                    actual_kwh numeric(10,2) NOT NULL,
                    expected_kwh numeric(10,2) NOT NULL,
                    health character varying(16) NOT NULL,
                    reading_count integer NOT NULL,
                    computed_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_energy_production PRIMARY KEY (installation_id, day),
                    CONSTRAINT fk_energy_production_installations_installation_id
                        FOREIGN KEY (installation_id) REFERENCES installations (id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ix_energy_production_day_health ON energy_production (day, health);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "energy_production");
        }
    }
}
