package com.kabarent.security;

import com.kabarent.exception.InvalidPhoneNumberException;
import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import com.kabarent.service.PhoneNumberService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerUserDetailsServiceTest {

    private static final String RAW_PHONE = "0525551234";
    private static final String E164 = "+972525551234";

    @Mock private CustomerRepository customerRepository;
    @Mock private PhoneNumberService phoneNumberService;
    @InjectMocks private CustomerUserDetailsService service;

    @Test
    void loadByUsername_emailIdentifier_resolvesByEmail_servesAdmin() {
        Customer admin = Customer.builder()
                .id(1L).email("admin@x.com").fullName("Admin").passwordHash("HASH").role(Role.ADMIN).build();
        when(customerRepository.findByEmail("admin@x.com")).thenReturn(Optional.of(admin));

        UserDetails details = service.loadUserByUsername("admin@x.com");

        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
        // Email path must not touch phone normalization.
        verifyNoInteractions(phoneNumberService);
        verify(customerRepository, never()).findByPhone(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void loadByUsername_phoneIdentifier_normalizesAndResolvesByPhone() {
        Customer customer = Customer.builder()
                .id(2L).phone(E164).fullName("Sara").passwordHash("HASH").role(Role.CUSTOMER).build();
        when(phoneNumberService.normalizeToE164(RAW_PHONE)).thenReturn(E164);
        when(customerRepository.findByPhone(E164)).thenReturn(Optional.of(customer));

        UserDetails details = service.loadUserByUsername(RAW_PHONE);

        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_CUSTOMER");
    }

    @Test
    void loadByUsername_guestWithNullPassword_cannotLogIn() {
        // A guest customer (created via order checkout) remains a valid order customer
        // but has no password, so login is rejected as if no account exists.
        Customer guest = Customer.builder()
                .id(3L).phone(E164).fullName("Guest").passwordHash(null).build();
        when(phoneNumberService.normalizeToE164(RAW_PHONE)).thenReturn(E164);
        when(customerRepository.findByPhone(E164)).thenReturn(Optional.of(guest));

        assertThatThrownBy(() -> service.loadUserByUsername(RAW_PHONE))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadByUsername_unknownPhone_throws() {
        when(phoneNumberService.normalizeToE164(RAW_PHONE)).thenReturn(E164);
        when(customerRepository.findByPhone(E164)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername(RAW_PHONE))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadByUsername_invalidPhone_throwsUsernameNotFound() {
        // An unparseable phone at login is "no such account" (→ bad credentials), not a 400.
        when(phoneNumberService.normalizeToE164("garbage")).thenThrow(new InvalidPhoneNumberException("bad"));

        assertThatThrownBy(() -> service.loadUserByUsername("garbage"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
