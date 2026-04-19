# KabaRent — System Architecture

## Overview
KabaRent is an event equipment rental management system. The core rental product is a **Kaba** — a costume/outfit set rented for events. Customers browse inventory and place orders for specific date ranges. Admins manage inventory, approve orders, view the rental calendar, and record payments. All endpoints are open — no authentication in this phase.

---

## 1. Project Structure

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
| Column     | Type         | Constraints             |
|------------|--------------|-------------------------|
| id         | BIGSERIAL    | PRIMARY KEY             |
| full_name  | VARCHAR(150) | NOT NULL                |
| phone      | VARCHAR(20)  | NOT NULL                |
| email      | VARCHAR(150) | UNIQUE, NOT NULL        |
| notes      | TEXT         |                         |
| created_at | TIMESTAMP    | NOT NULL, DEFAULT NOW() |

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

**Payment methods:** `CASH`, `BANK_TRANSFER`, `MOBILE_MONEY`
**Payment status:** `PENDING`, `COMPLETED`, `REFUNDED`

---

### Relationships
```
customers ──< orders ──< order_items >── kabas
                  └──< payments
```

---

## 3. Backend Architecture

### Package Structure: `com.kabarent`

| Package        | Responsibility                                     |
|----------------|----------------------------------------------------|
| `config`       | CORS configuration                                 |
| `controller`   | REST endpoints, request handling, response mapping |
| `service`      | Business logic, transaction management             |
| `repository`   | JPA repositories, custom JPQL queries              |
| `model`        | JPA entities, enums                                |
| `dto.request`  | Inbound request bodies                             |
| `dto.response` | Outbound API response shapes                       |

---

### REST API Endpoints

All endpoints are open — no authentication required.

#### Kabas — `/api/kabas`
| Method | Path                           | Description                                    |
|--------|--------------------------------|------------------------------------------------|
| GET    | `/api/kabas`                   | List all active Kabas (filter by category, size) |
| GET    | `/api/kabas/{id}`              | Get single Kaba detail                         |
| GET    | `/api/kabas/{id}/availability` | Check available units for a date range         |
| POST   | `/api/kabas`                   | Create new Kaba                                |
| PUT    | `/api/kabas/{id}`              | Update Kaba details                            |
| DELETE | `/api/kabas/{id}`              | Soft-delete — sets active=false                |

