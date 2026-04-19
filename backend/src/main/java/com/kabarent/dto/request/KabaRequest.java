package com.kabarent.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class KabaRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    private String category;

    private String size;

    @NotNull(message = "Price per day is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal pricePerDay;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity = 1;

    private String imageUrl;
}
