package com.kabarent.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateOrderRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Event date is required")
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
