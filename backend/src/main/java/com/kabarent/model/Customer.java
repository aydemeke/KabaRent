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

    /*
     * Identity-key migration (phone-based auth). The annotations below are the source of truth
     * for a FRESH database only:
     *   - phone: now the login/lookup identity, hence unique = true. Stored in canonical E.164
     *     form (see PhoneNumberService) so writes and lookups always match.
     *   - email: now OPTIONAL (nullable = true). unique = true is kept, which in Postgres means
     *     "unique when present" (multiple NULLs are allowed).
     * On the EXISTING Neon database the phone UNIQUE constraint and the email DROP NOT NULL are
     * applied MANUALLY in Phase B, AFTER the dry-run dedup. This code must NOT be deployed to
     * production until that manual migration has run.
     */
    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(nullable = true, unique = true, length = 150)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * BCrypt hash. Nullable: password-less customers (e.g. created by admin via
     * POST /api/customers) cannot log in but remain valid order customers. Set when
     * someone registers with that phone, upgrading the same row to a real account in
     * place (which links any existing orders on that row to the new account).
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