#### Customers — `/api/customers`
| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/customers`      | List all customers       |
| GET    | `/api/customers/{id}` | Get single customer      |
| POST   | `/api/customers`      | Create new customer      |
| PUT    | `/api/customers/{id}` | Update customer details  |

#### Orders — `/api/orders`
| Method | Path                                | Description                        |
|--------|-------------------------------------|------------------------------------|
| GET    | `/api/orders`                       | List all orders (filter by status) |
| GET    | `/api/orders/{id}`                  | Get single order detail            |
| GET    | `/api/orders/customer/{customerId}` | List orders for a customer         |
| POST   | `/api/orders`                       | Place a new order                  |
| PUT    | `/api/orders/{id}/confirm`          | Admin confirms a PENDING order     |
| PUT    | `/api/orders/{id}/complete`         | Admin marks order as COMPLETED     |
| PUT    | `/api/orders/{id}/cancel`           | Cancel an order                    |

#### Payments — `/api/payments`
| Method | Path                       | Description                       |
|--------|----------------------------|-----------------------------------|
| GET    | `/api/payments`            | List all payments                 |
| GET    | `/api/payments/order/{id}` | Get payments for a specific order |
| POST   | `/api/payments`            | Record a new payment              |

---

### Service Classes

| Service               | Responsibilities                                                             |
|-----------------------|------------------------------------------------------------------------------|
| `KabaService`         | CRUD for Kabas, search/filter by category and size                          |
| `CustomerService`     | CRUD for customers                                                           |
| `AvailabilityService` | Detect date-range overlaps, return available unit count for a Kaba          |
| `OrderService`        | Create orders (validates availability), price calculation, status transitions |
| `PaymentService`      | Record payments, query payments by order                                    |

---

## 4. Frontend Architecture

### Pages and Routes

| Route                 | Page Component          | Description                         |
|-----------------------|-------------------------|-------------------------------------|
| `/`                   | `HomePage`              | Hero, featured Kabas, CTA           |
| `/catalog`            | `CatalogPage`           | Browse all active Kabas             |
| `/catalog/:id`        | `KabaDetailPage`        | Kaba details + availability checker |
| `/checkout`           | `CheckoutPage`          | Customer info form + order review   |
| `/order-confirmation` | `OrderConfirmationPage` | Success screen with order summary   |
| `/admin`              | `AdminDashboardPage`    | KPI cards, recent orders            |
| `/admin/kabas`        | `AdminKabasPage`        | Kaba inventory management           |
| `/admin/orders`       | `AdminOrdersPage`       | All orders, confirm/cancel actions  |
| `/admin/calendar`     | `AdminCalendarPage`     | Rental calendar view                |
| `/admin/customers`    | `AdminCustomersPage`    | Customer list and detail            |
| `/admin/payments`     | `AdminPaymentsPage`     | Payment recording and history       |

---

### Component Breakdown

**`HomePage`** — Hero section, featured Kabas, link to catalog.
Uses: `KabaCard`, `Navbar`, `Footer`

**`CatalogPage`** — Browse all active Kabas with filters.
Uses: `KabaFilter` (category, size, price range), `KabaGrid`, `KabaCard`

**`KabaDetailPage`** — Full Kaba details, availability checker, "Book Now" button.
Uses: `DateRangePicker`, availability status display

**`CheckoutPage`** — Customer fills in name/phone/email, reviews Kaba + dates, sees total price, submits order.
Uses: `OrderSummary`, `DateRangePicker`

**`OrderConfirmationPage`** — Shows order ID, summary, and status = PENDING.

**`AdminDashboardPage`** — KPI cards: total orders, pending count, monthly revenue, active rentals.

**`AdminKabasPage`** — Table of all Kabas + create/edit/deactivate via `Modal`.

**`AdminOrdersPage`** — Table of all orders filterable by status. Confirm/cancel actions per row.
Uses: `OrderStatusBadge`

**`AdminCalendarPage`** — Calendar view of all active/confirmed rentals by date.

**`AdminCustomersPage`** — Table of all customers and their order history.

**`AdminPaymentsPage`** — Table of payments, "Record Payment" button per order.

---

### API Service Layer (Axios)

**`axiosInstance.js`**
- Base URL from `VITE_API_URL` env variable (e.g., `http://localhost:8080`)
- No auth headers needed

**`kabaApi.js`** — `listKabas(filters)`, `getKaba(id)`, `checkAvailability(id, eventDate, returnDate)`, `createKaba(data)`, `updateKaba(id, data)`, `deleteKaba(id)`

**`customerApi.js`** — `listCustomers()`, `getCustomer(id)`, `createCustomer(data)`, `updateCustomer(id, data)`

**`orderApi.js`** — `createOrder(data)`, `listOrders(filters)`, `getOrder(id)`, `getOrdersByCustomer(customerId)`, `confirmOrder(id)`, `completeOrder(id)`, `cancelOrder(id)`

**`paymentApi.js`** — `listPayments()`, `getOrderPayments(orderId)`, `recordPayment(data)`

---

## 5. Key Business Logic

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

**Transitions enforced in `OrderService`:**
- `PENDING → CONFIRMED`: Admin action; re-validates availability at confirm time
- `CONFIRMED → ACTIVE`: Admin action (or future scheduled job) when event date is reached
- `ACTIVE → COMPLETED`: Admin marks complete
- `Any → CANCELLED`: Allowed from PENDING or CONFIRMED

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

## Verification Steps
- `GET /api/kabas` → returns list of Kabas
- `GET /api/kabas/{id}/availability?eventDate=2025-06-01&returnDate=2025-06-03` → returns available units
- `POST /api/orders` → creates order, verify price matches calculation
- Attempt to book same Kaba on overlapping dates → expect HTTP 409 Conflict
- `PUT /api/orders/{id}/confirm` → status changes to CONFIRMED
- `POST /api/payments` → payment recorded against order
- All `/admin/*` routes load with no auth prompt
