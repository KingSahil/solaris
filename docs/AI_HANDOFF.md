# Solaris app handoff

This guide is a short map for a developer or AI agent joining the Solaris workspace. Treat the code as the source of truth; the product requirements describe intended behavior and can be ahead of what is implemented.

## Product in one paragraph

Solaris is a fictional US solar installer CRM. A homeowner submits a quote request, sales can convert the lead to a customer, the project is tracked as an installation, and active systems contribute daily production figures to the fleet dashboard. Staff sign in as Admins or Technicians. The public marketing site and staff panel are separate React apps backed by one ASP.NET Core API and PostgreSQL database.

## Workspace map

| Path | Responsibility |
|---|---|
| `frontend/marketing` | Public website and three-step quote form. |
| `frontend/staff` | Signed-in office panel. It uses an HttpOnly session cookie and TanStack Query. |
| `frontend/brand` | Shared fonts, design tokens, icons and component styles. |
| `backend/src/Domain` | Entities, enums and domain rules. |
| `backend/src/Application` | Use cases, DTOs, validators, service and repository interfaces. |
| `backend/src/Infrastructure` | EF Core/PostgreSQL, repositories, email/outbox, auth implementation and migrations. |
| `backend/src/WebAPI` | Controllers, configuration, auth policies, middleware and Development-only tooling. |
| `backend/tests` | Unit and integration tests. Integration tests use Testcontainers. |
| `docs` | Domain, requirements, architecture, operations, testing and measurements. |
| `perf` | Load-test scripts and recorded runs. Do not use performance fixtures as ordinary CRM data. |

## Local URLs and data path

| Service | Local URL / port | Notes |
|---|---|---|
| Marketing site | `http://localhost:5173` | Vite forwards `/api/*` to the API. `API_PROXY_TARGET` overrides the default. |
| Staff panel | `http://localhost:5174` | Vite forwards `/api/*` to the API. The cookie stays on this origin. |
| API | `http://localhost:5228` | HTTP launch profile; OpenAPI is at `/openapi/v1.json`, Scalar at `/scalar/v1`. |
| PostgreSQL | `localhost:5433` | Docker Compose maps the local-only host port to container port 5432. |

The quote form calls `POST /api/leads`. In Development, the API saves the lead, its address, and two outbox notifications; the background dispatcher sends through the Recording provider by default. Recording does not deliver real email. The staff app calls the API on its own origin; do not put a JWT in frontend storage. The API sets an HttpOnly cookie.

## Current staff-panel features

| Panel section | Current behavior | Data source |
|---|---|---|
| Leads | Paginated list, newest first. Public submissions create leads. | `GET/POST /api/leads`; lead conversion is `POST /api/leads/convert`. |
| Customers | Paginated directory with contact, location, Prospect/Active/Inactive state and registration date. | `GET /api/customers`; conversion creates a customer. |
| Installations | Paginated read-only list of customer, address, stage, time zone and creation date. | `GET /api/staff-data/installations`. A converted lead creates a Survey-stage installation through the existing flow. |
| Production | Latest stored day, health counts and lowest-output systems. | `GET /api/staff-data/production`, backed by `energy_production`. |
| Notifications | List of outbox emails that have Failed after the retry window; individual or bulk retry. | `GET /api/notifications/failed`, `POST /api/notifications/{id}/retry`, `POST /api/notifications/failed/retry`. |
| Users | Staff directory; Admins create technicians and manage accounts. | `/api/users` endpoints. Use the UI so its one-time password handling stays intact. |

Installations and Production currently support read/display and seeded demo history. Full installation status history, technician assignments, device ingestion, production recalculation and month/year charts are not implemented just because the matching requirements are documented. Keep that distinction clear when answering questions or extending the product.

