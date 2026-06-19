# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KabaRent is a wedding/event equipment rental management system (rental items are called "Kabas"). It has a Spring Boot backend and a React frontend.

> **Canonical reference:** For a detailed AS-IS audit of the codebase (risks, debt, testing, architecture), see [`docs/CODEBASE_REVIEW_2026.md`](docs/CODEBASE_REVIEW_2026.md). Note that `docs/ARCHITECTURE.md` and `docs/DESIGN.md` are flagged as possibly stale pending a later audit — do not trust them blindly.

## Commands

### Backend
```bash
cd backend
mvn spring-boot:run        # Start API server on http://localhost:8080
mvn clean install          # Build JAR
mvn test                   # Run tests (see note below)
```

- The backend connects to **PostgreSQL** via environment variables — `spring.datasource.url=${DB_URL}`, `${DB_USER}`, `${DB_PASSWORD}` (configured in `application.properties`; the old local `myuser`/`mypassword` block is commented out). In **production the database is Neon-hosted** (serverless Postgres); locally, point `DB_URL` at any reachable Postgres (e.g. `jdbc:postgresql://localhost:5432/kabarent`). A reachable Postgres must be running before `spring-boot:run`.
- `spring.jpa.hibernate.ddl-auto=update` — Hibernate creates/updates tables on startup and **data persists across restarts**. There is no H2 and no automatic seed data.
- `DataInitializer.java` seeds the **admin user** from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) on startup; there is otherwise **no seed data** — initial inventory/customers are entered manually via the admin dashboard.

### Running tests
`mvn test` runs both layers:
- **Service unit tests** (`AvailabilityServiceTest`, `OrderServiceTest`, `PaymentServiceTest`) — plain Mockito, no infrastructure needed.
- **Repository integration test** (`OrderItemRepositoryIT`) — uses **Testcontainers** to start a real `postgres:16-alpine` container, so **Docker must be running** for the full suite to pass.

### Frontend
```bash
cd frontend
npm install
npm run dev                # Dev server on http://localhost:5173
npm run build
npm run lint
```

## Architecture

### Backend (Spring Boot 3, Java 21)

Standard layered architecture: `Controller → Service → Repository → PostgreSQL (JPA)`

**Packages under `com.kabarent`:**
- `controller/` — REST controllers for `Kaba`, `Order`, `Customer`, `Payment`; plus `AuthController` (`/api/auth/**`) and `MyOrderController` (`/api/my/**`, customer self-service)
- `service/` — Business logic; `AvailabilityService` is the most critical (prevents double-booking); `AuthService` handles register/login
- `repository/` — Spring Data JPA interfaces; `OrderItemRepository` has custom JPQL queries for date-overlap detection, and `KabaRepository.findByIdWithLock` takes a pessimistic write lock
- `model/` — JPA entities: `Kaba`, `Customer`, `Order`, `OrderItem`, `Payment` + enums (incl. `Role`). `Customer` has nullable `passwordHash` (BCrypt) and `role` (CUSTOMER/ADMIN); **`phone` is the NOT-NULL, UNIQUE identity (canonical E.164)** and `email` is now **nullable** (unique-when-present)
- `security/` — `SecurityConfig` filter chain (fail-closed), `JwtService`, `JwtAuthenticationFilter`, `CustomerUserDetailsService`, `CustomerPrincipal` (carries `customerId`)
- `dto/request/` & `dto/response/` — API boundary DTOs (validation annotations on request DTOs)
- `exception/` — `GlobalExceptionHandler` (@RestControllerAdvice) maps domain exceptions to HTTP status codes (incl. 401/403)
- `config/` — `CorsConfig` (`CorsConfigurationSource` consumed by Spring Security), `SecurityConfig`, `DataInitializer` (seeds the admin user from env via `CommandLineRunner`)

**Authorization (Spring Security 6, stateless JWT) — fail closed (`anyRequest().authenticated()`):**
- **Public:** `POST /api/auth/**`, `GET /api/kabas/**`, `POST /api/orders` (guest checkout).
- **ROLE_CUSTOMER:** `/api/my/**` only.
- **ROLE_ADMIN:** everything else — `GET/PUT /api/orders/**` (incl. `GET /api/orders/{id}`, which is **never public** because ids are sequential), `/api/customers/**`, `/api/payments/**`, and kaba mutations.
- **Security-critical:** `customerId` is **always** derived from the JWT principal (`CustomerPrincipal`), never from a request parameter; every `/api/my/**` access is ownership-checked (mismatch → 404).

