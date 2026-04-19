package com.kabarent.repository;

import com.kabarent.model.Order;
import com.kabarent.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerId(Long customerId);

    List<Order> findByStatus(OrderStatus status);

    // Finds all confirmed/active orders for a given kaba that overlap with the requested date range.
    // Used by AvailabilityService to detect conflicts.
    @Query("""
            SELECT o FROM Order o
            JOIN o.items i
            WHERE i.kaba.id = :kabaId
              AND o.status IN ('CONFIRMED', 'ACTIVE')
              AND o.eventDate < :returnDate
              AND o.returnDate > :eventDate
            """)
    List<Order> findOverlappingOrders(
            @Param("kabaId") Long kabaId,
            @Param("eventDate") LocalDate eventDate,
            @Param("returnDate") LocalDate returnDate
    );
}
