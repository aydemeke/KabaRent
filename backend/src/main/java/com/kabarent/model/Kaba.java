package com.kabarent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "kabas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kaba {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String size;

    @Column(name = "price_per_day", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerDay;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