**Identity / login model (phone-based):**
- **Customers log in by phone + password.** Phone is the canonical **E.164** identity, normalized via `PhoneNumberService.normalizeToE164` (Google libphonenumber, default region **IL**); it is the single point of truth — nothing else normalizes phone numbers. `customers.phone` is NOT NULL + UNIQUE; `email` is optional (nullable, unique-when-present, blanks coerced to NULL).
- **Admin logs in by email + password**, seeded from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) with a placeholder phone `"-"`.
- **Single login endpoint** (`POST /api/auth/login`) takes `{ identifier, password }` and **sniffs the identifier in `CustomerUserDetailsService`**: contains `@` → look up by email (admin); otherwise normalize to E.164 and look up by phone (customer). Guests (null `passwordHash`) cannot authenticate.
- Validation/exceptions: `@ValidPhone` (`PhoneValidator` → `PhoneNumberService`) on register/customer DTOs; `InvalidPhoneNumberException` → 400, `PhoneAlreadyRegisteredException` → 409.

**Key business rules:**
- Availability is **quantity-based**: each Kaba has a `quantity`, and a date range is bookable while booked units stay below that quantity. Only `CONFIRMED` and `ACTIVE` orders consume inventory; `PENDING` and `CANCELLED` do not.
- **Confirm-time safety:** `PENDING` orders do not hold stock, so two orders can both pass the create-time check. When an order is confirmed, `OrderService` takes a **row-level write lock** on each Kaba (`findByIdWithLock`) and **re-validates** availability (excluding the order itself) before committing, so the second concurrent confirm is rejected instead of overbooking.
- Order status transitions are enforced (`validateTransition`):
  - `PENDING → CONFIRMED` or `CANCELLED`
  - `CONFIRMED → ACTIVE` or `CANCELLED`
  - `ACTIVE → COMPLETED`
  - `COMPLETED` and `CANCELLED` are **terminal** (no transitions out). In particular, an `ACTIVE` order **cannot** be cancelled.
- Payments are split-allowed but the sum of `COMPLETED` payments cannot exceed the order's `totalPrice`; fully-paid orders reject further payments.
- Customers are **find-or-create by phone**: `CustomerService.findOrCreateByPhone` normalizes the phone to E.164 and returns the existing customer or creates a new one, avoiding `UNIQUE(phone)` violations for returning customers. Guest checkout (`POST /api/orders`) passes `customer` details and find-or-creates server-side (keyed on phone; email optional); registering with a guest's phone **upgrades that same row in place** (sets `passwordHash`, `role=CUSTOMER`), which auto-links the guest's past orders to the account. Registering a phone that already has a `passwordHash` → 409 (`PhoneAlreadyRegisteredException`).
- **Customer self-cancel** (`POST /api/my/orders/{id}/cancel`) is restricted to **PENDING** orders only; CONFIRMED orders must be cancelled by admin. (Cancelling a PENDING order releases no inventory, since PENDING reserves none.)
- Kabas use soft delete (`active` boolean); they remain in DB but are hidden from customer/active views.

**Data relationships:**
```
Customer (1) → (∞) Order (1) → (∞) OrderItem (∞) → (1) Kaba
Order (1) → (∞) Payment
```

### Frontend (React 19, Vite, Tailwind CSS)

**Routing** (`App.jsx` with React Router v7):
- `/` — `BrowsePage` (customer landing: search by date, availability grid)
- `/order/new` — `NewOrderPage` (multi-step booking, reads `kabaId`/`eventDate`/`returnDate` from query params)
- `/order/:id` — `OrderStatusPage` (post-checkout: renders the order from router state; on a cold visit with no session it redirects to `/register`, since order reads are not public)
- `/login`, `/register` — customer auth (Hebrew RTL); `/customer/orders` + `/customer/orders/:id` — "My Orders" (wrapped in `RequireCustomer`)
- Content/info pages: `/about`, `/how-it-works`, `/faq`, `/contact`, `/rental-terms`, `/returns`, `/privacy` (rendered via the shared `ContentLayout` overlay; reached from the `Footer`)
- `/admin/*` — All admin pages wrapped in `AdminGuard` (now a real `ROLE_ADMIN` JWT login, not a placeholder)

