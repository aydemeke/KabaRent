package com.kabarent.controller;

import com.kabarent.dto.request.RecordPaymentRequest;
import com.kabarent.dto.response.PaymentBalanceResponse;
import com.kabarent.dto.response.PaymentResponse;
import com.kabarent.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> recordPayment(@Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.record(request));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsForOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getByOrder(orderId));
    }

    @GetMapping("/order/{orderId}/balance")
    public ResponseEntity<PaymentBalanceResponse> getOrderBalance(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getBalance(orderId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> listAllPayments() {
        return ResponseEntity.ok(paymentService.listAll());
    }
}
