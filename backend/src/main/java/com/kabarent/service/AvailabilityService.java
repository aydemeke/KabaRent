package com.kabarent.service;

import com.kabarent.dto.response.AvailabilityResponse;
import com.kabarent.dto.response.KabaResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Kaba;
import com.kabarent.repository.KabaRepository;
import com.kabarent.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final KabaRepository kabaRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Returns the number of available units for a specific Kaba on the requested date range.
     * Only CONFIRMED and ACTIVE orders block inventory — PENDING and CANCELLED do not.
     */
    public AvailabilityResponse checkAvailability(Long kabaId, LocalDate eventDate, LocalDate returnDate) {
        Kaba kaba = kabaRepository.findById(kabaId)
                .orElseThrow(() -> new ResourceNotFoundException("Kaba not found with id: " + kabaId));

        int booked = orderItemRepository.sumBookedQuantity(kabaId, eventDate, returnDate);
        int available = kaba.getQuantity() - booked;

        return AvailabilityResponse.builder()
                .kabaId(kaba.getId())
                .kabaName(kaba.getName())
                .eventDate(eventDate)
                .returnDate(returnDate)
                .totalQuantity(kaba.getQuantity())
                .bookedQuantity(booked)
                .availableQuantity(Math.max(available, 0))
                .available(available > 0)
                .build();
    }

    /**
     * Returns true if at least 'requiredQty' units of the given Kaba are free
     * for the requested date range. Used by OrderService before creating an order.
     */
    public boolean isAvailable(Long kabaId, LocalDate eventDate, LocalDate returnDate, int requiredQty) {
        Kaba kaba = kabaRepository.findById(kabaId)
                .orElseThrow(() -> new ResourceNotFoundException("Kaba not found with id: " + kabaId));

        int booked = orderItemRepository.sumBookedQuantity(kabaId, eventDate, returnDate);
        return (kaba.getQuantity() - booked) >= requiredQty;
    }

    /**
     * Returns all active Kabas that have at least 1 unit available for the given date range.
     */
    public List<KabaResponse> getAvailableKabas(LocalDate eventDate, LocalDate returnDate) {
        List<Kaba> allActive = kabaRepository.findByActiveTrue();
        List<KabaResponse> available = new ArrayList<>();

        for (Kaba kaba : allActive) {
            int booked = orderItemRepository.sumBookedQuantity(kaba.getId(), eventDate, returnDate);
            if (kaba.getQuantity() - booked > 0) {
                available.add(KabaResponse.from(kaba));
            }
        }
        return available;
    }
}
