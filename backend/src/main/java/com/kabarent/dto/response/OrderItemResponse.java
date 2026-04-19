package com.kabarent.dto.response;

import com.kabarent.model.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponse {

    private Long id;
    private Long kabaId;
    private String kabaName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    public static OrderItemResponse from(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .kabaId(item.getKaba().getId())
                .kabaName(item.getKaba().getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
}
