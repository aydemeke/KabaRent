# KabaRent — מערכת השכרת קאבות לאירועים

A full-stack rental management system for traditional Ethiopian Kaba garments, built for event-based bookings. The system serves both end customers (browsing, ordering) and administrators (inventory, orders, payments).

> **מערכת מקוונת להשכרת קאבות מסורתיות לאירועים — לקוחות, הזמנות, ותשלומים במקום אחד.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3, Spring Data JPA / Hibernate |
| **Database** | H2 in-memory (development) |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| **Build** | Maven (backend), npm (frontend) |

---

## Project Structure

```
KabaRent/
├── backend/                          # Spring Boot application
│   ├── pom.xml                       # Maven build descriptor
│   └── src/main/java/com/kabarent/
│       ├── KabaRentApplication.java  # Application entry point
│       ├── config/
│       │   └── CorsConfig.java       # CORS rules (allows localhost:5173)
│       ├── controller/               # REST controllers (one per resource)
│       │   ├── KabaController.java
│       │   ├── CustomerController.java
│       │   ├── OrderController.java
│       │   └── PaymentController.java
│       ├── dto/
│       │   ├── request/              # Validated inbound payloads
│       │   │   ├── CreateOrderRequest.java
│       │   │   ├── CustomerRequest.java
│       │   │   ├── KabaRequest.java
│       │   │   ├── OrderItemRequest.java
│       │   │   ├── RecordPaymentRequest.java
│       │   │   └── UpdateOrderStatusRequest.java
│       │   └── response/             # Outbound response shapes
│       │       ├── AvailabilityResponse.java
│       │       ├── CustomerResponse.java
│       │       ├── KabaResponse.java
│       │       ├── OrderItemResponse.java
│       │       ├── OrderResponse.java
│       │       ├── PaymentBalanceResponse.java
│       │       └── PaymentResponse.java
│       ├── exception/
│       │   ├── AvailabilityException.java     # 409 – date conflict
│       │   ├── ResourceNotFoundException.java # 404 – entity not found
│       │   └── GlobalExceptionHandler.java    # Centralized error mapping
│       ├── model/                    # JPA entities
│       │   ├── Customer.java
│       │   ├── Kaba.java
│       │   ├── Order.java
│       │   ├── OrderItem.java
│       │   ├── Payment.java
│       │   └── enums/
│       │       ├── OrderStatus.java   # PENDING | CONFIRMED | ACTIVE | COMPLETED | CANCELLED
│       │       ├── PaymentMethod.java # CASH | BANK_TRANSFER | CREDIT_CARD | BIT | PAYBOX
│       │       └── PaymentStatus.java # PENDING | COMPLETED | REFUNDED
│       ├── repository/               # Spring Data JPA interfaces
│       │   ├── CustomerRepository.java
│       │   ├── KabaRepository.java
│       │   ├── OrderItemRepository.java
│       │   ├── OrderRepository.java
│       │   └── PaymentRepository.java
│       └── service/                  # Business logic layer
│           ├── AvailabilityService.java  # Overlap detection
│           ├── CustomerService.java
│           ├── KabaService.java
│           ├── OrderService.java
│           └── PaymentService.java       # Balance validation
│
├── frontend/                         # React / Vite application
│   ├── index.html
│   ├── package.json
│   ├── public/
│   │   └── kaba-pictures/            # Static Kaba images served by Vite
│   └── src/
│       ├── App.jsx                   # Router setup, layout shell
│       ├── api/                      # Axios call wrappers (one file per resource)
│       │   ├── axiosInstance.js      # Base URL + interceptors
│       │   ├── kabas.js
│       │   ├── customers.js
│       │   ├── orders.js
│       │   └── payments.js
│       ├── components/               # Shared UI components
│       │   ├── AdminGuard.jsx        # Password gate for admin routes
│       │   ├── DateInput.jsx         # Styled date picker wrapper
│       │   ├── KabaDetailModal.jsx   # Package details modal
│       │   ├── KabaPlaceholder.jsx   # Empty-state illustration
│       │   ├── Modal.jsx             # Generic modal shell
│       │   ├── Navbar.jsx
│       │   ├── Spinner.jsx
│       │   └── StatusBadge.jsx
│       └── pages/
│           ├── customer/
│           │   ├── BrowsePage.jsx    # Availability search + Kaba grid
│           │   ├── NewOrderPage.jsx  # Multi-step order form
│           │   └── OrderStatusPage.jsx
│           └── admin/
│               ├── AdminDashboardPage.jsx
│               ├── AdminKabasPage.jsx     # Inventory CRUD
│               ├── AdminOrdersPage.jsx    # Order management + status updates
│               ├── AdminCustomersPage.jsx
│               └── AdminPaymentsPage.jsx  # Payment recording + balance view
│
└── docs/
    └── ARCHITECTURE.md               # System design notes
```

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- Maven 3.8+

