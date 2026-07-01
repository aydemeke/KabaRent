> **Refreshed June 2026** to match the current code: phone-based customer identity, JWT auth, env-driven config, and the Vercel/Render/Neon deployment. The original "intended design" sections (implementation roadmap, some component breakdowns) are retained for historical context but may not match the codebase file-for-file — the root `README.md` and `CLAUDE.md` are the canonical quick references, and [`CODEBASE_REVIEW_2026.md`](CODEBASE_REVIEW_2026.md) is the AS-IS audit (now superseded in part by this refresh).

# KabaRent — System Architecture

## Overview
KabaRent is an event equipment rental management system. The core rental product is a **Kaba** — a costume/outfit set rented for events. Customers browse inventory and place orders for specific date ranges. Admins manage inventory, approve orders, and record payments. The API is secured with **stateless JWT** (Spring Security 6) and is **fail-closed**: a public catalog (browse/availability), a `ROLE_CUSTOMER` tier for placing and viewing orders (`POST /api/orders` + `/api/my/**`), and `ROLE_ADMIN` management endpoints. Ordering requires an authenticated `ROLE_CUSTOMER` (guest checkout has been removed); the order's customer is taken from the JWT principal, not the request body. Customers are identified by **phone number** (login by phone + password); the admin logs in by email.

---

## 1. Project Structure

> The tree below reflects the **original intended layout**; some file names have since changed (e.g. the Axios modules are `kabas.js`/`orders.js`/… not `kabaApi.js`, and there is no `docker-compose.yml`). For the **current, accurate** directory tree see the root [`README.md`](../README.md).

```
KabaRent/
├── docs/
│   └── ARCHITECTURE.md
├── backend/                              # Spring Boot (Maven)
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/kabarent/
│       │   │   ├── KabaRentApplication.java
│       │   │   ├── config/
│       │   │   │   └── CorsConfig.java
│       │   │   ├── controller/
│       │   │   │   ├── KabaController.java
│       │   │   │   ├── CustomerController.java
│       │   │   │   ├── OrderController.java
│       │   │   │   └── PaymentController.java
│       │   │   ├── model/
│       │   │   │   ├── Kaba.java
│       │   │   │   ├── Customer.java
│       │   │   │   ├── Order.java
│       │   │   │   ├── OrderItem.java
│       │   │   │   ├── Payment.java
│       │   │   │   └── enums/
│       │   │   │       ├── OrderStatus.java
│       │   │   │       ├── PaymentStatus.java
│       │   │   │       └── PaymentMethod.java
│       │   │   ├── repository/
│       │   │   │   ├── KabaRepository.java
│       │   │   │   ├── CustomerRepository.java
│       │   │   │   ├── OrderRepository.java
│       │   │   │   ├── OrderItemRepository.java
│       │   │   │   └── PaymentRepository.java
│       │   │   ├── service/
│       │   │   │   ├── KabaService.java
│       │   │   │   ├── CustomerService.java
│       │   │   │   ├── OrderService.java
│       │   │   │   ├── AvailabilityService.java
│       │   │   │   └── PaymentService.java
│       │   │   └── dto/
│       │   │       ├── request/
│       │   │       │   ├── CreateCustomerRequest.java
│       │   │       │   ├── CreateOrderRequest.java
│       │   │       │   ├── OrderItemRequest.java
│       │   │       │   └── RecordPaymentRequest.java
│       │   │       └── response/
│       │   │           ├── KabaResponse.java
│       │   │           ├── CustomerResponse.java
│       │   │           ├── OrderResponse.java
│       │   │           ├── OrderItemResponse.java
│       │   │           ├── PaymentResponse.java
│       │   │           └── AvailabilityResponse.java
│       │   └── resources/
│       │       └── application.properties
│       └── test/
│           └── java/com/kabarent/
│               ├── service/
│               │   ├── AvailabilityServiceTest.java
│               │   └── OrderServiceTest.java
│               └── controller/
│                   └── OrderControllerTest.java
├── frontend/                             # React + Vite + Tailwind
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   ├── axiosInstance.js
│       │   ├── kabaApi.js
│       │   ├── customerApi.js
│       │   ├── orderApi.js
│       │   └── paymentApi.js
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   └── Footer.jsx
│       │   ├── common/
│       │   │   ├── LoadingSpinner.jsx
│       │   │   ├── ErrorMessage.jsx
│       │   │   └── Modal.jsx
│       │   ├── kaba/
│       │   │   ├── KabaCard.jsx
│       │   │   ├── KabaGrid.jsx
│       │   │   └── KabaFilter.jsx
│       │   └── order/
│       │       ├── OrderSummary.jsx
│       │       ├── OrderStatusBadge.jsx
│       │       └── DateRangePicker.jsx
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── CatalogPage.jsx
│       │   ├── KabaDetailPage.jsx
│       │   ├── CheckoutPage.jsx
│       │   ├── OrderConfirmationPage.jsx
│       │   └── admin/
│       │       ├── AdminDashboardPage.jsx
│       │       ├── AdminKabasPage.jsx
│       │       ├── AdminOrdersPage.jsx
│       │       ├── AdminCalendarPage.jsx
│       │       ├── AdminCustomersPage.jsx
│       │       └── AdminPaymentsPage.jsx
│       └── utils/
│           ├── dateUtils.js
│           └── formatUtils.js
└── docker-compose.yml
```

