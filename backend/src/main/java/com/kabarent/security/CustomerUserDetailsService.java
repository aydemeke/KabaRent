package com.kabarent.security;

import com.kabarent.model.Customer;
import com.kabarent.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads a customer by email for password authentication (login). Guest customers
 * (no {@code passwordHash}) are treated as having no account and cannot log in.
 */
@Service
@RequiredArgsConstructor
public class CustomerUserDetailsService implements UserDetailsService {

    private final CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Customer customer = customerRepository.findByEmail(email)
                .filter(c -> c.getPasswordHash() != null)
                .orElseThrow(() -> new UsernameNotFoundException("No account for email: " + email));
        return CustomerPrincipal.from(customer);
    }
}
