package com.kabarent.service;

import com.kabarent.dto.request.RecordPaymentRequest;
import com.kabarent.dto.response.PaymentBalanceResponse;
import com.kabarent.dto.response.PaymentResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Order;
import com.kabarent.model.Payment;
import com.kabarent.model.enums.PaymentStatus;
import com.kabarent.repository.OrderRepository;
import com.kabarent.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public PaymentResponse record(RecordPaymentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order not found with id: " + request.getOrderId()));

        BigDecimal totalPaid = paymentRepository.sumAmountByOrderIdAndStatus(
                order.getId(), PaymentStatus.COMPLETED);
        BigDecimal remaining = order.getTotalPrice().subtract(totalPaid);

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("This order is already fully paid");
        }
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new IllegalArgumentException(
                    "Payment amount exceeds remaining balance of " + remaining);
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(request.getAmount())
                .method(request.getMethod())
                .status(PaymentStatus.COMPLETED)
                .paidAt(LocalDateTime.now())
                .build();

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    public PaymentBalanceResponse getBalance(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Order not found with id: " + orderId));

        BigDecimal totalPaid = paymentRepository.sumAmountByOrderIdAndStatus(
                orderId, PaymentStatus.COMPLETED);
        BigDecimal remaining = order.getTotalPrice().subtract(totalPaid);
        boolean fullyPaid = remaining.compareTo(BigDecimal.ZERO) <= 0;

        return new PaymentBalanceResponse(order.getTotalPrice(), totalPaid, remaining, fullyPaid);
    }

    public List<PaymentResponse> getByOrder(Long orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }
        return paymentRepository.findByOrderId(orderId)
                .stream().map(PaymentResponse::from).toList();
    }

    public List<PaymentResponse> listAll() {
        return paymentRepository.findAll()
                .stream().map(PaymentResponse::from).toList();
    }
}
