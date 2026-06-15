# KabaRent — מערכת השכרת קאבות לאירועים

A full-stack rental management system for traditional Ethiopian Kaba garments, built for event-based bookings. The system serves both end customers (browsing, ordering) and administrators (inventory, orders, payments).

> **מערכת מקוונת להשכרת קאבות מסורתיות לאירועים — לקוחות, הזמנות ותשלומים במקום אחד.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3, Spring Data JPA / Hibernate, Spring Security 6 (stateless JWT via JJWT), Lombok |
| **Database** | PostgreSQL |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Axios |
| **Testing** | JUnit 5, Mockito, AssertJ, Spring Security Test, Testcontainers (PostgreSQL) |
| **Build** | Maven (backend), npm (frontend) |

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
│       │   │   ├── CorsConfig.java       # CORS rules (allows localhost:5173)
│       │   │   └── DataInitializer.java  # Empty placeholder (no seed data)
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
│       │       ├── CustomerService.java      # find-or-create by email
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
│       │   ├── axiosInstance.js      # Base URL (http://localhost:8080/api)
│       │   ├── kabas.js  customers.js  orders.js  payments.js
│       ├── components/               # Shared UI components
│       │   ├── AdminGuard.jsx        # Password gate for admin routes (see Known Limitations)
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
- A running **PostgreSQL** instance with a database named `kabarent`
- **Docker** (only required to run the backend test suite — see [Running Tests](#running-tests))

### Database setup

The backend expects PostgreSQL on `localhost:5432`. Defaults (in `backend/src/main/resources/application.properties`):

```
URL:      jdbc:postgresql://localhost:5432/kabarent
Username: myuser
Password: mypassword
```

Quick start with Docker:

```bash
docker run --name kabarent-db -e POSTGRES_DB=kabarent \
  -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword \
  -p 5432:5432 -d postgres:16-alpine
```

Hibernate (`ddl-auto=update`) creates the schema automatically on first startup (including the new
`password_hash` and `role` columns on `customers`), and **data persists** across restarts. There is no
seed data — add inventory and customers through the admin dashboard.

### Auth configuration (environment variables)

Authentication is on by default and fail-closed. Configure these via environment (safe local-dev
fallbacks exist in `application.properties`, but production must override them):

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | HMAC signing key for JWTs (≥ 32 bytes). |
| `ADMIN_EMAIL` | Email of the admin account to seed (default `admin@kabarent.local`). |
| `ADMIN_PASSWORD` | Admin password. **Blank by default → admin seeding is skipped.** Set it to create/seed the admin on startup. No plaintext admin password is committed. |

### Run the Backend

```bash
cd backend
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
| `POST` | `/api/auth/register` | Public | Register an account; returns a JWT. Upgrades an existing guest (same email) in place, linking their past orders. 409 if the email already has an account. |
| `POST` | `/api/auth/login` | Public | Authenticate; returns `{ token, customerId, fullName, email, role }`. |

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
| `POST` | `/api/customers` | Admin | Create or find a customer by email |
| `PUT` | `/api/customers/{id}` | Admin | Update a customer |

### Orders

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Public | Place an order. Guest checkout supplies `customer: { fullName, phone, email }` (find-or-created by email); admin/known flows may pass `customerId`. |
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
- **Customer accounts** — register/login (Hebrew RTL); "My Orders" shows a customer's own orders, balances, and lets them self-cancel pending orders. Guest checkout still works and links to the account on registration (same email)
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
- Customers are matched by email — a returning customer reuses their existing record; registering with a guest's email upgrades that same record to an account (linking past orders)
- API access is fail-closed across three tiers (public / `ROLE_CUSTOMER` / `ROLE_ADMIN`); `customerId` is always derived from the JWT, and customers can only see/cancel their own orders
- Customer self-cancellation is limited to `PENDING` orders; cancelling a `CONFIRMED` order must go through admin

---

## Known Limitations

- **No password reset.** A registered user who forgets their password is locked out — there is no reset/forgot-password flow, and re-registering the same email returns 409. (Backlog.)
- **No login rate limiting.** `POST /api/auth/login` is not throttled, so it is exposed to credential brute-force/stuffing. (Backlog.)
- **Hardcoded database credentials** are committed in `application.properties` (the JWT secret and admin password are externalized to env, but DB creds are not yet).
- **No schema migrations** (no Flyway/Liquibase); schema is driven by Hibernate `ddl-auto=update`.
- **No database indexes** beyond the unique constraint on `customers.email`.
- Kaba images are referenced by URL/static path; there is no server-side image upload.

---

## Roadmap / Next Steps

- [x] Replace the placeholder admin gate with real authentication (Spring Security + JWT)
- [x] Customer accounts + self-service order viewing/cancellation (`/api/my/**`)
- [ ] Add a password-reset / forgot-password flow
- [ ] Rate-limit `POST /api/auth/login`
- [ ] Move DB credentials to environment variables / secrets
- [ ] Introduce schema migrations (Flyway or Liquibase)
- [ ] Add indexes for date-overlap availability queries
- [ ] Add SMS / email notifications for order confirmation
- [ ] Support server-side image upload (currently static paths)
- [ ] Add reporting and revenue summary to the admin dashboard

---

## Contributing

This project is under active development. For an accurate snapshot of the codebase, see [`docs/CODEBASE_REVIEW_2026.md`](./docs/CODEBASE_REVIEW_2026.md). The `docs/ARCHITECTURE.md` and `docs/DESIGN.md` notes predate recent changes and are marked as possibly stale — verify against the code before relying on them.
