package com.kabarent.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AvailabilityResponse {

    private Long kabaId;
    private String kabaName;
    private LocalDate eventDate;
    private LocalDate returnDate;
    private int totalQuantity;
    private int bookedQuantity;
    private int availableQuantity;
    private boolean available;
}
