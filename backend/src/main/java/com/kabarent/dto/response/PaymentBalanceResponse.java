package com.kabarent.dto.response;

import java.math.BigDecimal;

public record PaymentBalanceResponse(
        BigDecimal totalPrice,
        BigDecimal totalPaid,
        BigDecimal remainingBalance,
        boolean isFullyPaid
) {}
