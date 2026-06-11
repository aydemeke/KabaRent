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

- The backend connects to **PostgreSQL** at `jdbc:postgresql://localhost:5432/kabarent` (configured in `application.properties`). A PostgreSQL instance must be running before `spring-boot:run`.
- `spring.jpa.hibernate.ddl-auto=update` — Hibernate creates/updates tables on startup and **data persists across restarts**. There is no H2 and no automatic seed data.
- There is **no seed data**: `DataInitializer.java` is an empty placeholder. Initial inventory/customers are entered manually via the admin dashboard.

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
- `controller/` — REST controllers for `Kaba`, `Order`, `Customer`, `Payment`
- `service/` — Business logic; `AvailabilityService` is the most critical (prevents double-booking)
- `repository/` — Spring Data JPA interfaces; `OrderItemRepository` has custom JPQL queries for date-overlap detection, and `KabaRepository.findByIdWithLock` takes a pessimistic write lock
- `model/` — JPA entities: `Kaba`, `Customer`, `Order`, `OrderItem`, `Payment` + enums
- `dto/request/` & `dto/response/` — API boundary DTOs (validation annotations on request DTOs)
- `exception/` — `GlobalExceptionHandler` (@RestControllerAdvice) maps domain exceptions to HTTP status codes
- `config/` — `CorsConfig` (allows `localhost:5173`), `DataInitializer` (currently an empty placeholder)

**Key business rules:**
- Availability is **quantity-based**: each Kaba has a `quantity`, and a date range is bookable while booked units stay below that quantity. Only `CONFIRMED` and `ACTIVE` orders consume inventory; `PENDING` and `CANCELLED` do not.
- **Confirm-time safety:** `PENDING` orders do not hold stock, so two orders can both pass the create-time check. When an order is confirmed, `OrderService` takes a **row-level write lock** on each Kaba (`findByIdWithLock`) and **re-validates** availability (excluding the order itself) before committing, so the second concurrent confirm is rejected instead of overbooking.
- Order status transitions are enforced (`validateTransition`):
  - `PENDING → CONFIRMED` or `CANCELLED`
  - `CONFIRMED → ACTIVE` or `CANCELLED`
  - `ACTIVE → COMPLETED`
  - `COMPLETED` and `CANCELLED` are **terminal** (no transitions out). In particular, an `ACTIVE` order **cannot** be cancelled.
- Payments are split-allowed but the sum of `COMPLETED` payments cannot exceed the order's `totalPrice`; fully-paid orders reject further payments.
- Customers are **find-or-create by email**: `CustomerService.findOrCreateByEmail` returns the existing customer for a known email or creates a new one, avoiding `UNIQUE(email)` violations for returning customers.
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
- `/order/:id` — `OrderStatusPage` (customer order tracking)
- Content/info pages: `/about`, `/how-it-works`, `/faq`, `/contact`, `/rental-terms`, `/returns`, `/privacy` (rendered via the shared `ContentLayout` overlay; reached from the `Footer`)
- `/admin/*` — All admin pages wrapped in `AdminGuard`

**API layer** (`src/api/`): All HTTP calls are wrapped in per-resource modules (`kabas.js`, `orders.js`, `customers.js`, `payments.js`) using a shared `axiosInstance.js` pointed at `http://localhost:8080/api`.

**State management:** No global store. Each page manages its own state with `useState`/`useEffect`.

**Design system:** Tailwind with a custom palette in `tailwind.config.js` plus reusable utility classes (`.ds-input`, `.ds-btn-primary`, `.ds-panel`, etc.) in `index.css`. In practice the codebase mixes these utilities with inline `style={{…}}` objects.
- Primary: `#012d1d` (dark green), Secondary: `#705d00` (gold), Tertiary: `#560000` (burgundy)
- Fonts: Plus Jakarta Sans (headings), Inter (body)

## Known Limitations

- **No real authentication.** `AdminGuard` is a `sessionStorage` gate that does **not** validate the entered password — any input (including empty) unlocks the admin area. This is a placeholder, not security.
- **Hardcoded DB credentials** in `application.properties` (`myuser`/`mypassword`), committed to the repo.
- **No database indexes** beyond the `UNIQUE` constraint on `customers.email`; date-overlap queries are unindexed.
- No schema migration tool (e.g. Flyway/Liquibase); schema is managed by Hibernate `ddl-auto=update`.

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
