package com.kabarent.repository;

import com.kabarent.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Returns the total quantity of a specific kaba already booked on
    // CONFIRMED or ACTIVE orders that overlap with the requested date range.
    // Used by AvailabilityService to calculate available units.
    @Query("""
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM OrderItem oi
            JOIN oi.order o
            WHERE oi.kaba.id = :kabaId
              AND o.status IN ('CONFIRMED', 'ACTIVE')
              AND o.eventDate < :returnDate
              AND o.returnDate > :eventDate
            """)
    Integer sumBookedQuantity(
            @Param("kabaId") Long kabaId,
            @Param("eventDate") LocalDate eventDate,
            @Param("returnDate") LocalDate returnDate
    );
}
