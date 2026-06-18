package com.kabarent.service;

import com.kabarent.dto.request.LoginRequest;
import com.kabarent.dto.request.RegisterRequest;
import com.kabarent.dto.response.AuthResponse;
import com.kabarent.exception.PhoneAlreadyRegisteredException;
import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import com.kabarent.security.CustomerPrincipal;
import com.kabarent.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
    private final PhoneNumberService phoneNumberService;

    /**
     * Registers a customer account, keyed on the NORMALIZED phone number. If the phone belongs
     * to an existing guest (no password hash), the same row is upgraded in place — which
     * automatically links all of that guest's existing orders to the new account. If the phone
     * already has a real account, a 409 is raised. Email is optional.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String phone = phoneNumberService.normalizeToE164(request.getPhone());
        Customer customer = customerRepository.findByPhone(phone)
                .orElse(null);

        if (customer != null && customer.getPasswordHash() != null) {
            throw new PhoneAlreadyRegisteredException("An account with this phone number already exists");
        }

        if (customer == null) {
            customer = Customer.builder()
                    .fullName(request.getFullName())
                    .phone(phone)
                    .email(blankToNull(request.getEmail()))
                    .build();
        } else {
            // Upgrade the existing guest row, refreshing contact details from the form.
            customer.setFullName(request.getFullName());
            customer.setEmail(blankToNull(request.getEmail()));
        }
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setRole(Role.CUSTOMER);

        Customer saved = customerRepository.save(customer);
        return AuthResponse.of(jwtService.generateToken(saved), saved);
    }

    /**
     * Authenticates credentials and returns a JWT. The {@code identifier} may be an email
     * (admin) or a phone number (customer) — identifier sniffing happens in
     * {@link com.kabarent.security.CustomerUserDetailsService}. Throws on bad credentials
     * (mapped to 401).
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword()));

        // Authentication succeeded — load the resolved customer (by id) for the response/token,
        // so we don't have to re-sniff the identifier here.
        CustomerPrincipal principal = (CustomerPrincipal) authentication.getPrincipal();
        Customer customer = customerRepository.findById(principal.getId())
                .orElseThrow(); // unreachable: authentication already verified the account exists
        return AuthResponse.of(jwtService.generateToken(customer), customer);
    }

    /** Treat an absent/blank optional email as NULL so it never collides under UNIQUE(email). */
    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
