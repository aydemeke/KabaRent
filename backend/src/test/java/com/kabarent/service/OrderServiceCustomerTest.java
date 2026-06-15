package com.kabarent.service;

import com.kabarent.dto.response.OrderResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Customer;
import com.kabarent.model.Order;
import com.kabarent.model.enums.OrderStatus;
import com.kabarent.repository.KabaRepository;
import com.kabarent.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Customer self-service ownership + PENDING-only cancel ({@code /api/my/**} backing logic).
 * customerId always comes from the caller (the controller passes the JWT principal id).
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceCustomerTest {

    private static final long OWNER_ID = 5L;
    private static final long OTHER_ID = 999L;
    private static final LocalDate EVENT = LocalDate.of(2026, 6, 1);

    @Mock private OrderRepository orderRepository;
    @Mock private CustomerService customerService;
    @Mock private KabaService kabaService;
    @Mock private AvailabilityService availabilityService;
    @Mock private KabaRepository kabaRepository;
    @InjectMocks private OrderService orderService;

    private Order orderOwnedBy(long customerId, OrderStatus status) {
        Customer owner = Customer.builder().id(customerId).fullName("Sara").phone("050").email("s@x.com").build();
        return Order.builder()
                .id(1L).customer(owner)
                .eventDate(EVENT).returnDate(EVENT.plusDays(2))
                .status(status).totalPrice(BigDecimal.TEN)
                .build();
    }

    // --- getByIdForCustomer ---

    @Test
    void getByIdForCustomer_owner_returnsOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(orderOwnedBy(OWNER_ID, OrderStatus.PENDING)));

        OrderResponse res = orderService.getByIdForCustomer(1L, OWNER_ID);

        assertThat(res.getId()).isEqualTo(1L);
    }

    @Test
    void getByIdForCustomer_otherCustomer_throwsNotFound() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(orderOwnedBy(OWNER_ID, OrderStatus.PENDING)));

        // Customer B must not learn that the id exists → 404, not 403.
        assertThatThrownBy(() -> orderService.getByIdForCustomer(1L, OTHER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getByIdForCustomer_missing_throwsNotFound() {
        when(orderRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getByIdForCustomer(1L, OWNER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- cancelForCustomer ---

    @Test
    void cancelForCustomer_pendingOwned_cancels() {
        Order order = orderOwnedBy(OWNER_ID, OrderStatus.PENDING);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.cancelForCustomer(1L, OWNER_ID);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orderRepository).save(order);
    }

    @ParameterizedTest(name = "cannot self-cancel a {0} order")
    @EnumSource(value = OrderStatus.class, names = {"CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"})
    void cancelForCustomer_nonPending_rejected(OrderStatus status) {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(orderOwnedBy(OWNER_ID, status)));

        assertThatThrownBy(() -> orderService.cancelForCustomer(1L, OWNER_ID))
                .isInstanceOf(IllegalArgumentException.class);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancelForCustomer_otherCustomer_throwsNotFound() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(orderOwnedBy(OWNER_ID, OrderStatus.PENDING)));

        assertThatThrownBy(() -> orderService.cancelForCustomer(1L, OTHER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(orderRepository, never()).save(any());
    }
}
