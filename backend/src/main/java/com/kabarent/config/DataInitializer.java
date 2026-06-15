package com.kabarent.config;

import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the single admin account on startup from config/env (no plaintext password in code).
 *
 * <p>PostgreSQL is the persistent database; ordinary inventory/customer data is still entered
 * manually via the admin dashboard. This runner ONLY ensures an admin user exists.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("ADMIN_PASSWORD is not set — skipping admin seeding. " +
                    "Set the ADMIN_PASSWORD env var to create the admin account ({}).", adminEmail);
            return;
        }
        if (customerRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Admin account already exists ({}); not reseeding.", adminEmail);
            return;
        }
        Customer admin = Customer.builder()
                .fullName("Administrator")
                .phone("-")
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();
        customerRepository.save(admin);
        log.info("Seeded admin account: {}", adminEmail);
    }
}
