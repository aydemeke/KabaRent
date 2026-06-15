package com.kabarent.controller;

import com.kabarent.dto.response.OrderResponse;
import com.kabarent.dto.response.PaymentBalanceResponse;
import com.kabarent.security.CustomerPrincipal;
import com.kabarent.service.OrderService;
import com.kabarent.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Customer self-service endpoints. The customer id is ALWAYS taken from the authenticated
 * principal — never from a path/param/body — and every access is ownership-checked.
 */
@RestController
@RequestMapping("/api/my")
@RequiredArgsConstructor
public class MyOrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> myOrders(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ResponseEntity.ok(orderService.getByCustomer(principal.getId()));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponse> myOrder(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getByIdForCustomer(id, principal.getId()));
    }

    @GetMapping("/orders/{id}/balance")
    public ResponseEntity<PaymentBalanceResponse> myOrderBalance(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable Long id) {
        // Ownership check first (throws 404 if the order is not the caller's), then balance.
        orderService.getByIdForCustomer(id, principal.getId());
        return ResponseEntity.ok(paymentService.getBalance(id));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelMyOrder(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelForCustomer(id, principal.getId()));
    }
}
