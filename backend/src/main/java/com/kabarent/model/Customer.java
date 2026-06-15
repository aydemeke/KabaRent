package com.kabarent.model;

import com.kabarent.model.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * BCrypt hash. Nullable: guest customers (created via order checkout) have no
     * password and cannot log in, but remain valid order customers. Set when a guest
     * registers, upgrading the same row to a real account.
     */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Role role = Role.CUSTOMER;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
