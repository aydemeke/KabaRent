package com.kabarent.service;

import com.kabarent.dto.request.RecordPaymentRequest;
import com.kabarent.dto.response.PaymentBalanceResponse;
import com.kabarent.dto.response.PaymentResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Order;
import com.kabarent.model.Payment;
import com.kabarent.model.enums.PaymentMethod;
import com.kabarent.model.enums.PaymentStatus;
import com.kabarent.repository.OrderRepository;
import com.kabarent.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Milestone 1 — PaymentService unit tests (P1–P8): split-payment capping, fully-paid rejection,
 * and balance computation. {@code sumAmountByOrderIdAndStatus} uses COALESCE(...,0) so it never
 * returns null.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderRepository orderRepository;
    @InjectMocks private PaymentService paymentService;

    private Order order(long id, String total) {
        return Order.builder().id(id).totalPrice(new BigDecimal(total)).build();
    }

    private RecordPaymentRequest request(long orderId, String amount, PaymentMethod method) {
        RecordPaymentRequest req = new RecordPaymentRequest();
        req.setOrderId(orderId);
        req.setAmount(new BigDecimal(amount));
        req.setMethod(method);
        return req;
    }

    // P1
    @Test
    void record_partialPayment_savesCompletedWithPaidAt() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(1L, "1000")));
        when(paymentRepository.sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(99L);
            return p;
        });

        PaymentResponse res = paymentService.record(request(1L, "300", PaymentMethod.CASH));

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();

        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(saved.getPaidAt()).isNotNull();
        assertThat(saved.getAmount()).isEqualByComparingTo("300");
        assertThat(saved.getMethod()).isEqualTo(PaymentMethod.CASH);
        assertThat(saved.getOrder().getId()).isEqualTo(1L);
        assertThat(res.getAmount()).isEqualByComparingTo("300");
        assertThat(res.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
    }

    // P2
    @Test
    void record_amountExceedsRemaining_throwsIllegalArgument() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(1L, "1000")));
        when(paymentRepository.sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED))
                .thenReturn(new BigDecimal("800")); // remaining = 200

        assertThatThrownBy(() -> paymentService.record(request(1L, "300", PaymentMethod.CASH)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(paymentRepository, never()).save(any());
    }

    // P3
    @Test
    void record_orderAlreadyFullyPaid_throwsIllegalArgument() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(1L, "1000")));
        when(paymentRepository.sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED))
                .thenReturn(new BigDecimal("1000")); // remaining = 0

        assertThatThrownBy(() -> paymentService.record(request(1L, "50", PaymentMethod.CASH)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fully paid");
        verify(paymentRepository, never()).save(any());
    }

    // P4
    @Test
    void record_exactRemaining_succeeds() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(1L, "1000")));
        when(paymentRepository.sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED))
                .thenReturn(new BigDecimal("700")); // remaining = 300
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        paymentService.record(request(1L, "300", PaymentMethod.BANK_TRANSFER));

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo("300");
    }

    // P5
    @Test
    void record_orderNotFound_throwsResourceNotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.record(request(99L, "100", PaymentMethod.CASH)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(paymentRepository, never()).save(any());
    }

    // P6
    @Test
    void getBalance_computesFields_onlyCompletedCounted() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(1L, "1000")));
        when(paymentRepository.sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED))
                .thenReturn(new BigDecimal("400"));

        PaymentBalanceResponse res = paymentService.getBalance(1L);

        assertThat(res.totalPrice()).isEqualByComparingTo("1000");
        assertThat(res.totalPaid()).isEqualByComparingTo("400");
        assertThat(res.remainingBalance()).isEqualByComparingTo("600");
        assertThat(res.isFullyPaid()).isFalse();
        verify(paymentRepository).sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED);
    }

    // P7
    @Test
    void getBalance_fullyPaid_isFullyPaidTrue() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order(1L, "1000")));
        when(paymentRepository.sumAmountByOrderIdAndStatus(1L, PaymentStatus.COMPLETED))
                .thenReturn(new BigDecimal("1000"));

        PaymentBalanceResponse res = paymentService.getBalance(1L);

        assertThat(res.remainingBalance()).isEqualByComparingTo("0");
        assertThat(res.isFullyPaid()).isTrue();
    }

    // P8
    @Test
    void getBalance_orderNotFound_throwsResourceNotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getBalance(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
