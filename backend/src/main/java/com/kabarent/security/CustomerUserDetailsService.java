package com.kabarent.security;

import com.kabarent.exception.InvalidPhoneNumberException;
import com.kabarent.model.Customer;
import com.kabarent.repository.CustomerRepository;
import com.kabarent.service.PhoneNumberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Loads a customer for password authentication (login) by resolving the supplied identifier:
 * an identifier containing '@' is treated as an email (serves the admin account); otherwise it
 * is normalized to E.164 and looked up by phone (the customer identity key). Guest customers
 * (no {@code passwordHash}) are treated as having no account and cannot log in.
 */
@Service
@RequiredArgsConstructor
public class CustomerUserDetailsService implements UserDetailsService {

    private final CustomerRepository customerRepository;
    private final PhoneNumberService phoneNumberService;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        Customer customer = resolve(identifier)
                .filter(c -> c.getPasswordHash() != null)
                .orElseThrow(() -> new UsernameNotFoundException("No account for identifier: " + identifier));
        return CustomerPrincipal.from(customer);
    }

    private Optional<Customer> resolve(String identifier) {
        if (identifier != null && identifier.contains("@")) {
            return customerRepository.findByEmail(identifier);
        }
        // Phone identifier: normalize through the single point. An unparseable phone is simply
        // "no such account" (→ bad credentials), not a 400, during the login flow.
        try {
            String phone = phoneNumberService.normalizeToE164(identifier);
            return customerRepository.findByPhone(phone);
        } catch (InvalidPhoneNumberException e) {
            return Optional.empty();
        }
    }
}
