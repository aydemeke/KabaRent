package com.kabarent.repository;

import com.kabarent.model.Customer;
import com.kabarent.model.Kaba;
import com.kabarent.model.Order;
import com.kabarent.model.OrderItem;
import com.kabarent.model.enums.OrderStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Milestone 1 — OrderItemRepository integration tests (A8–A12).
 *
 * These run against a real PostgreSQL container because the core "no double-booking" rule lives
 * in the JPQL of {@code sumBookedQuantity*}: the half-open date-overlap predicate
 * ({@code eventDate < :returnDate AND returnDate > :eventDate}) and the CONFIRMED/ACTIVE-only
 * status filter. Mocking the query in a service unit test cannot verify these.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderItemRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private TestEntityManager em;

    // ---------- fixtures ----------

    private static LocalDate d(int day) {
        return LocalDate.of(2026, 6, day);
    }

    private Kaba persistKaba(int quantity) {
        return em.persist(Kaba.builder()
                .name("Black Gold").pricePerDay(new BigDecimal("100"))
                .quantity(quantity).active(true).build());
    }

    private Customer persistCustomer() {
        return em.persist(Customer.builder()
                .fullName("Test").phone("050")
                .email("c-" + UUID.randomUUID() + "@x.com").build());
    }

    private Order persistOrder(Kaba kaba, OrderStatus status, LocalDate event, LocalDate ret, int qty) {
        Order order = Order.builder()
                .customer(persistCustomer())
                .eventDate(event).returnDate(ret)
                .status(status).totalPrice(new BigDecimal("100"))
                .build();
        OrderItem item = OrderItem.builder()
                .order(order).kaba(kaba).quantity(qty).unitPrice(new BigDecimal("100"))
                .build();
        order.getItems().add(item); // cascade ALL persists the item
        return em.persist(order);
    }

    // A8 — half-open boundary: a booking ending the day another starts does not conflict
    @Test
    void sumBookedQuantity_adjacentRanges_returnsZero() {
        Kaba kaba = persistKaba(5);
        persistOrder(kaba, OrderStatus.CONFIRMED, d(1), d(4), 2);
        em.flush();

        Integer booked = orderItemRepository.sumBookedQuantity(kaba.getId(), d(4), d(7));

        assertThat(booked).isZero();
    }

    // A9 — overlapping CONFIRMED + ACTIVE bookings accumulate
    @Test
    void sumBookedQuantity_overlappingRanges_sumsQuantities() {
        Kaba kaba = persistKaba(10);
        persistOrder(kaba, OrderStatus.CONFIRMED, d(1), d(5), 2);
        persistOrder(kaba, OrderStatus.ACTIVE, d(4), d(8), 1);
        em.flush();

        Integer booked = orderItemRepository.sumBookedQuantity(kaba.getId(), d(1), d(10));

        assertThat(booked).isEqualTo(3);
    }

    // A10 — only CONFIRMED/ACTIVE block stock; PENDING and CANCELLED are ignored
    @Test
    void sumBookedQuantity_ignoresPendingAndCancelled() {
        Kaba kaba = persistKaba(10);
        persistOrder(kaba, OrderStatus.PENDING, d(2), d(6), 5);
        persistOrder(kaba, OrderStatus.CANCELLED, d(2), d(6), 5);
        persistOrder(kaba, OrderStatus.CONFIRMED, d(2), d(6), 2);
        em.flush();

        Integer booked = orderItemRepository.sumBookedQuantity(kaba.getId(), d(1), d(10));

        assertThat(booked).isEqualTo(2);
    }

    // A11 — a single shared day counts as an overlap
    @Test
    void sumBookedQuantity_oneDayOverlap_counts() {
        Kaba kaba = persistKaba(10);
        persistOrder(kaba, OrderStatus.CONFIRMED, d(1), d(3), 4);
        em.flush();

        Integer booked = orderItemRepository.sumBookedQuantity(kaba.getId(), d(2), d(4));

        assertThat(booked).isEqualTo(4);
    }

    // A12 — the excluding variant leaves out the given order
    @Test
    void sumBookedQuantityExcludingOrder_excludesGivenOrder() {
        Kaba kaba = persistKaba(10);
        Order first = persistOrder(kaba, OrderStatus.CONFIRMED, d(1), d(5), 2);
        persistOrder(kaba, OrderStatus.CONFIRMED, d(1), d(5), 2);
        em.flush();

        Integer booked = orderItemRepository.sumBookedQuantityExcludingOrder(
                kaba.getId(), d(1), d(5), first.getId());

        assertThat(booked).isEqualTo(2);
    }
}
