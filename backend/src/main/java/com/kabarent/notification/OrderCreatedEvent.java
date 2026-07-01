package com.kabarent.notification;

import com.kabarent.model.Order;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrderCreatedEvent(
    Long orderId,
    String customerName,
    String customerPhone,
    String customerEmail,
    BigDecimal totalPrice,
    LocalDate eventDate,
    LocalDate returnDate
) {
    public static OrderCreatedEvent from(Order order) {
        return new OrderCreatedEvent(
                order.getId(),
                order.getCustomer().getFullName(),
                order.getCustomer().getPhone(),
                order.getCustomer().getEmail(),
                order.getTotalPrice(),
                order.getEventDate(),
                order.getReturnDate()
        );
    }
}
