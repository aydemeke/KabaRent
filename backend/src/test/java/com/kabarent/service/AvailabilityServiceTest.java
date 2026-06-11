package com.kabarent.service;

import com.kabarent.dto.response.AvailabilityResponse;
import com.kabarent.dto.response.KabaResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Kaba;
import com.kabarent.repository.KabaRepository;
import com.kabarent.repository.OrderItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Milestone 1 — AvailabilityService unit tests (A1–A7).
 *
 * These verify the service's arithmetic and control flow with mocked repositories.
 * The actual overlap/half-open/status-filter rule lives in OrderItemRepository's JPQL and is
 * covered separately by {@code OrderItemRepositoryIT} against a real PostgreSQL container.
 */
@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    private static final LocalDate EVENT = LocalDate.of(2026, 6, 1);
    private static final LocalDate RETURN = LocalDate.of(2026, 6, 4);

    @Mock private KabaRepository kabaRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @InjectMocks private AvailabilityService availabilityService;

    private Kaba kaba(long id, String name, int quantity) {
        return Kaba.builder()
                .id(id).name(name)
                .pricePerDay(new BigDecimal("100"))
                .quantity(quantity)
                .active(true)
                .build();
    }

    // A1
    @Test
    void checkAvailability_noBookings_returnsFullAvailability() {
        when(kabaRepository.findById(1L)).thenReturn(Optional.of(kaba(1L, "Black Gold", 5)));
        when(orderItemRepository.sumBookedQuantity(1L, EVENT, RETURN)).thenReturn(0);

        AvailabilityResponse res = availabilityService.checkAvailability(1L, EVENT, RETURN);

        assertThat(res.getKabaId()).isEqualTo(1L);
        assertThat(res.getKabaName()).isEqualTo("Black Gold");
        assertThat(res.getTotalQuantity()).isEqualTo(5);
        assertThat(res.getBookedQuantity()).isZero();
        assertThat(res.getAvailableQuantity()).isEqualTo(5);
        assertThat(res.isAvailable()).isTrue();
    }

    // A2
    @Test
    void checkAvailability_partialBookings_subtractsBooked() {
        when(kabaRepository.findById(1L)).thenReturn(Optional.of(kaba(1L, "Black Gold", 5)));
        when(orderItemRepository.sumBookedQuantity(1L, EVENT, RETURN)).thenReturn(2);

        AvailabilityResponse res = availabilityService.checkAvailability(1L, EVENT, RETURN);

        assertThat(res.getBookedQuantity()).isEqualTo(2);
        assertThat(res.getAvailableQuantity()).isEqualTo(3);
        assertThat(res.isAvailable()).isTrue();
    }

    // A3
    @ParameterizedTest(name = "quantity=5, booked={0} -> availableQuantity=0, available=false")
    @CsvSource({"5", "7"}) // exactly full, and overbooked
    void checkAvailability_fullyOrOverBooked_clampsToZeroAndUnavailable(int booked) {
        when(kabaRepository.findById(1L)).thenReturn(Optional.of(kaba(1L, "Black Gold", 5)));
        when(orderItemRepository.sumBookedQuantity(1L, EVENT, RETURN)).thenReturn(booked);

        AvailabilityResponse res = availabilityService.checkAvailability(1L, EVENT, RETURN);

        assertThat(res.getAvailableQuantity()).isZero(); // never negative
        assertThat(res.isAvailable()).isFalse();
    }

    // A4
    @Test
    void checkAvailability_kabaNotFound_throwsResourceNotFound() {
        when(kabaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> availabilityService.checkAvailability(99L, EVENT, RETURN))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(orderItemRepository);
    }

    // A5
    @ParameterizedTest(name = "quantity=5, booked=3, required={0} -> {1}")
    @CsvSource({"2, true", "3, false"})
    void isAvailable_quantityBoundary(int required, boolean expected) {
        when(kabaRepository.findById(1L)).thenReturn(Optional.of(kaba(1L, "Black Gold", 5)));
        when(orderItemRepository.sumBookedQuantity(1L, EVENT, RETURN)).thenReturn(3);

        assertThat(availabilityService.isAvailable(1L, EVENT, RETURN, required)).isEqualTo(expected);
    }

    // A6
    @Test
    void isAvailable_withExcludeOrder_usesExclusionQuery() {
        when(kabaRepository.findById(1L)).thenReturn(Optional.of(kaba(1L, "Black Gold", 2)));
        when(orderItemRepository.sumBookedQuantityExcludingOrder(1L, EVENT, RETURN, 10L)).thenReturn(0);

        boolean result = availabilityService.isAvailable(1L, EVENT, RETURN, 2, 10L);

        assertThat(result).isTrue();
        verify(orderItemRepository).sumBookedQuantityExcludingOrder(1L, EVENT, RETURN, 10L);
        verify(orderItemRepository, never()).sumBookedQuantity(anyLong(), any(), any());
    }

    // A7
    @Test
    void getAvailableKabas_returnsOnlyKabasWithFreeUnits() {
        Kaba a = kaba(1L, "Black Gold", 5);
        Kaba b = kaba(2L, "Red Gold", 1);
        when(kabaRepository.findByActiveTrue()).thenReturn(List.of(a, b));
        when(orderItemRepository.sumBookedQuantity(eq(1L), any(), any())).thenReturn(1); // 4 free
        when(orderItemRepository.sumBookedQuantity(eq(2L), any(), any())).thenReturn(1); // 0 free

        List<KabaResponse> result = availabilityService.getAvailableKabas(EVENT, RETURN);

        assertThat(result).extracting(KabaResponse::getId).containsExactly(1L);
    }
}
