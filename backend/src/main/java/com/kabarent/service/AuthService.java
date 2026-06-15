package com.kabarent.service;

import com.kabarent.dto.request.LoginRequest;
import com.kabarent.dto.request.RegisterRequest;
import com.kabarent.dto.response.AuthResponse;
import com.kabarent.exception.EmailAlreadyRegisteredException;
import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import com.kabarent.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a customer account. If the email belongs to an existing guest
     * (no password hash), the same row is upgraded in place — which automatically links
     * all of that guest's existing orders to the new account. If the email already has a
     * real account, a 409 is raised.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Customer customer = customerRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (customer != null && customer.getPasswordHash() != null) {
            throw new EmailAlreadyRegisteredException("An account with this email already exists");
        }

        if (customer == null) {
            customer = Customer.builder()
                    .fullName(request.getFullName())
                    .phone(request.getPhone())
                    .email(request.getEmail())
                    .build();
        } else {
            // Upgrade the existing guest row, refreshing contact details from the form.
            customer.setFullName(request.getFullName());
            customer.setPhone(request.getPhone());
        }
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setRole(Role.CUSTOMER);

        Customer saved = customerRepository.save(customer);
        return AuthResponse.of(jwtService.generateToken(saved), saved);
    }

    /** Authenticates credentials and returns a JWT. Throws on bad credentials (mapped to 401). */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        // Authentication succeeded — load the customer for the response/token.
        Customer customer = customerRepository.findByEmail(request.getEmail())
                .orElseThrow(); // unreachable: authentication already verified the account exists
        return AuthResponse.of(jwtService.generateToken(customer), customer);
    }
}
