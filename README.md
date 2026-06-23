# KabaRent — מערכת השכרת קאבות לאירועים

A full-stack rental management system for traditional Ethiopian Kaba garments, built for event-based bookings. The system serves both end customers (browsing, ordering) and administrators (inventory, orders, payments).

> **מערכת מקוונת להשכרת קאבות מסורתיות לאירועים — לקוחות, הזמנות ותשלומים במקום אחד.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3, Spring Data JPA / Hibernate, Spring Security 6 (stateless JWT via JJWT), libphonenumber, Lombok |
| **Database** | PostgreSQL (**Neon**-hosted in production) |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Axios |
| **Testing** | JUnit 5, Mockito, AssertJ, Spring Security Test, Testcontainers (PostgreSQL) |
| **Build** | Maven (backend), npm (frontend) |
| **Deployment** | Vercel (frontend) · Render (backend) · Neon (database) |

---

## Project Structure

```
KabaRent/
├── backend/                          # Spring Boot application
│   ├── pom.xml                       # Maven build descriptor
│   └── src/
│       ├── main/java/com/kabarent/
│       │   ├── KabaRentApplication.java  # Application entry point
│       │   ├── config/
│       │   │   ├── CorsConfig.java       # CORS rules (allows localhost:5173 + the Vercel origin)
│       │   │   └── DataInitializer.java  # Seeds the admin user from env (ADMIN_EMAIL/ADMIN_PASSWORD)
│       │   ├── controller/               # REST controllers (one per resource)
│       │   │   ├── KabaController.java
│       │   │   ├── CustomerController.java
│       │   │   ├── OrderController.java
│       │   │   └── PaymentController.java
│       │   ├── dto/
│       │   │   ├── request/              # Validated inbound payloads
│       │   │   └── response/             # Outbound response shapes
│       │   ├── exception/
│       │   │   ├── AvailabilityException.java     # 409 – not enough units
│       │   │   ├── ResourceNotFoundException.java # 404 – entity not found
│       │   │   └── GlobalExceptionHandler.java    # Centralized error mapping
│       │   ├── model/                    # JPA entities + enums/
│       │   │   ├── Customer.java  Kaba.java  Order.java  OrderItem.java  Payment.java
│       │   │   └── enums/
│       │   │       ├── OrderStatus.java   # PENDING | CONFIRMED | ACTIVE | COMPLETED | CANCELLED
│       │   │       ├── PaymentMethod.java # CASH | BANK_TRANSFER | CREDIT_CARD | BIT | PAYBOX
│       │   │       └── PaymentStatus.java # PENDING | COMPLETED | REFUNDED
│       │   ├── repository/               # Spring Data JPA interfaces
│       │   │   ├── CustomerRepository.java
│       │   │   ├── KabaRepository.java       # incl. findByIdWithLock (pessimistic write lock)
│       │   │   ├── OrderItemRepository.java  # date-overlap JPQL queries
│       │   │   ├── OrderRepository.java
│       │   │   └── PaymentRepository.java
│       │   └── service/                  # Business logic layer
│       │       ├── AvailabilityService.java  # Quantity-based overlap detection
│       │       ├── CustomerService.java      # find-or-create by phone (E.164)
│       │       ├── KabaService.java
│       │       ├── OrderService.java         # Lifecycle + confirm-time lock/re-validation
│       │       └── PaymentService.java       # Balance validation
│       └── test/java/com/kabarent/
│           ├── service/                  # Mockito unit tests
│           │   ├── AvailabilityServiceTest.java
│           │   ├── OrderServiceTest.java
│           │   └── PaymentServiceTest.java
│           └── repository/
│               └── OrderItemRepositoryIT.java  # Testcontainers (real PostgreSQL)
│
├── frontend/                         # React / Vite application
│   ├── index.html
│   ├── package.json
│   ├── public/                       # Static assets (logos, backgrounds, kaba-pictures/)
│   └── src/
│       ├── App.jsx                   # Router setup, layout shell, scroll-to-top
│       ├── api/                      # Axios call wrappers (one file per resource)
│       │   ├── axiosInstance.js      # Base URL from VITE_API_URL; JWT, 401-redirect, cold-start retry
│       │   ├── coldStart.js          # "Waking the server" hint for Render cold starts
│       │   ├── auth.js  kabas.js  customers.js  orders.js  payments.js
│       ├── components/               # Shared UI components
│       │   ├── AdminGuard.jsx        # Real ROLE_ADMIN JWT guard for admin routes
│       │   ├── ContentLayout.jsx     # Overlay layout for content/info pages
│       │   ├── DateInput.jsx  Footer.jsx  KabaDetailModal.jsx  KabaPlaceholder.jsx
│       │   ├── Modal.jsx  Navbar.jsx  Spinner.jsx  StatusBadge.jsx
│       └── pages/
│           ├── customer/
│           │   ├── BrowsePage.jsx    # Availability search + Kaba grid
│           │   ├── NewOrderPage.jsx  # Multi-step order form
│           │   └── OrderStatusPage.jsx
│           ├── admin/
│           │   ├── AdminDashboardPage.jsx  AdminKabasPage.jsx  AdminOrdersPage.jsx
│           │   ├── AdminCustomersPage.jsx  AdminPaymentsPage.jsx
│           └── content/              # Footer-linked info pages (Hebrew)
│               ├── AboutPage.jsx  HowItWorksPage.jsx  FaqPage.jsx  ContactPage.jsx
│               ├── RentalTermsPage.jsx  ReturnsPage.jsx  PrivacyPage.jsx
│
└── docs/
    ├── CODEBASE_REVIEW_2026.md       # Canonical AS-IS codebase review
    ├── ARCHITECTURE.md               # System design notes (⚠ possibly stale)
    └── DESIGN.md                     # Design system notes (⚠ possibly stale)
```

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- Maven 3.8+
- A reachable **PostgreSQL** database (any Postgres for local dev; production uses **Neon**)
- **Docker** (only required to run the backend test suite — see [Running Tests](#running-tests))

### Database setup

The datasource is configured entirely through environment variables (in
`backend/src/main/resources/application.properties`); there are **no committed DB credentials**:

| Variable | Purpose |
|---|---|
| `DB_URL` | JDBC URL, e.g. `jdbc:postgresql://localhost:5432/kabarent` locally, or the **Neon** connection string in production. |
| `DB_USER` | Database username. |
| `DB_PASSWORD` | Database password. |

For local development you can point these at any Postgres — e.g. a throwaway container:

```bash
docker run --name kabarent-db -e POSTGRES_DB=kabarent \
  -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword \
  -p 5432:5432 -d postgres:16-alpine
# then: DB_URL=jdbc:postgresql://localhost:5432/kabarent DB_USER=myuser DB_PASSWORD=mypassword
```

Hibernate (`ddl-auto=update`) creates the schema automatically on first startup (including the
`password_hash`, `role`, and `phone` columns on `customers`), and **data persists** across restarts.
There is no inventory seed data — add inventory and customers through the admin dashboard.

> **Note:** Hibernate `ddl-auto` cannot drop a `NOT NULL` or backfill data, so the **email→phone
> migration** was applied by hand — see [Migrations](#migrations).

### Auth configuration (environment variables)

Authentication is on by default and fail-closed. Configure these via environment (safe local-dev
fallbacks exist in `application.properties`, but production must override them):

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | HMAC signing key for JWTs (≥ 32 bytes). |
| `ADMIN_EMAIL` | Email of the admin account to seed (default `admin@kabarent.local`). The admin logs in by **email**. |
| `ADMIN_PASSWORD` | Admin password (local-dev default `12345678`, so the admin **is** seeded by default locally). Admin seeding is skipped only if this is blank. Override in production; no production password is committed. |

The **frontend** reads its API base URL from `VITE_API_URL` — `frontend/.env.local` for dev
(`http://localhost:8080/api`, untracked) and the tracked `frontend/.env.production` for prod
(`https://kabarent.onrender.com/api`).

### Run the Backend

```bash
cd backend
DB_URL=jdbc:postgresql://localhost:5432/kabarent DB_USER=myuser DB_PASSWORD=mypassword \
  ADMIN_PASSWORD=change-me mvn spring-boot:run     # seeds the admin user on first startup
```

- API runs on **http://localhost:8080**

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

- App runs on **http://localhost:5173**
- Admin dashboard: **http://localhost:5173/admin**

### Running Tests

```bash
cd backend
mvn test
```

- Service unit tests use Mockito and need no infrastructure.
- `OrderItemRepositoryIT` uses **Testcontainers** to launch a real `postgres:16-alpine` container, so **Docker must be running** for the full suite to pass.

---

## API Endpoints

**Access tiers** (enforced by Spring Security, fail-closed — anything not listed as public requires a
valid JWT): **Public** = no login; **Customer** = `ROLE_CUSTOMER` (own data only); **Admin** = `ROLE_ADMIN`.
Authenticate via `/api/auth/**` and send the returned token as `Authorization: Bearer <jwt>`.

### Auth

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register an account (phone + password); returns a JWT. Upgrades an existing guest (same phone) in place, linking their past orders. 409 if the phone already has an account. |
| `POST` | `/api/auth/login` | Public | Authenticate with `{ identifier, password }`; returns `{ token, customerId, fullName, email, role }`. `identifier` = **phone** (customer) or **email** (admin); the server sniffs `@` to decide. |

### My Orders (customer self-service)

The `customerId` is always derived from the JWT — never from the request.

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/my/orders` | Customer | List the authenticated customer's orders |
| `GET` | `/api/my/orders/{id}` | Customer | Get one of the customer's orders (404 if not theirs) |
| `GET` | `/api/my/orders/{id}/balance` | Customer | Payment balance for the customer's own order |
| `POST` | `/api/my/orders/{id}/cancel` | Customer | Cancel — **PENDING orders only** (confirmed orders go through admin) |

### Kabas

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/kabas?category=&size=` | Public | List active Kabas (optional category/size filters) |
| `GET` | `/api/kabas/{id}` | Public | Get a single Kaba |
| `GET` | `/api/kabas/available?eventDate=&returnDate=` | Public | List Kabas with availability in the range |
| `GET` | `/api/kabas/{id}/availability?eventDate=&returnDate=` | Public | Check one Kaba's availability |
| `POST` | `/api/kabas` | Admin | Create a Kaba |
| `PUT` | `/api/kabas/{id}` | Admin | Update a Kaba |
| `DELETE` | `/api/kabas/{id}` | Admin | Soft-delete a Kaba (`active = false`) |

### Customers (Admin)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Admin | List all customers |
| `GET` | `/api/customers/{id}` | Admin | Get a single customer |
| `POST` | `/api/customers` | Admin | Create or find a customer by phone |
| `PUT` | `/api/customers/{id}` | Admin | Update a customer |

### Orders

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Customer | Place an order. Requires an authenticated `ROLE_CUSTOMER`; the order is attached to the customer from the JWT (no customer details in the body). Guest checkout is disabled. |
| `GET` | `/api/orders?status=` | Admin | List all orders (optional status filter) |
| `GET` | `/api/orders/{id}` | Admin | Get order details (with items) — **not public** (sequential ids); customers use `/api/my/orders/{id}` |
| `GET` | `/api/orders/customer/{customerId}` | Admin | List a customer's orders |
| `PUT` | `/api/orders/{id}/status` | Admin | Update order status |

### Payments (Admin)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/payments` | Admin | List all payments |
| `GET` | `/api/payments/order/{orderId}` | Admin | Payments for a specific order |
| `GET` | `/api/payments/order/{orderId}/balance` | Admin | Balance summary `{ totalPrice, totalPaid, remainingBalance, isFullyPaid }` |
| `POST` | `/api/payments` | Admin | Record a payment |

---

## Key Features

- **Browse & search** — filter available Kabas by event date and return date
- **Package details modal** — full package contents, image, and pricing per Kaba card
- **Order flow** — customer details, date selection, real-time availability check, estimated total
- **Quantity-based availability** — multiple units per Kaba; bookings are tracked per overlapping date range
- **Order lifecycle** — status transitions managed from the admin dashboard, with a confirm-time row lock to prevent overbooking
- **Split payments** — an order can receive multiple partial payments; the total cannot exceed the order price
- **Customer accounts** — phone-based register/login (Hebrew RTL); ordering requires an account (the order is attached to the logged-in customer); "My Orders" shows a customer's own orders, balances, and lets them self-cancel pending orders
- **Real admin authentication** — Spring Security + JWT; the admin area requires a `ROLE_ADMIN` login
- **Admin dashboard** — manages inventory, orders, customers, and payments
- **Hebrew (RTL) customer portal** — including footer-linked info pages (about, FAQ, contact, terms, returns, privacy)

---

## Business Rules

- A Kaba cannot be booked beyond its available `quantity` on overlapping rental dates
- Only `CONFIRMED` and `ACTIVE` orders consume inventory; `PENDING` and `CANCELLED` do not
- Confirming an order re-validates availability under a per-Kaba write lock, so concurrent confirmations cannot overbook
- Payment for an order can be split across multiple transactions; the sum of completed payments cannot exceed its `totalPrice`
- Order lifecycle:
  - `PENDING → CONFIRMED` or `CANCELLED`
  - `CONFIRMED → ACTIVE` or `CANCELLED`
  - `ACTIVE → COMPLETED`
  - `COMPLETED` and `CANCELLED` are terminal (an `ACTIVE` order cannot be cancelled)
- Identity is **phone-based**: customers log in with phone + password (phone stored as canonical E.164 via libphonenumber, region IL; NOT NULL + UNIQUE), email is optional. Admin logs in with email + password. A single `/api/auth/login` sniffs the identifier (`@` → email/admin, else phone/customer).
- Customers are matched by phone — a returning customer reuses their existing record; registering with the phone of a password-less record (e.g. one an admin entered) upgrades that same record to an account in place (linking any past orders on it)
- API access is fail-closed across three tiers (public / `ROLE_CUSTOMER` / `ROLE_ADMIN`); `customerId` is always derived from the JWT, and customers can only see/cancel their own orders
- Customer self-cancellation is limited to `PENDING` orders; cancelling a `CONFIRMED` order must go through admin

---

## Known Limitations

- **No password reset.** A registered user who forgets their password is locked out — there is no reset/forgot-password flow, and re-registering the same phone returns 409. (Backlog.)
- **No login rate limiting.** `POST /api/auth/login` is not throttled, so it is exposed to credential brute-force/stuffing. (Backlog.)
- **No schema migrations** (no Flyway/Liquibase); schema is driven by Hibernate `ddl-auto=update`, with one-off DDL applied manually for changes it can't make (see [Migrations](#migrations)).
- **No database indexes** beyond the unique constraints on `customers.phone` (and `customers.email` when present).
- Kaba images are referenced by URL/static path; there is no server-side image upload.

---

## Roadmap / Next Steps

- [x] Replace the placeholder admin gate with real authentication (Spring Security + JWT)
- [x] Customer accounts + self-service order viewing/cancellation (`/api/my/**`)
- [ ] Add a password-reset / forgot-password flow
- [ ] Rate-limit `POST /api/auth/login`
- [x] Move DB credentials to environment variables / secrets
- [ ] Introduce schema migrations (Flyway or Liquibase)
- [ ] Add indexes for date-overlap availability queries
- [ ] Add SMS / email notifications for order confirmation
- [ ] Support server-side image upload (currently static paths)
- [ ] Add reporting and revenue summary to the admin dashboard

---

## Deployment

| Tier | Platform | Notes |
|---|---|---|
| **Frontend** | **Vercel** | Built with `vite build`, which auto-loads `frontend/.env.production` (`VITE_API_URL` → the Render backend). Served at `https://kaba-rent.vercel.app`. |
| **Backend** | **Render** (free tier) | Containerized via `backend/Dockerfile`; served at `https://kabarent.onrender.com`. Reads `DB_*`, `JWT_SECRET`, and `ADMIN_*` from the environment. |
| **Database** | **Neon** (serverless Postgres) | Connection injected via `DB_URL`/`DB_USER`/`DB_PASSWORD`. |

CORS allows exactly the local dev origin and the Vercel origin (no trailing slash).

**Cold starts:** Render's free tier spins the backend down when idle (~60s to wake). A public,
**DB-free** `GET /health` endpoint is pinged by an **external** keep-alive cron (no in-repo
scheduler) to keep the service warm without waking the Neon database. The frontend also tolerates a
cold start (raised timeout, transport-error retry, and a non-blocking "waking the server" hint).

## Migrations

There is no migration tool (Flyway/Liquibase); the schema is managed by Hibernate
`ddl-auto=update`. Because `ddl-auto` **cannot drop a `NOT NULL` constraint or backfill data**, the
**email→phone identity cutover** was applied **manually** as a one-off transaction in the Neon SQL
console — see [`db/migration/phase_b_phone_identity.sql`](./db/migration/phase_b_phone_identity.sql).
It backfills existing phone numbers to canonical E.164, drops `email NOT NULL`, and adds the
`uq_customers_phone` unique constraint. Apply any similar irreversible schema change the same way.

## Contributing

This project is under active development. For an accurate snapshot of the codebase, see [`docs/CODEBASE_REVIEW_2026.md`](./docs/CODEBASE_REVIEW_2026.md). The `docs/ARCHITECTURE.md` and `docs/DESIGN.md` notes predate recent changes and are marked as possibly stale — verify against the code before relying on them.
