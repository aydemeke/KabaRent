package com.kabarent.service;

import com.kabarent.dto.request.LoginRequest;
import com.kabarent.dto.request.RegisterRequest;
import com.kabarent.dto.response.AuthResponse;
import com.kabarent.exception.EmailAlreadyRegisteredException;
import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import com.kabarent.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @InjectMocks private AuthService authService;

    private RegisterRequest registerRequest() {
        RegisterRequest r = new RegisterRequest();
        r.setFullName("Sara Cohen");
        r.setPhone("050-1234567");
        r.setEmail("sara@x.com");
        r.setPassword("supersecret");
        return r;
    }

    @Test
    void register_newEmail_createsCustomerWithHashAndCustomerRole() {
        when(customerRepository.findByEmail("sara@x.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("supersecret")).thenReturn("HASH");
        when(jwtService.generateToken(any(Customer.class))).thenReturn("token-123");
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> {
            Customer c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        AuthResponse res = authService.register(registerRequest());

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(captor.capture());
        Customer saved = captor.getValue();
        assertThat(saved.getPasswordHash()).isEqualTo("HASH");
        assertThat(saved.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(res.getToken()).isEqualTo("token-123");
        assertThat(res.getCustomerId()).isEqualTo(10L);
    }

    @Test
    void register_existingGuest_upgradesSameRowInPlace() {
        Customer guest = Customer.builder()
                .id(7L).fullName("Old Name").phone("000").email("sara@x.com")
                .passwordHash(null) // guest — no password yet
                .build();
        when(customerRepository.findByEmail("sara@x.com")).thenReturn(Optional.of(guest));
        when(passwordEncoder.encode("supersecret")).thenReturn("HASH");
        when(jwtService.generateToken(any(Customer.class))).thenReturn("token-xyz");
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse res = authService.register(registerRequest());

        // Same row is reused (id 7) so the guest's existing orders auto-link to the account.
        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(7L);
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("HASH");
        assertThat(res.getCustomerId()).isEqualTo(7L);
    }

    @Test
    void register_alreadyRegistered_throwsConflict() {
        Customer existing = Customer.builder()
                .id(3L).fullName("Sara").phone("050").email("sara@x.com")
                .passwordHash("EXISTING_HASH")
                .build();
        when(customerRepository.findByEmail("sara@x.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> authService.register(registerRequest()))
                .isInstanceOf(EmailAlreadyRegisteredException.class);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void login_validCredentials_returnsToken() {
        LoginRequest req = new LoginRequest();
        req.setEmail("sara@x.com");
        req.setPassword("supersecret");
        Customer customer = Customer.builder().id(7L).email("sara@x.com").fullName("Sara").role(Role.CUSTOMER).build();
        when(authenticationManager.authenticate(any())).thenReturn(mock(Authentication.class));
        when(customerRepository.findByEmail("sara@x.com")).thenReturn(Optional.of(customer));
        when(jwtService.generateToken(customer)).thenReturn("token-login");

        AuthResponse res = authService.login(req);

        assertThat(res.getToken()).isEqualTo("token-login");
        assertThat(res.getCustomerId()).isEqualTo(7L);
    }

    @Test
    void login_badCredentials_propagates() {
        LoginRequest req = new LoginRequest();
        req.setEmail("sara@x.com");
        req.setPassword("wrong");
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
        verify(jwtService, never()).generateToken(any());
    }

    private static <T> T mock(Class<T> type) {
        return org.mockito.Mockito.mock(type);
    }
}
