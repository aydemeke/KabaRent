package com.kabarent.service;

import com.kabarent.dto.request.CreateOrderRequest;
import com.kabarent.dto.request.OrderItemRequest;
import com.kabarent.dto.request.UpdateOrderStatusRequest;
import com.kabarent.dto.response.OrderResponse;
import com.kabarent.exception.AvailabilityException;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.*;
import com.kabarent.model.enums.OrderStatus;
import com.kabarent.repository.IdempotencyRecordRepository;
import com.kabarent.repository.KabaRepository;
import com.kabarent.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final KabaService kabaService;
    private final AvailabilityService availabilityService;
    private final KabaRepository kabaRepository;
    private final IdempotencyRecordRepository idempotencyRecordRepository;
    /**
     * Self-reference used to invoke {@link #createWithIdempotency} / {@link #create(CreateOrderRequest)}
     * through the Spring proxy. A plain {@code this.} call would be self-invocation and bypass the
     * transactional proxy, so the inner method would not run in its own transaction. Injected lazily
     * via {@link ObjectProvider} to avoid a construction-time circular dependency.
     */
    private final ObjectProvider<OrderService> self;

    /** Max idempotency key length; mirrors the {@code idempotency_records.idempotency_key} column. */
    private static final int MAX_IDEMPOTENCY_KEY_LENGTH = 64;

    /**
     * Idempotent order creation. When an {@code Idempotency-Key} is supplied, a retried or
     * double-submitted checkout returns the original order instead of creating a duplicate.
     * When the key is absent/blank, behaves exactly like {@link #create(CreateOrderRequest)}.
     *
     * <p>The key is matched on the string only, not on a request fingerprint: reusing the same key
     * with a different request body returns the order created by the first call, ignoring the new body.
     *
     * <p>This is the public entry point and is deliberately NOT {@code @Transactional}: it must be
     * able to catch a unique-key conflict thrown by the inner transaction and then re-read in a
     * fresh transaction. (The lazy {@code items} mapping in the fast-path/re-read works outside an
     * explicit transaction via Spring's open-in-view, consistent with {@link #getById}.)
     */
    public OrderResponse create(CreateOrderRequest request, String idempotencyKey, Long customerId) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return self.getObject().create(request, customerId);
        }
        // Reject an over-long key up front (400) rather than letting it overflow the column at
        // insert time and surface as a misleading 409 data-integrity error.
        if (idempotencyKey.length() > MAX_IDEMPOTENCY_KEY_LENGTH) {
            throw new IllegalArgumentException("Idempotency-Key must be at most 64 characters");
        }

        // Fast path: this key already created an order — return it, never create a second.
        Optional<IdempotencyRecord> existing = idempotencyRecordRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return OrderResponse.from(findOrThrow(existing.get().getOrderId()));
        }

        try {
            return self.getObject().createWithIdempotency(idempotencyKey, request, customerId);
        } catch (DataIntegrityViolationException e) {
            // A concurrent request won the race and took the unique key; OUR inner transaction
            // fully rolled back, so no orphan order exists. Re-read and return the winner's order.
            return idempotencyRecordRepository.findByIdempotencyKey(idempotencyKey)
                    .map(rec -> OrderResponse.from(findOrThrow(rec.getOrderId())))
                    .orElseThrow(() -> e); // no record -> a different integrity error -> rethrow
        }
    }

    /**
     * Inner step of idempotent creation: persists the order AND its idempotency record in a single
     * transaction. {@code saveAndFlush} forces the unique-constraint check to surface HERE, so on a
     * conflict the order and record roll back together (no orphan order). The exception is NOT
     * caught here — a rollback-only transaction cannot continue; it propagates to {@code create}.
     */
    @Transactional
    public OrderResponse createWithIdempotency(String idempotencyKey, CreateOrderRequest request, Long customerId) {
        Order order = persistNewOrder(request, customerId);
        idempotencyRecordRepository.saveAndFlush(IdempotencyRecord.builder()
                .idempotencyKey(idempotencyKey)
                .orderId(order.getId())
                .build());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request, Long customerId) {
        return OrderResponse.from(persistNewOrder(request, customerId));
    }

    /** Builds and persists a new order (shared by the plain and idempotent create paths). */
    private Order persistNewOrder(CreateOrderRequest request, Long customerId) {
        validateDates(request);

        Customer customer = customerService.findOrThrow(customerId);

        long rentalDays = ChronoUnit.DAYS.between(request.getEventDate(), request.getReturnDate());
        if (rentalDays < 1) rentalDays = 1;

        List<OrderItem> items = new ArrayList<>();
        BigDecimal totalPrice = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Kaba kaba = kabaService.findOrThrow(itemReq.getKabaId());

            if (!availabilityService.isAvailable(
                    kaba.getId(), request.getEventDate(), request.getReturnDate(), itemReq.getQuantity())) {
                throw new AvailabilityException(
                        "Kaba '" + kaba.getName() + "' does not have enough units available for the requested dates.");
            }

            BigDecimal itemTotal = kaba.getPricePerDay()
                    .multiply(BigDecimal.valueOf(rentalDays))
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalPrice = totalPrice.add(itemTotal);

            items.add(OrderItem.builder()
                    .kaba(kaba)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(kaba.getPricePerDay())
                    .build());
        }

        Order order = Order.builder()
                .customer(customer)
                .eventDate(request.getEventDate())
                .returnDate(request.getReturnDate())
                .totalPrice(totalPrice)
                .notes(request.getNotes())
                .build();

        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.getItems().addAll(items);

        return orderRepository.save(order);
    }

    public List<OrderResponse> listAll(OrderStatus status) {
        List<Order> orders = (status != null)
                ? orderRepository.findByStatus(status)
                : orderRepository.findAll();
        return orders.stream().map(OrderResponse::from).toList();
    }

    public OrderResponse getById(Long id) {
        return OrderResponse.from(findOrThrow(id));
    }

    public List<OrderResponse> getByCustomer(Long customerId) {
        customerService.findOrThrow(customerId);
        return orderRepository.findByCustomerId(customerId)
                .stream().map(OrderResponse::from).toList();
    }

    @Transactional
    public OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request) {
        Order order = findOrThrow(id);
        OrderStatus newStatus = request.getStatus();
        validateTransition(order.getStatus(), newStatus);

        // Re-validate availability when confirming: PENDING orders do not hold stock,
        // so two orders can both pass the create-time check. Confirming the first
        // takes a write lock on each Kaba and rechecks against other CONFIRMED/ACTIVE
        // orders, so the second confirm is rejected instead of overbooking.
        if (newStatus == OrderStatus.CONFIRMED) {
            for (OrderItem item : order.getItems()) {
                // Lock the Kaba row to serialize concurrent confirmations.
                kabaRepository.findByIdWithLock(item.getKaba().getId());
                boolean available = availabilityService.isAvailable(
                        item.getKaba().getId(),
                        order.getEventDate(),
                        order.getReturnDate(),
                        item.getQuantity(),
                        order.getId());
                if (!available) {
                    throw new AvailabilityException(
                            "Kaba '" + item.getKaba().getName() +
                            "' is no longer available for the selected dates");
                }
            }
        }

        order.setStatus(newStatus);
        return OrderResponse.from(orderRepository.save(order));
    }

    // --- customer self-service (/api/my/**) ---

    /**
     * Fetches an order the customer owns. If the order does not exist OR belongs to another
     * customer, a 404 is raised (deliberately not 403 — do not reveal that the id exists).
     */
    public OrderResponse getByIdForCustomer(Long orderId, Long customerId) {
        return OrderResponse.from(findOwnedOrThrow(orderId, customerId));
    }

    /**
     * Customer self-cancel. v1 allows cancelling PENDING orders only — CONFIRMED orders may
     * carry a partial payment and a cancellation policy, so they must go through admin.
     * (PENDING orders reserve no inventory, so nothing needs to be released.)
     */
    @Transactional
    public OrderResponse cancelForCustomer(Long orderId, Long customerId) {
        Order order = findOwnedOrThrow(orderId, customerId);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only pending orders can be cancelled online. Please contact us to cancel a confirmed order.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return OrderResponse.from(orderRepository.save(order));
    }

    private Order findOwnedOrThrow(Long orderId, Long customerId) {
        Order order = findOrThrow(orderId);
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }
        return order;
    }

    // --- helpers ---

    private Order findOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    private void validateDates(CreateOrderRequest request) {
        if (!request.getReturnDate().isAfter(request.getEventDate())) {
            throw new IllegalArgumentException("Return date must be after event date.");
        }
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING    -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED  -> next == OrderStatus.ACTIVE    || next == OrderStatus.CANCELLED;
            case ACTIVE     -> next == OrderStatus.COMPLETED;
            default         -> false;
        };
        if (!valid) {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + current + " → " + next);
        }
    }
}