---

## 2. Database Schema

### Table: `customers`
| Column        | Type         | Constraints                                  |
|---------------|--------------|----------------------------------------------|
| id            | BIGSERIAL    | PRIMARY KEY                                   |
| full_name     | VARCHAR(150) | NOT NULL                                      |
| phone         | VARCHAR(20)  | **NOT NULL, UNIQUE** — login identity, canonical E.164 |
| email         | VARCHAR(150) | **UNIQUE when present, nullable** (optional)  |
| password_hash | VARCHAR(100) | nullable — BCrypt; null for customers without a login (e.g. admin-created rows; cannot authenticate until they register) |
| role          | VARCHAR(20)  | `CUSTOMER` \| `ADMIN` (default `CUSTOMER`)    |
| notes         | TEXT         |                                              |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW()                       |

> Phone is normalized to E.164 by `PhoneNumberService` (libphonenumber, default region **IL**) before every write/lookup. On the existing Neon DB, the `phone` UNIQUE constraint and `email DROP NOT NULL` were applied manually (see [§7 Deployment & Migrations](#7-deployment--migrations)).

---

### Table: `kabas`
| Column        | Type          | Constraints            |
|---------------|---------------|------------------------|
| id            | BIGSERIAL     | PRIMARY KEY            |
| name          | VARCHAR(150)  | NOT NULL               |
| description   | TEXT          |                        |
| category      | VARCHAR(100)  |                        |
| size          | VARCHAR(50)   |                        |
| price_per_day | DECIMAL(10,2) | NOT NULL               |
| quantity      | INTEGER       | NOT NULL, DEFAULT 1    |
| image_url     | VARCHAR(500)  |                        |
| active        | BOOLEAN       | NOT NULL, DEFAULT true |

---

### Table: `orders`
| Column      | Type          | Constraints                   |
|-------------|---------------|-------------------------------|
| id          | BIGSERIAL     | PRIMARY KEY                   |
| customer_id | BIGINT        | FK → customers(id), NOT NULL  |
| event_date  | DATE          | NOT NULL                      |
| return_date | DATE          | NOT NULL                      |
| status      | VARCHAR(20)   | NOT NULL, DEFAULT 'PENDING'   |
| total_price | DECIMAL(10,2) | NOT NULL                      |
| notes       | TEXT          |                               |
| created_at  | TIMESTAMP     | NOT NULL, DEFAULT NOW()       |

**Order status values:** `PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`

**Constraint:** `event_date < return_date`

---

### Table: `order_items`
| Column     | Type          | Constraints                |
|------------|---------------|----------------------------|
| id         | BIGSERIAL     | PRIMARY KEY                |
| order_id   | BIGINT        | FK → orders(id), NOT NULL  |
| kaba_id    | BIGINT        | FK → kabas(id), NOT NULL   |
| quantity   | INTEGER       | NOT NULL, DEFAULT 1        |
| unit_price | DECIMAL(10,2) | NOT NULL                   |

---

### Table: `payments`
| Column   | Type          | Constraints                 |
|----------|---------------|-----------------------------|
| id       | BIGSERIAL     | PRIMARY KEY                 |
| order_id | BIGINT        | FK → orders(id), NOT NULL   |
| amount   | DECIMAL(10,2) | NOT NULL                    |
| method   | VARCHAR(50)   | NOT NULL                    |
| status   | VARCHAR(20)   | NOT NULL, DEFAULT 'PENDING' |
| paid_at  | TIMESTAMP     |                             |

**Payment methods:** `CASH`, `BANK_TRANSFER`, `CREDIT_CARD`, `BIT`, `PAYBOX`
**Payment status:** `PENDING`, `COMPLETED`, `REFUNDED`

---

### Table: `idempotency_records`
| Column          | Type        | Constraints                          |
|-----------------|-------------|--------------------------------------|
| id              | BIGSERIAL   | PRIMARY KEY                          |
| idempotency_key | VARCHAR(64) | **NOT NULL, UNIQUE**                 |
| order_id        | BIGINT      | NOT NULL — the order this key created |
| created_at      | TIMESTAMP   | NOT NULL                             |

> Backs idempotent order creation: maps a client-supplied `Idempotency-Key` → the order it created. The `UNIQUE` constraint is what makes retries race-safe (see [§5 Order Idempotency](#order-idempotency)).

---

### Relationships
```
customers ──< orders ──< order_items >── kabas
                  └──< payments
```

---

## 3. Backend Architecture

### Package Structure: `com.kabarent`

| Package        | Responsibility                                              |
|----------------|-------------------------------------------------------------|
| `config`       | `CorsConfig`, `SecurityConfig` (filter chain), `AsyncConfig` (notification thread pool, `@EnableAsync`), `DataInitializer` (seeds admin from env) |
| `security`     | `JwtService`, `JwtAuthenticationFilter`, `CustomerUserDetailsService`, `CustomerPrincipal` |
| `controller`   | REST endpoints, request handling, response mapping (incl. `AuthController`, `MyOrderController`, `HealthController`) |
| `service`      | Business logic, transaction management (incl. `AuthService`, `PhoneNumberService`) |
| `repository`   | JPA repositories, custom JPQL queries                       |
| `model`        | JPA entities, enums (incl. `Role`)                          |
| `notification` | Channel-agnostic notification layer — see [Notification Architecture](#notification-architecture) below |
| `validation`   | `@ValidPhone` / `PhoneValidator` (delegates to `PhoneNumberService`) |
| `exception`    | Domain exceptions + `GlobalExceptionHandler` (404/400/409/401/403) |
| `dto.request`  | Inbound request bodies (validated)                          |
| `dto.response` | Outbound API response shapes                                |

---

### REST API Endpoints

**Access tiers** (enforced by Spring Security, fail-closed): **Public** = no token; **Customer** = `ROLE_CUSTOMER` (own data only); **Admin** = `ROLE_ADMIN`. Authenticate via `/api/auth/**` and send `Authorization: Bearer <jwt>`. See [§5 Authentication & Authorization](#authentication--authorization).

#### Auth — `/api/auth`
| Method | Path                 | Access  | Description                                                              |
|--------|----------------------|---------|-------------------------------------------------------------------------|
| POST   | `/api/auth/register` | Public  | Register (phone + password); returns a JWT. Upgrades a password-less row with the same phone in place (linking its past orders); 409 if the phone already has an account. **Rate-limited** (see [§5](#rate-limiting)). |
| POST   | `/api/auth/login`    | Public  | `{ identifier, password }` → JWT. `identifier` = phone (customer) or email (admin); server sniffs `@`. **Not rate-limited yet** (backlog). |

#### Health — `/health`
| Method | Path      | Access | Description                                                  |
|--------|-----------|--------|-------------------------------------------------------------|
| GET    | `/health` | Public | DB-free liveness check (keep-alive ping; does not touch Neon). |

#### Kabas — `/api/kabas`
| Method | Path                           | Access | Description                                       |
|--------|--------------------------------|--------|---------------------------------------------------|
| GET    | `/api/kabas`                   | Public | List all active Kabas (filter by category, size)  |
| GET    | `/api/kabas/{id}`              | Public | Get single Kaba detail                            |
| GET    | `/api/kabas/available`         | Public | List Kabas available for a date range             |
| GET    | `/api/kabas/{id}/availability` | Public | Check available units for a date range            |
| POST   | `/api/kabas`                   | Admin  | Create new Kaba                                   |
| PUT    | `/api/kabas/{id}`              | Admin  | Update Kaba details                              |
| DELETE | `/api/kabas/{id}`              | Admin  | Soft-delete — sets active=false                  |

#### My Orders (customer self-service) — `/api/my`
The `customerId` is always derived from the JWT, never the request.
| Method | Path                          | Access   | Description                                |
|--------|-------------------------------|----------|--------------------------------------------|
| GET    | `/api/my/orders`              | Customer | List the authenticated customer's orders   |
| GET    | `/api/my/orders/{id}`         | Customer | Get one own order (404 if not theirs)      |
| GET    | `/api/my/orders/{id}/balance` | Customer | Payment balance for an own order           |
| POST   | `/api/my/orders/{id}/cancel`  | Customer | Self-cancel — **PENDING orders only**      |

#### Customers — `/api/customers`
| Method | Path                  | Access | Description                       |
|--------|-----------------------|--------|-----------------------------------|
| GET    | `/api/customers`      | Admin  | List all customers                |
| GET    | `/api/customers/{id}` | Admin  | Get single customer               |
| POST   | `/api/customers`      | Admin  | Create or find a customer by phone |
| PUT    | `/api/customers/{id}` | Admin  | Update customer details           |

#### Orders — `/api/orders`
| Method | Path                                | Access | Description                                          |
|--------|-------------------------------------|--------|------------------------------------------------------|
| POST   | `/api/orders`                       | Customer | Place an order — attached to the authenticated `ROLE_CUSTOMER` from the JWT (no customer details in the body). Accepts an optional `Idempotency-Key` header and is rate-limited (see [§5](#order-idempotency)). |
| GET    | `/api/orders`                       | Admin  | List all orders (filter by status)                   |
| GET    | `/api/orders/{id}`                  | Admin  | Get single order detail (**not public** — sequential ids) |
| GET    | `/api/orders/customer/{customerId}` | Admin  | List orders for a customer                           |
| PUT    | `/api/orders/{id}/status`           | Admin  | Update order status (drives the lifecycle transitions) |

#### Payments — `/api/payments`
| Method | Path                               | Access | Description                       |
|--------|------------------------------------|--------|-----------------------------------|
| GET    | `/api/payments`                    | Admin  | List all payments                 |
| GET    | `/api/payments/order/{id}`         | Admin  | Get payments for a specific order |
| GET    | `/api/payments/order/{id}/balance` | Admin  | Balance summary for an order      |
| POST   | `/api/payments`                    | Admin  | Record a new payment              |

---

### Service Classes

| Service               | Responsibilities                                                             |
|-----------------------|------------------------------------------------------------------------------|
| `AuthService`         | Register/login; upgrade-in-place of a password-less row → account (by phone on register); issues JWTs |
| `PhoneNumberService`  | Normalize/validate phone to canonical E.164 (libphonenumber, region IL) — single point of truth |
| `KabaService`         | CRUD for Kabas, search/filter by category and size                          |
| `CustomerService`     | Find-or-create customers by phone; admin CRUD                               |
| `AvailabilityService` | Detect date-range overlaps, return available unit count for a Kaba          |
| `OrderService`        | Create orders (validates availability), price calculation, status transitions, ownership checks for `/api/my/**` |
| `PaymentService`      | Record payments, query payments/balance by order                            |

---

### Notification Architecture

> All notification code lives in `com.kabarent.notification`. Nothing outside this package needs to change when adding a new notification type or switching channels.

#### Event flow

```
OrderService (after order persists)
  └─ ApplicationEventPublisher.publishEvent(OrderCreatedEvent)
       │
       ├─ @TransactionalEventListener(AFTER_COMMIT) fires only after the DB transaction commits
       │
       ├─ CustomerOrderNotificationListener  ──► NotificationSender.send(ORDER_CREATED)
       │   @Async("notificationExecutor")        recipient = customer (email may be null → skipped)
       │   try/catch isolation
       │
       └─ AdminOrderNotificationListener     ──► NotificationSender.send(ORDER_CREATED_ADMIN)
           @Async("notificationExecutor")        recipient = fixed admin address (app.admin.email)
           try/catch isolation                   fires regardless of customer email presence
```

The two listeners are **independent Spring beans** — each with its own try/catch — so a failure in one never affects the other or the order flow. Both run on the `notif-*` thread pool (core 2, max 4, queue 50, defined in `AsyncConfig`).

#### Abstractions

| Class / Record | Role |
|---|---|
| `NotificationSender` | Interface: `void send(NotificationRequest)` |
| `NotificationRequest` | Record: `type`, `recipient`, `payload` (Map<String,String>) |
| `NotificationRecipient` | Record: `name`, `phone`, `email` (all nullable) |
| `NotificationType` | Enum: `ORDER_CREATED`, `ORDER_CREATED_ADMIN` |
| `OrderCreatedEvent` | Record published by `OrderService`; carries `orderId`, `customerName`, `customerPhone`, `customerEmail`, `totalPrice`, `eventDate`, `returnDate` |

#### Provider selection

`NotificationSender` is chosen at startup by `@ConditionalOnProperty` on `app.notifications.provider`:

| Value | Bean activated | Behaviour |
|---|---|---|
| `logging` (default, `matchIfMissing=true`) | `LoggingNotificationSender` | Logs to stdout at INFO; no external calls |
| `resend` | `ResendNotificationSender` | POSTs to `https://api.resend.com/emails` via Spring `RestClient` |

Exactly one implementation is registered as a bean at a time — no `@Primary`/`@Qualifier` needed.

#### ResendNotificationSender

- **Startup fail-fast:** `@PostConstruct` throws `IllegalStateException` if `app.resend.api-key` is blank when `provider=resend` — a misconfigured deployment refuses to start rather than silently dropping emails.
- **Timeouts:** `SimpleClientHttpRequestFactory` with 5 s connect + read.
- **Phone-only customers:** if `recipient.email()` is null, the send is skipped with an INFO log. This is a valid per-customer state, not an error.
- **Email composition:** `send()` switches on `NotificationType` to pick the right subject + content builder. Each builder produces inner HTML only; `EmailLayout.wrap(innerHtml)` adds the shared branded shell.
- **Error handling:** `RestClientException` and any other exception are caught and logged at ERROR; never rethrown.

#### EmailLayout

`EmailLayout.wrap(String innerHtml)` returns a complete HTML document using **table-based layout with inline hex colors only** — required for email client compatibility (Gmail and Outlook strip `<style>` blocks and Tailwind classes). The shell provides the Cotton & Thread branded header, gold accent rule, white card, cream background, and minimal footer. See `docs/DESIGN.md` → *Email Templates* for the visual spec.

#### Configuration properties

| Property | Env var | Default | Purpose |
|---|---|---|---|
| `app.notifications.provider` | `NOTIFICATIONS_PROVIDER` | `logging` | Active sender |
| `app.resend.api-key` | `RESEND_API_KEY` | *(blank)* | Resend auth; required when provider=resend |
| `app.resend.from` | `RESEND_FROM` | `onboarding@resend.dev` | Sender address |
| `app.admin.email` | `ADMIN_EMAIL` | `kabarentadmin@gmail.com` | Admin alert TO address (shared with admin seed) |

---

## 4. Frontend Architecture

### Pages and Routes (React Router v7, `App.jsx`)

| Route                              | Page Component       | Access | Description                                  |
|------------------------------------|----------------------|--------|----------------------------------------------|
| `/`                                | `BrowsePage`         | Public | Landing: search by date, availability grid   |
| `/order/new`                       | `NewOrderPage`       | Customer | Multi-step booking (reads query params); **wrapped in `RequireCustomer`** — logged-out visitors are redirected to `/login` (path+query preserved) |
| `/order/:id`                       | `OrderStatusPage`    | Customer | Post-checkout status; **wrapped in `RequireCustomer`** |
| `/login`, `/register`              | `LoginPage`/`RegisterPage` | Public | Customer auth (Hebrew RTL); login by phone |
| `/customer/orders`, `/customer/orders/:id` | "My Orders"  | Customer | Own orders + balances (wrapped in `RequireCustomer`) |
| `/about`, `/how-it-works`, `/faq`, `/contact`, `/rental-terms`, `/returns`, `/privacy` | content pages | Public | Footer-linked info pages (`ContentLayout`) |
| `/admin`, `/admin/kabas`, `/admin/orders`, `/admin/customers`, `/admin/payments` | admin pages | Admin | Inventory, orders, customers, payments (wrapped in `AdminGuard`) |

The admin area is a real `ROLE_ADMIN` JWT login (`AdminGuard`), not a placeholder. Customer-facing text is Hebrew (RTL); admin-facing text is English.

---

### API Service Layer (Axios)

All HTTP calls live in per-resource modules under `src/api/` (`auth.js`, `kabas.js`, `customers.js`, `orders.js`, `payments.js`) over a shared `axiosInstance.js`:

- **`baseURL` from `import.meta.env.VITE_API_URL`** — `.env.local` for dev (`http://localhost:8080/api`, untracked) and the tracked `.env.production` for prod (`https://kabarent.onrender.com/api`). There is **no Vite dev proxy**.
- Request interceptor attaches `Authorization: Bearer <jwt>` from `auth/authStorage.js` (localStorage).
- Response interceptors: on **401** clear the session and redirect to `/login` (except on `/login`, `/register`, `/admin`); **cold-start** handling for the Render free tier — a non-blocking "waking the server" hint (`coldStart.js`) and a 2× retry on transport failures only (no HTTP response).

**Design system:** The palette and component tokens follow the "Cotton & Thread" design system — see `docs/DESIGN.md` for the full token and component reference.

---

## 5. Key Business Logic

### Authentication & Authorization

**Stateless JWT, Spring Security 6, fail-closed** (`anyRequest().authenticated()`).

- **Identity is phone-based.** Customers log in with **phone + password**. Phone is the canonical **E.164** identity (`PhoneNumberService`, libphonenumber, region IL; `customers.phone` NOT NULL + UNIQUE). Email is optional (nullable, unique-when-present; blanks coerced to NULL).
- **Admin logs in with email + password**, seeded on startup by `DataInitializer` from env (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) with a placeholder phone `"-"`.
- **Single login endpoint** (`POST /api/auth/login`, body `{ identifier, password }`). `CustomerUserDetailsService` sniffs the identifier: contains `@` → look up by email (admin); otherwise normalize to E.164 → look up by phone (customer). A row with a null `passwordHash` cannot authenticate.
- **Upgrade-in-place.** A **password-less** `Customer` row (e.g. one an admin created via `POST /api/customers`, which find-or-creates by phone) is **upgraded in place** when someone registers with that phone (sets `passwordHash`, `role=CUSTOMER`), so any past orders on that row stay linked. Re-registering a phone that already has a password → 409 (`PhoneAlreadyRegisteredException`). Ordering no longer creates customers — `POST /api/orders` requires `ROLE_CUSTOMER` and takes the customer from the JWT (guest checkout removed).
- **Three authorization tiers** (`SecurityConfig`):
  - **Public:** `OPTIONS /**`, `GET /health`, `/api/auth/**`, `GET /api/kabas/**`.
  - **`ROLE_CUSTOMER`:** `POST /api/orders` (place an order) and `/api/my/**`.
  - **`ROLE_ADMIN`:** Kaba mutations, `/api/orders/**`, `/api/customers/**`, `/api/payments/**`.
- **Ownership:** `customerId` is always taken from the JWT principal (`CustomerPrincipal`), never the request; every `/api/my/**` access is ownership-checked (mismatch → 404).
- **Phone validation:** `@ValidPhone` (`PhoneValidator` → `PhoneNumberService`) on register/customer DTOs; `InvalidPhoneNumberException` → 400, `PhoneAlreadyRegisteredException` → 409.

---

### Order Idempotency

`POST /api/orders` accepts an optional client-supplied **`Idempotency-Key`** header. An `idempotency_records` row (DB-`UNIQUE` on the key) maps key → the created order id:

- A repeated request with the same key returns the **original** order instead of creating a duplicate.
- Concurrency is race-safe via the unique constraint: on a conflicting insert the inner transaction rolls back, then re-reads and returns the winner's order — no orphan order is left behind.
- A key longer than **64 characters** → 400.
- The frontend sends a per-checkout-attempt UUID (`crypto.randomUUID()`), stable across retries and rotated only after a successful submit.

---

### Rate Limiting

Best-effort, in-memory, **per-instance** throttling via **bucket4j** (token buckets), applied as a shared `RateLimitInterceptor` registered **per path** in `WebConfig`. The client key is resolved as `CF-Connecting-IP` → leftmost `X-Forwarded-For` → `getRemoteAddr()` (Render sits behind Cloudflare). It is explicitly **best-effort** — IP-spoofable and not shared across instances — so it raises the bar against casual abuse, not a determined attacker.

| Endpoint | Limits (per client) |
|----------|---------------------|
| `POST /api/orders` | 10 / minute and 100 / hour |
| `POST /api/auth/register` | 3 / hour and 10 / day (stricter — the main public abuse surface once guest ordering was removed) |

On exceeding a limit: **HTTP 429** with a `Retry-After` header and the standard `{ timestamp, status, error }` JSON body. All limits are configurable via `app.rate-limit.*` (env-overridable); `app.rate-limit.enabled` toggles the whole feature. **`POST /api/auth/login` is not rate-limited yet** (backlog).

---

### AvailabilityService — Date Overlap Detection

A Kaba unit is **unavailable** for a requested date range if the total quantity already booked on overlapping CONFIRMED or ACTIVE orders meets or exceeds `kaba.quantity`.

**Overlap condition (JPQL):**
```
SELECT SUM(oi.quantity)
FROM OrderItem oi JOIN oi.order o
WHERE oi.kaba.id = :kabaId
  AND o.status IN ('CONFIRMED', 'ACTIVE')
  AND o.eventDate < :returnDate
  AND o.returnDate > :eventDate
```

- `available units = kaba.quantity − booked`
- If `available <= 0` → reject order with HTTP 409 Conflict
- PENDING orders do **not** hold stock — only CONFIRMED and ACTIVE orders block inventory

---

### Order Lifecycle

```
PENDING
  │
  ├─── Admin confirms ──────────► CONFIRMED
  │         │
  │         ├─── event date reached ──► ACTIVE
  │         │         │
  │         │         └─── Admin marks complete ──► COMPLETED
  │         │
  │         └─── Admin cancels ──► CANCELLED
  │
  └─── Customer/Admin cancels ──► CANCELLED
```

**Transitions enforced in `OrderService.validateTransition` (driven by `PUT /api/orders/{id}/status`):**
- `PENDING → CONFIRMED` or `CANCELLED`. Confirm takes a per-Kaba **row-level write lock** (`findByIdWithLock`) and re-validates availability before committing, so concurrent confirms cannot overbook.
- `CONFIRMED → ACTIVE` or `CANCELLED`
- `ACTIVE → COMPLETED`
- `COMPLETED` and `CANCELLED` are **terminal** — in particular an `ACTIVE` order **cannot** be cancelled.
- **Customer self-cancel** (`POST /api/my/orders/{id}/cancel`) is limited to **PENDING** orders; cancelling a CONFIRMED order must go through admin.

---

### Pricing Calculation

```
rental_days = return_date − event_date   (minimum 1 day)
item_total  = kaba.price_per_day × rental_days × item.quantity
order_total = SUM(item_total for all items in order)
```

`unit_price` is **locked at order creation time** in `order_items` so future price changes do not affect existing orders.

---

## 6. Implementation Roadmap

> **Historical note:** The phases below are the original pre-code build plan, now mostly completed. They reflect the *intended* sequence, not the current state of the codebase. For an accurate AS-IS picture see `docs/CODEBASE_REVIEW_2026.md`, the root `README.md`, and `CLAUDE.md`.

### Phase 1 — Project Scaffolding
1. Initialize Spring Boot project (Spring Initializr): Web, JPA, PostgreSQL driver, Validation, Lombok
2. Initialize React + Vite project: add React Router, Axios, Tailwind CSS
3. Set up `docker-compose.yml` with PostgreSQL 16
4. Configure `application.properties` (datasource URL, JPA DDL auto, CORS)

### Phase 2 — Database & Entities
5. Create JPA entities: `Customer`, `Kaba`, `Order`, `OrderItem`, `Payment` with all enums
6. Create Spring Data JPA repositories; add custom JPQL query for availability check

### Phase 3 — Core Backend APIs
7. Implement `KabaService` + `KabaController` (CRUD, list/filter, soft delete)
8. Implement `AvailabilityService` with date-overlap query
9. Implement `CustomerService` + `CustomerController`
10. Implement `OrderService` + `OrderController` (create with availability check + price calc, status transitions)
11. Implement `PaymentService` + `PaymentController`
12. Configure `CorsConfig` to allow frontend origin
13. Test all endpoints with Postman or curl

### Phase 4 — Frontend Foundation
14. Set up `axiosInstance` with base URL from env
15. Build `Navbar`, `Footer`, global layout
16. Set up React Router with all routes in `App.jsx`

### Phase 5 — Customer-Facing Pages
17. Build `CatalogPage` with `KabaFilter` and `KabaGrid`
18. Build `KabaDetailPage` with availability checker + `DateRangePicker`
19. Build `CheckoutPage` — customer form + order review + submit
20. Build `OrderConfirmationPage`

### Phase 6 — Admin Panel
21. Build `AdminDashboardPage` with KPI summary cards
22. Build `AdminKabasPage` — full CRUD table with create/edit `Modal`
23. Build `AdminOrdersPage` — order list with confirm/cancel actions
24. Build `AdminCalendarPage` — calendar view of rentals
25. Build `AdminCustomersPage` — customer list
26. Build `AdminPaymentsPage` — payment recording

### Phase 7 — Testing & Polish
27. Unit tests for `AvailabilityService` (no overlap, partial overlap, fully booked, boundary dates)
28. Unit tests for `OrderService` (pricing, status transitions, double-booking rejection)
29. Manual end-to-end test: browse → checkout → admin confirm → mark complete
30. Responsive design pass on all customer-facing pages

---

## 7. Deployment & Migrations

### Topology

| Tier         | Platform                  | Notes                                                                                 |
|--------------|---------------------------|---------------------------------------------------------------------------------------|
| **Frontend** | **Vercel**                | `vite build` auto-loads `.env.production` (`VITE_API_URL` → the Render backend). Origin `https://kaba-rent.vercel.app`. |
| **Backend**  | **Render** (free tier)    | Containerized via `backend/Dockerfile`; served at `https://kabarent.onrender.com`. Reads `DB_*`, `JWT_SECRET`, `ADMIN_*` from the environment. |
| **Database** | **Neon** (serverless PG)  | Injected via `DB_URL` / `DB_USER` / `DB_PASSWORD`. No committed DB credentials.        |

`CorsConfig` allows exactly the local dev origin and the Vercel origin (no trailing slash).

**Cold starts:** Render's free tier idles the backend down (~60s wake). The public, **DB-free** `GET /health` is pinged by an **external** keep-alive cron (no in-repo scheduler) to keep it warm without waking Neon. The frontend tolerates the wake-up (raised timeout + transport retry + the cold-start hint).

### Migrations

There is no migration tool (Flyway/Liquibase); schema is managed by Hibernate `ddl-auto=update`. Because `ddl-auto` cannot drop a `NOT NULL` or backfill data, the **email→phone identity cutover** was applied **manually** as a one-off transaction in the Neon SQL console — see `db/migration/phase_b_phone_identity.sql`. It backfills existing phones to canonical E.164, drops `email NOT NULL`, and adds the `uq_customers_phone` unique constraint.

---

## Verification Steps
- `GET /api/kabas` → returns list of Kabas (public)
- `GET /api/kabas/available?eventDate=2026-06-01&returnDate=2026-06-03` → returns available Kabas
- `POST /api/orders` with a customer JWT → creates an order attached to that customer (no customer block in the body); verify price matches calculation. Without a token → 401; replaying the same `Idempotency-Key` returns the original order.
- Attempt to book same Kaba on overlapping dates beyond `quantity` → expect HTTP 409 Conflict
- `POST /api/auth/login` with phone + password → returns a JWT; admin logs in with email + password
- `PUT /api/orders/{id}/status` (Admin) → status transitions are enforced (e.g. PENDING → CONFIRMED)
- `GET /api/my/orders` with a customer JWT → returns only that customer's orders
- `POST /api/payments` (Admin) → payment recorded against order
- `/admin/*` routes require a `ROLE_ADMIN` JWT (no anonymous access)
