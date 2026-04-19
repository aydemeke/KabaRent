package com.kabarent.dto.response;

import com.kabarent.model.Kaba;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class KabaResponse {

    private Long id;
    private String name;
    private String description;
    private String category;
    private String size;
    private BigDecimal pricePerDay;
    private Integer quantity;
    private String imageUrl;
    private Boolean active;

    public static KabaResponse from(Kaba kaba) {
        return KabaResponse.builder()
                .id(kaba.getId())
                .name(kaba.getName())
                .description(kaba.getDescription())
                .category(kaba.getCategory())
                .size(kaba.getSize())
                .pricePerDay(kaba.getPricePerDay())
                .quantity(kaba.getQuantity())
                .imageUrl(kaba.getImageUrl())
                .active(kaba.getActive())
                .build();
    }
}
