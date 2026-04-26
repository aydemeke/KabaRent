# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KabaRent is a wedding/event equipment rental management system (rental items are called "Kabas"). It has a Spring Boot backend and a React frontend.

## Commands

### Backend
```bash
cd backend
mvn spring-boot:run        # Start API server on http://localhost:8080
mvn clean install          # Build JAR
mvn test                   # Run tests
```

- H2 console: `http://localhost:8080/h2-console` (JDBC: `jdbc:h2:mem:kabarentdb`, user: `sa`, password: empty)
- The database is **in-memory and recreated on every restart** (`create-drop`). Seed data is loaded from `DataInitializer.java` on startup.

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

Standard layered architecture: `Controller → Service → Repository → H2 (JPA)`

**Packages under `com.kabarent`:**
- `controller/` — REST controllers for `Kaba`, `Order`, `Customer`, `Payment`
- `service/` — Business logic; `AvailabilityService` is the most critical (prevents double-booking)
- `repository/` — Spring Data JPA interfaces; `OrderItemRepository` has a custom JPQL query for date-overlap detection
- `model/` — JPA entities: `Kaba`, `Customer`, `Order`, `OrderItem`, `Payment` + enums
- `dto/request/` & `dto/response/` — API boundary DTOs (validation annotations on request DTOs)
- `exception/` — `GlobalExceptionHandler` (@RestControllerAdvice) maps domain exceptions to HTTP status codes
- `config/` — `CorsConfig` (allows `localhost:5173`), `DataInitializer` (seed data)

**Key business rules:**
- Only `CONFIRMED` and `ACTIVE` orders block inventory; `PENDING` and `CANCELLED` do not.
- Order status transitions are enforced: `PENDING → CONFIRMED → ACTIVE → COMPLETED` (or `CANCELLED` at any step).
- Payments are split-allowed but cannot exceed the order's `totalPrice`.
- Kabas use soft delete (`active` boolean); they remain in DB but are hidden from customer views.

**Data relationships:**
```
Customer (1) → (∞) Order (1) → (∞) OrderItem (∞) → (1) Kaba
Order (1) → (∞) Payment
```

### Frontend (React 19, Vite, Tailwind CSS)

**Routing** (`App.jsx` with React Router v6):
- `/` — `BrowsePage` (customer landing: search by date, availability grid)
- `/order/new` — `NewOrderPage` (multi-step booking, reads `kabaId`/`eventDate`/`returnDate` from query params)
- `/order/:id` — `OrderStatusPage` (customer order tracking)
- `/admin/*` — All admin pages wrapped in `AdminGuard` (localStorage password gate)

**API layer** (`src/api/`): All HTTP calls are wrapped in per-resource modules (`kabas.js`, `orders.js`, `customers.js`, `payments.js`) using a shared `axiosInstance.js` pointed at `http://localhost:8080/api`.

**State management:** No global store. Each page manages its own state with `useState`/`useEffect`.

**Design system:** Tailwind with custom palette defined in `tailwind.config.js` and reusable utility classes (`.ds-input`, `.ds-btn-primary`, `.ds-panel`, etc.) defined in `index.css`.
- Primary: `#012d1d` (dark green), Secondary: `#705d00` (gold), Tertiary: `#560000` (burgundy)
- Fonts: Plus Jakarta Sans (headings), Inter (body)

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
- Every new endpoint must handle 404, 400, and 500 error cases
- All service methods must validate input before processing