**API layer** (`src/api/`): All HTTP calls are wrapped in per-resource modules (`kabas.js`, `orders.js`, `customers.js`, `payments.js`, `auth.js`) using a shared `axiosInstance.js` whose **`baseURL` comes from `import.meta.env.VITE_API_URL`** — supplied by `.env.local` (dev, untracked → `http://localhost:8080/api`) and the tracked `.env.production` (prod → `https://kabarent.onrender.com/api`). There is **no Vite dev proxy**; both dev and prod rely entirely on `VITE_API_URL`. The instance attaches `Authorization: Bearer <jwt>` from `auth/authStorage.js` (localStorage), redirects to `/login` on 401 (except on `/login`, `/register`, `/admin`), and handles Render free-tier **cold starts**: a non-blocking "waking the server" hint after ~3s (`coldStart.js`) plus a 2× retry on transport failures only (no HTTP response). `auth/useAuth.js` exposes the session to components.

**State management:** No global store. Each page manages its own state with `useState`/`useEffect`.

**Design system:** Tailwind with a custom palette in `tailwind.config.js` plus reusable utility classes (`.ds-input`, `.ds-btn-primary`, `.ds-panel`, etc.) in `index.css`. In practice the codebase mixes these utilities with inline `style={{…}}` objects.
- Primary: `#012d1d` (dark green), Secondary: `#705d00` (gold), Tertiary: `#560000` (burgundy)
- Fonts: Plus Jakarta Sans (headings), Inter (body)

### Deployment & migrations

- **Topology:** **Vercel** (frontend) + **Render** free tier (backend, containerized via `backend/Dockerfile`, served at `https://kabarent.onrender.com`) + **Neon** (serverless Postgres, injected via `DB_URL`/`DB_USER`/`DB_PASSWORD`). `CorsConfig` allows the exact Vercel origin (`https://kaba-rent.vercel.app`, no trailing slash).
- **Cold starts:** Render free-tier spins the backend down when idle (~60s cold start). `GET /health` (`HealthController`, public, **DB-free** so it doesn't wake Neon) is warmed by an **external** keep-alive cron — there is no in-repo scheduler. The client tolerates the wake-up (70s timeout + transport retry + the cold-start hint described above).
- **Schema migrations:** still no Flyway/Liquibase; schema is managed by Hibernate `ddl-auto=update`. The **email→phone cutover** required a **manual** one-off SQL run (`db/migration/phase_b_phone_identity.sql`) in the Neon SQL console — `ddl-auto` cannot drop `NOT NULL` or backfill values, so it dropped `email NOT NULL`, added `uq_customers_phone UNIQUE`, and backfilled existing rows to canonical E.164.

## Known Limitations

- **No password reset.** A registered user who forgets their password is locked out — there is no reset flow, and re-registering the same phone returns 409.
- **No login rate limiting.** `POST /api/auth/login` is not throttled (brute-force/credential-stuffing risk).
- **No database indexes** beyond the `UNIQUE` constraints on `customers.phone` (and `customers.email` when present); date-overlap queries are unindexed.
- No schema migration tool (e.g. Flyway/Liquibase); schema is managed by Hibernate `ddl-auto=update`, with one-off DDL applied manually for changes it can't make (see *Deployment & migrations*).

## Code Review Policy

Run /review after any significant change, defined as:
- Adding or modifying a REST endpoint
- Adding or modifying a Service class method
- Adding a new React page or component
- Changing business logic (availability, pricing, order lifecycle)
- Changing database schema or JPA entities
- Any refactor affecting more than 2 files

Minor changes that do NOT require /review:
- Text or translation changes only
- CSS or styling changes only
- Fixing a typo or label

How to run:
After completing a significant change, run /review and focus on:
- Does the change follow REST conventions?
- Is business logic in the service layer, not the controller?
- Are error cases handled (404, 400, 500)?
- Does the frontend handle loading and error states?
- Is any customer-facing text in English instead of Hebrew?
- Are there any missing input validations?

Report review findings before moving to the next task.

## Code Standards
- All customer-facing text must be in Hebrew
- All admin-facing text must be in English
- No business logic in controllers — controllers call services only
- Every new endpoint must handle 404, 400, and 500 error cases (centralized in `GlobalExceptionHandler`)
- All service methods must validate input before processing
- Security is **fail closed**: new endpoints are denied by default and need an explicit matcher in `SecurityConfig`. Place admin operations under `ROLE_ADMIN`; only deliberately public routes are `permitAll`
- Never trust a client-supplied `customerId` for customer-scoped data — derive it from the JWT principal (`@AuthenticationPrincipal CustomerPrincipal`) and enforce an ownership check
