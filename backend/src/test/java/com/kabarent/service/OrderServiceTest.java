package com.kabarent.service;

import com.kabarent.dto.request.CreateOrderRequest;
import com.kabarent.dto.request.CustomerRequest;
import com.kabarent.dto.request.OrderItemRequest;
import com.kabarent.dto.request.UpdateOrderStatusRequest;
import com.kabarent.dto.response.OrderResponse;
import com.kabarent.exception.AvailabilityException;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Customer;
import com.kabarent.model.Kaba;
import com.kabarent.model.Order;
import com.kabarent.model.OrderItem;
import com.kabarent.model.enums.OrderStatus;
import com.kabarent.repository.KabaRepository;
import com.kabarent.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Milestone 1 — OrderService unit tests (O1–O11): pricing, date guard, availability rejection,
 * status-transition matrix, and the confirm-time lock/re-validation path.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final LocalDate EVENT = LocalDate.of(2026, 6, 1);

    @Mock private OrderRepository orderRepository;
    @Mock private CustomerService customerService;
    @Mock private KabaService kabaService;
    @Mock private AvailabilityService availabilityService;
    @Mock private KabaRepository kabaRepository;
    @InjectMocks private OrderService orderService;

    // ---------- helpers ----------

    private Customer customer() {
        return Customer.builder().id(5L).fullName("Sara").phone("050").email("s@x.com").build();
    }

    private Kaba kaba(long id, String name, String price) {
        return Kaba.builder().id(id).name(name).pricePerDay(new BigDecimal(price)).quantity(10).active(true).build();
    }

    private CreateOrderRequest createRequest(LocalDate event, LocalDate ret, OrderItemRequest... items) {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerId(5L);
        req.setEventDate(event);
        req.setReturnDate(ret);
        req.setItems(List.of(items));
        return req;
    }

    private OrderItemRequest item(long kabaId, int qty) {
        OrderItemRequest i = new OrderItemRequest();
        i.setKabaId(kabaId);
        i.setQuantity(qty);
        return i;
    }

    private Order orderWith(Long id, OrderStatus status) {
        return Order.builder()
                .id(id).customer(customer())
                .eventDate(EVENT).returnDate(EVENT.plusDays(3))
                .status(status).totalPrice(BigDecimal.TEN)
                .build();
    }

    // ---------- create ----------

    // O1
    @Test
    void create_multiItemMultiDay_pricesAndSnapshotsUnitPrice() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(3), item(1L, 2), item(2L, 1)); // 3 days
        Kaba a = kaba(1L, "Black Gold", "100");
        Kaba b = kaba(2L, "Red Gold", "50");
        when(customerService.findOrThrow(5L)).thenReturn(customer());
        when(kabaService.findOrThrow(1L)).thenReturn(a);
        when(kabaService.findOrThrow(2L)).thenReturn(b);
        when(availabilityService.isAvailable(1L, req.getEventDate(), req.getReturnDate(), 2)).thenReturn(true);
        when(availabilityService.isAvailable(2L, req.getEventDate(), req.getReturnDate(), 1)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.create(req);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        Order saved = captor.getValue();

        // 100*3*2 + 50*3*1 = 600 + 150 = 750
        assertThat(saved.getTotalPrice()).isEqualByComparingTo("750");
        assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING); // entity default
        assertThat(saved.getItems()).extracting(OrderItem::getUnitPrice)
                .containsExactlyInAnyOrder(new BigDecimal("100"), new BigDecimal("50"));
    }

    // O2
    @Test
    void create_returnNotAfterEvent_throwsIllegalArgument() {
        CreateOrderRequest equalDates = createRequest(EVENT, EVENT, item(1L, 1));
        CreateOrderRequest reversed = createRequest(EVENT, EVENT.minusDays(1), item(1L, 1));

        assertThatThrownBy(() -> orderService.create(equalDates)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> orderService.create(reversed)).isInstanceOf(IllegalArgumentException.class);

        verify(orderRepository, never()).save(any());
    }

    // O3
    @Test
    void create_insufficientAvailability_throwsAvailabilityException() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(2), item(1L, 4));
        when(customerService.findOrThrow(5L)).thenReturn(customer());
        when(kabaService.findOrThrow(1L)).thenReturn(kaba(1L, "Black Gold", "100"));
        when(availabilityService.isAvailable(1L, req.getEventDate(), req.getReturnDate(), 4)).thenReturn(false);

        assertThatThrownBy(() -> orderService.create(req)).isInstanceOf(AvailabilityException.class);
        verify(orderRepository, never()).save(any());
    }

    // O4
    @Test
    void create_customerNotFound_throwsResourceNotFound() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(2), item(1L, 1));
        when(customerService.findOrThrow(5L)).thenThrow(new ResourceNotFoundException("no customer"));

        assertThatThrownBy(() -> orderService.create(req)).isInstanceOf(ResourceNotFoundException.class);
        verify(orderRepository, never()).save(any());
    }

    // O5
    @Test
    void create_kabaNotFound_throwsResourceNotFound() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(2), item(1L, 1));
        when(customerService.findOrThrow(5L)).thenReturn(customer());
        when(kabaService.findOrThrow(1L)).thenThrow(new ResourceNotFoundException("no kaba"));

        assertThatThrownBy(() -> orderService.create(req)).isInstanceOf(ResourceNotFoundException.class);
        verify(orderRepository, never()).save(any());
    }

    // O6
    @Test
    void create_oneDayRental_rentalDaysIsOne() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(1), item(1L, 1)); // 1 day
        when(customerService.findOrThrow(5L)).thenReturn(customer());
        when(kabaService.findOrThrow(1L)).thenReturn(kaba(1L, "Black Gold", "100"));
        when(availabilityService.isAvailable(1L, req.getEventDate(), req.getReturnDate(), 1)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.create(req);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertThat(captor.getValue().getTotalPrice()).isEqualByComparingTo("100"); // 100*1*1
    }

    // O1b — guest checkout: no customerId, customer details find-or-created by phone
    @Test
    void create_guestCheckout_findsOrCreatesCustomerByPhone() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(2), item(1L, 1));
        req.setCustomerId(null);
        CustomerRequest guest = new CustomerRequest();
        guest.setFullName("Sara");
        guest.setPhone("050-1234567");
        guest.setEmail("s@x.com");
        req.setCustomer(guest);

        when(customerService.findOrCreateByPhone(guest)).thenReturn(customer());
        when(kabaService.findOrThrow(1L)).thenReturn(kaba(1L, "Black Gold", "100"));
        when(availabilityService.isAvailable(1L, req.getEventDate(), req.getReturnDate(), 1)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.create(req);

        verify(customerService).findOrCreateByPhone(guest);
        verify(orderRepository).save(any(Order.class));
    }

    // O1c — neither customerId nor customer details → 400
    @Test
    void create_noCustomerIdOrDetails_throwsIllegalArgument() {
        CreateOrderRequest req = createRequest(EVENT, EVENT.plusDays(2), item(1L, 1));
        req.setCustomerId(null);
        req.setCustomer(null);

        assertThatThrownBy(() -> orderService.create(req)).isInstanceOf(IllegalArgumentException.class);
        verify(orderRepository, never()).save(any());
    }

    // ---------- updateStatus ----------

    // O7 — legal non-confirm transitions
    @ParameterizedTest(name = "{0} -> {1} is allowed")
    @CsvSource({
            "PENDING,   CANCELLED",
            "CONFIRMED, ACTIVE",
            "CONFIRMED, CANCELLED",
            "ACTIVE,    COMPLETED"
    })
    void updateStatus_legalTransitions_succeed(OrderStatus current, OrderStatus target) {
        Order order = orderWith(1L, current);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(target);

        OrderResponse res = orderService.updateStatus(1L, req);

        assertThat(res.getStatus()).isEqualTo(target);
        verify(orderRepository).save(order);
    }

    // O8 — illegal transitions
    @ParameterizedTest(name = "{0} -> {1} is rejected")
    @CsvSource({
            "PENDING,   ACTIVE",
            "PENDING,   COMPLETED",
            "CONFIRMED, COMPLETED",
            "ACTIVE,    CANCELLED",
            "COMPLETED, ACTIVE",
            "CANCELLED, CONFIRMED"
    })
    void updateStatus_illegalTransitions_throw(OrderStatus current, OrderStatus target) {
        Order order = orderWith(1L, current);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(target);

        assertThatThrownBy(() -> orderService.updateStatus(1L, req))
                .isInstanceOf(IllegalArgumentException.class);
        verify(orderRepository, never()).save(any());
    }

    // O9 — confirm path locks each kaba and re-validates excluding self
    @Test
    void updateStatus_confirm_locksEachKabaAndRevalidatesExcludingSelf() {
        Order order = orderWith(1L, OrderStatus.PENDING);
        Kaba k1 = kaba(10L, "Black Gold", "100");
        Kaba k2 = kaba(20L, "Red Gold", "50");
        order.setItems(new ArrayList<>(List.of(
                OrderItem.builder().id(1L).order(order).kaba(k1).quantity(2).unitPrice(new BigDecimal("100")).build(),
                OrderItem.builder().id(2L).order(order).kaba(k2).quantity(1).unitPrice(new BigDecimal("50")).build()
        )));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(availabilityService.isAvailable(10L, order.getEventDate(), order.getReturnDate(), 2, 1L)).thenReturn(true);
        when(availabilityService.isAvailable(20L, order.getEventDate(), order.getReturnDate(), 1, 1L)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.CONFIRMED);

        OrderResponse res = orderService.updateStatus(1L, req);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(kabaRepository).findByIdWithLock(10L);
        verify(kabaRepository).findByIdWithLock(20L);
        verify(availabilityService).isAvailable(10L, order.getEventDate(), order.getReturnDate(), 2, 1L);
        verify(availabilityService).isAvailable(20L, order.getEventDate(), order.getReturnDate(), 1, 1L);
    }

    // O10 — confirm rejected when stock no longer available
    @Test
    void updateStatus_confirm_noLongerAvailable_throwsAvailabilityException() {
        Order order = orderWith(1L, OrderStatus.PENDING);
        Kaba k1 = kaba(10L, "Black Gold", "100");
        order.setItems(new ArrayList<>(List.of(
                OrderItem.builder().id(1L).order(order).kaba(k1).quantity(2).unitPrice(new BigDecimal("100")).build()
        )));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(availabilityService.isAvailable(anyLong(), any(), any(), anyInt(), eq(1L))).thenReturn(false);

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.CONFIRMED);

        assertThatThrownBy(() -> orderService.updateStatus(1L, req))
                .isInstanceOf(AvailabilityException.class);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
        verify(orderRepository, never()).save(any());
    }

    // O11
    @Test
    void updateStatus_orderNotFound_throwsResourceNotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.CONFIRMED);

        assertThatThrownBy(() -> orderService.updateStatus(99L, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
