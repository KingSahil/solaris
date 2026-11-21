-- Local demo only. Creates up to 30 days of synthetic rollups for active installations.
-- Rows already present for the same installation/day are left untouched.
WITH demo_days AS (
    SELECT generated_day::date AS day
    FROM generate_series(current_date - 29, current_date, interval '1 day') AS generated_day
), demo_rows AS (
    SELECT
        i.id AS installation_id,
        d.day,
        (25 + ((i.id * 7) % 16))::numeric(10, 2) AS expected_kwh,
        (i.id + extract(doy FROM d.day)::integer) % 5 AS health_index
    FROM installations AS i
    CROSS JOIN demo_days AS d
    WHERE i.status = 'Active'
)
INSERT INTO energy_production
    (installation_id, day, actual_kwh, expected_kwh, health, reading_count, computed_at)
SELECT
    installation_id,
    day,
    round(expected_kwh * CASE health_index
        WHEN 0 THEN 1.05
        WHEN 1 THEN 0.92
        WHEN 2 THEN 0.70
        WHEN 3 THEN 0.30
        ELSE 0.00
    END, 2),
    expected_kwh,
    CASE health_index
        WHEN 0 THEN 'Excellent'
        WHEN 1 THEN 'Good'
        WHEN 2 THEN 'Warning'
        WHEN 3 THEN 'Critical'
        ELSE 'Offline'
    END,
    CASE health_index WHEN 4 THEN 0 ELSE 96 END,
    now()
FROM demo_rows
ON CONFLICT (installation_id, day) DO NOTHING;
