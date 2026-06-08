package com.kabarent.service;

import com.kabarent.dto.request.CreateOrderRequest;
import com.kabarent.dto.request.OrderItemRequest;
import com.kabarent.dto.request.UpdateOrderStatusRequest;
import com.kabarent.dto.response.OrderResponse;
import com.kabarent.exception.AvailabilityException;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.*;
import com.kabarent.model.enums.OrderStatus;
import com.kabarent.repository.KabaRepository;
import com.kabarent.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final KabaService kabaService;
    private final AvailabilityService availabilityService;
    private final KabaRepository kabaRepository;

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        validateDates(request);

        Customer customer = customerService.findOrThrow(request.getCustomerId());

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

        return OrderResponse.from(orderRepository.save(order));
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
