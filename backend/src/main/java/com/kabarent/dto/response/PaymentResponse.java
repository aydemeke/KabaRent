package com.kabarent.dto.response;

import com.kabarent.model.Payment;
import com.kabarent.model.enums.PaymentMethod;
import com.kabarent.model.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {

    private Long id;
    private Long orderId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private LocalDateTime paidAt;

    public static PaymentResponse from(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
