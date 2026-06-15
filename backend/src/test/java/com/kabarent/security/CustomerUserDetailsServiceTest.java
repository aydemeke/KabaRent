package com.kabarent.security;

import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerUserDetailsServiceTest {

    @Mock private CustomerRepository customerRepository;
    @InjectMocks private CustomerUserDetailsService service;

    @Test
    void loadByUsername_accountWithPassword_returnsPrincipal() {
        Customer customer = Customer.builder()
                .id(1L).email("a@x.com").fullName("A").passwordHash("HASH").role(Role.CUSTOMER).build();
        when(customerRepository.findByEmail("a@x.com")).thenReturn(Optional.of(customer));

        UserDetails details = service.loadUserByUsername("a@x.com");

        assertThat(details.getUsername()).isEqualTo("a@x.com");
        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_CUSTOMER");
    }

    @Test
    void loadByUsername_guestWithNullPassword_cannotLogIn() {
        // A guest customer (created via order checkout) remains a valid order customer
        // but has no password, so login is rejected as if no account exists.
        Customer guest = Customer.builder()
                .id(2L).email("guest@x.com").fullName("Guest").passwordHash(null).build();
        when(customerRepository.findByEmail("guest@x.com")).thenReturn(Optional.of(guest));

        assertThatThrownBy(() -> service.loadUserByUsername("guest@x.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadByUsername_unknownEmail_throws() {
        when(customerRepository.findByEmail("nope@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("nope@x.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
