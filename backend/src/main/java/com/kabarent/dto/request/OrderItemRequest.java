package com.kabarent.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemRequest {

    @NotNull(message = "Kaba ID is required")
    private Long kabaId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity = 1;
}
