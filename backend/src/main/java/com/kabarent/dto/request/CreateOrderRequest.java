package com.kabarent.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateOrderRequest {

    /**
     * Existing customer id (used by admin / known-customer flows). Optional: guest checkout
     * instead supplies {@link #customer} details, which are find-or-created by phone server-side.
     */
    private Long customerId;

    /** Guest checkout customer details (find-or-create by phone). Required when {@link #customerId} is absent. */
    @Valid
    private CustomerRequest customer;

    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date cannot be in the past")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate eventDate;

    @NotNull(message = "Return date is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate returnDate;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String notes;
}
