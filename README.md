# Solaris

A CRM backend for a fictional solar-panel installer: from a website quote request to a running solar
system, then that system's daily electricity production.

The focus is on staying correct when things go wrong:

- notifications that are never lost, even when the mail server is down or the API crashes
- no duplicate records and no lost updates when people and devices act at the same time
- production dashboards that stay fast with more than 10 million telemetry readings

Each of these is built naively first, measured, fixed, and measured again. The results will be published
here with the method to reproduce them.

## Status

Version 1 is being built on top of an earlier version. The local app includes a public quote site and a staff
panel backed by the API and PostgreSQL. To start all four parts locally, follow the [Quick start](#quick-start).
More configuration details are in [Operations: running locally](docs/operations.md#running-locally).

## Quick start

You need .NET 10, Node.js 22.13 or newer, and Docker Desktop. Start Docker Desktop first. Open **three PowerShell
terminals** in the repository folder. Keep each terminal open while using its app.

### 1. Configure and start PostgreSQL

The first time, make a local `.env` file from the example and fill in the required values. Use your own local-only
values; do not share or commit `.env`.

```powershell
Copy-Item .env.example .env
```

At minimum, set `POSTGRES_PASSWORD`, make the password in `ConnectionStrings__Default` match it, set a `Jwt__Secret`
of at least 32 characters, and fill in `Admin__Name`, `Admin__Email`, `Admin__Password`, and `Email__FromAddress`.
The Admin values are used to create the first Admin account if the database has no Admin yet. In Development the
email provider is Recording, so the app does not send real emails.

Start the database (Docker Compose reads `.env` automatically):

```powershell
docker compose up -d
```

### 2. Restore dependencies (first time, or after dependency changes)

Run these from the repository root:

```powershell
dotnet restore backend/Solaris.slnx
npm install --prefix frontend/marketing
npm install --prefix frontend/staff
```

### 3. Start the backend API

In one terminal at the repository root, load `.env` into that PowerShell process and run the API. The API does not
read `.env` by itself; this step passes those settings to it.

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=\s]+)\s*=\s*(.*)\s*$') {
    $name = $Matches[1]
    $value = $Matches[2].Trim()
    if ($value.Length -ge 2 -and $value[0] -eq '"' -and $value[$value.Length - 1] -eq '"') {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}
dotnet run --project backend/src/WebAPI
```

The API listens at `http://localhost:5228`. Leave this terminal running.

### 4. Start the marketing site

In a second terminal, from the repository root:

```powershell
Set-Location frontend/marketing
npm run dev
```

Open `http://localhost:5173` for the public website and quote form. Its `/api` requests are forwarded to the API.

### 5. Start the staff panel

In a third terminal, from the repository root:

```powershell
Set-Location frontend/staff
npm run dev
```

Open `http://localhost:5174` and sign in with the Admin email and password from `.env`. Its `/api` requests are
forwarded to `http://localhost:5228`.

### Optional: add local demo production readings

The SQL below creates synthetic daily readings for Active installations. Use it only with your local demo database;
the values are fictional and are not live inverter data.

```powershell
Get-Content -Raw scripts/seed-demo-production.sql | docker compose exec -T postgres psql -U postgres -d solaris
```

To stop a service, press **Ctrl+C** in that service's terminal. Stop PostgreSQL with `docker compose down`; this
keeps its saved data. `docker compose down -v` also deletes the database data.

## Stack

ASP.NET Core (.NET 10) · EF Core · PostgreSQL · Hangfire · MailKit ·
React + TypeScript + Vite (the marketing site and quote form, and the staff app) · TanStack Query

## Documentation

- [Domain](docs/domain.md): the business, its vocabulary, the people involved and the customer journey
- [Functional requirements](docs/functional-requirements.md): what the system must do, and its business rules
- [Non-functional requirements](docs/non-functional-requirements.md): the scale and the quality targets
- [Architecture](docs/architecture.md): how the system is built
- [Architecture decisions](docs/adr/): one record per decision, with its options and trade-offs
- [Testing](docs/testing.md): what is tested, at which level, and how
- [Operations](docs/operations.md): configuration, running, CI and deployment
- [AI app handoff](docs/AI_HANDOFF.md): code map, running services, existing routes, seeded demo data and known implementation limits
- [Measurements](docs/measurements.md): the four measured problems, their method and their results

## License

[MIT](LICENSE)