### Run the Backend

```bash
cd backend
mvn spring-boot:run
```

- API runs on **http://localhost:8080**
- H2 console: **http://localhost:8080/h2-console**
  - JDBC URL: `jdbc:h2:mem:kabarentdb`
  - Username: `sa` / Password: *(leave blank)*

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

- App runs on **http://localhost:5173**
- Admin dashboard: **http://localhost:5173/admin**

---

## API Endpoints

### Kabas

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/kabas` | List all Kabas |
| `GET` | `/api/kabas/{id}` | Get a single Kaba |
| `GET` | `/api/kabas/available?eventDate=&returnDate=` | Filter by availability |
| `GET` | `/api/kabas/{id}/availability?eventDate=&returnDate=` | Check one Kaba's availability |
| `POST` | `/api/kabas` | Create a Kaba |
| `PUT` | `/api/kabas/{id}` | Update a Kaba |
| `DELETE` | `/api/kabas/{id}` | Delete a Kaba |

### Customers

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/customers` | List all customers |
| `GET` | `/api/customers/{id}` | Get a single customer |
| `POST` | `/api/customers` | Create or find a customer |

### Orders

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/{id}` | Get order details (with items) |
| `POST` | `/api/orders` | Place a new order |
| `PATCH` | `/api/orders/{id}/status` | Update order status |

### Payments

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/payments` | List all payments |
| `GET` | `/api/payments/order/{orderId}` | Payments for a specific order |
| `GET` | `/api/payments/order/{orderId}/balance` | Balance summary `{ totalPrice, totalPaid, remainingBalance, isFullyPaid }` |
| `POST` | `/api/payments` | Record a payment |

---

## Key Features

- **Browse & search** — filter available Kabas by event date and return date
- **Package details modal** — full package contents, image, and pricing per Kaba card
- **Order flow** — customer details, date selection, real-time availability check, estimated total
- **Order lifecycle** — status transitions managed from the admin dashboard
- **Split payments** — an order can receive multiple partial payments; total cannot exceed the order price
- **Payment validation** — backend rejects overpayments and duplicate full payments
- **Admin dashboard** — password-protected; manages inventory, orders, customers, and payments
- **Inventory management** — Kaba CRUD with image URL support and color/size/category metadata

---

## Business Rules

- A Kaba cannot be double-booked on overlapping rental dates
- Payment for an order can be split across multiple transactions
- The sum of all payments for an order cannot exceed its `totalPrice`
- Once fully paid, an order no longer appears in the unpaid orders list
- Order lifecycle: `PENDING` → `CONFIRMED` → `ACTIVE` → `COMPLETED` / `CANCELLED`
- Cancelled orders are excluded from payment recording

---

## Roadmap / Next Steps

- [ ] Replace admin password prompt with real JWT authentication
- [ ] Switch from H2 to PostgreSQL for production
- [ ] Add SMS / email notifications for order confirmation
- [ ] Add customer-facing order tracking page
- [ ] Support image upload to server (currently uses static file paths)
- [ ] Add reporting and revenue summary to the admin dashboard

---

## Contributing

This project is under active development. Before contributing, please read [`/docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for system design decisions and conventions.
