package com.kabarent.dto.response;

import com.kabarent.model.Order;
import com.kabarent.model.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {

    private Long id;
    private CustomerResponse customer;
    private LocalDate eventDate;
    private LocalDate returnDate;
    private OrderStatus status;
    private BigDecimal totalPrice;
    private String notes;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .customer(CustomerResponse.from(order.getCustomer()))
                .eventDate(order.getEventDate())
                .returnDate(order.getReturnDate())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(OrderItemResponse::from).toList())
                .build();
    }
}