## Main API routes

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`: staff session.
- `GET /api/leads?page=1&pageSize=20`: Admin lead list; `POST /api/leads`: public quote submission.
- `PUT /api/leads/{id}/status`, `POST /api/leads/convert`: lead handling and conversion.
- `GET /api/customers?page=1&pageSize=20`: Admin customer list.
- `GET /api/staff-data/installations?page=1&pageSize=20`: Admin installation list.
- `GET /api/staff-data/production`: Admin fleet summary for the latest stored day.
- `GET /api/notifications/failed`: Admin failed-notification list.
- `GET/POST /api/users`: Admin staff list and technician creation.
- `GET/PUT /api/dev/email-fault`: Development-only fault injection for measurement/demo purposes. Turn it off after use.

All staff routes require the Admin policy unless a controller says otherwise. The Controllers are thin where established services exist; business changes belong in Application services and should save through the Unit of Work. The read-only staff data controller currently uses EF projections for its small dashboard views.

## Database and migrations

EF Core entities are configured explicitly with snake_case table and column names. `AppDbContext` applies configurations from `Infrastructure`. Migrations live under `backend/src/Infrastructure/Migrations`. Development applies migrations at API startup. The current new read models are:

- `installations`: customer/address, current stage, optional design details and time zone.
- `energy_production`: one daily record per installation/day, with actual/expected kWh, health, reading count and computed time.

The production values in the local database are synthetic preview data, not inverter telemetry or measured solar performance. A repeatable local-only generator is at `scripts/seed-demo-production.sql`; it adds up to 30 days for Active installations and leaves existing installation/day rows untouched.

## Running locally

Prerequisites: .NET 10 SDK, Node 22.13+ (or 24/26+), and Docker Desktop.

1. Copy `.env.example` to `.env`; fill in local-only database password, JWT secret, initial Admin and `Email__FromAddress`. Never commit or print `.env` values.
2. At the repo root, run `docker compose up -d`.
3. Restore/build the API: `dotnet restore backend/Solaris.slnx`.
4. Install frontend packages in both app directories: `npm install --prefix frontend/marketing` and `npm install --prefix frontend/staff`.
5. Start the API from `backend/src/WebAPI` with the `.env` entries loaded into that process. The API does not read `.env` itself.
6. Run `npm run dev` from `frontend/marketing` and from `frontend/staff` in separate terminals.

The repo's [operations guide](operations.md#running-locally) has the detailed configuration and start commands. If a frontend reports 404 for an API call, check that its Vite `/api` proxy is loaded and that the API is listening on port 5228; a missing API gives a 502 through the proxy, while an API response such as 401 means the route exists but needs a session.

## Demo data currently in the local database

- 12 fictional quote leads from the earlier demo seed; 5 were converted to customers using the existing lead-conversion endpoint.
- Five installations linked to those customers: four Active and one at Survey. The customer records with Active installations were updated to Active.
- 30 days of synthetic daily production for each of the four Active installations (120 rows total). The local seed SQL can generate similar sample history for any Active installation in a freshly set up local database.
- Jordan Ellis is a fictional `.example` lead used to create two failed outbox notifications through the Development email-fault switch. Their timestamps and attempts are aged for the panel preview. Fault injection is turned off after seeding.
- Riley Grant is a fictional technician created from the Users page. The generated password was shown once at creation and is only provided in the handoff response; don't copy it into code or this document.

All `.example` addresses are reserved sample addresses. Seed values are local demo data, not real prospects or real production measurements.

## Work rules for future agents

- Read `docs/functional-requirements.md`, `docs/architecture.md`, and the specific ADR before changing a business flow.
- Inspect `git status --short` first and preserve unrelated user changes. `package-lock.json` files may already be user-generated changes.
- Search for the existing page, API client and service before adding a second path for the same action.
- Do not add seed-only production shortcuts to normal endpoints. Keep demo seed instructions or fixtures separate and visibly synthetic.
- New data fields require EF configuration, a migration, DTO/schema updates, and a UI consumer where relevant.
- Use `npm run build --prefix frontend/staff` and `dotnet build backend/src/WebAPI/WebAPI.csproj -c Release` for compile checks. Run tests only when requested.
- Never claim the installation workflow, telemetry ingestion, email delivery, or production calculations are fully implemented without verifying the corresponding code path.
