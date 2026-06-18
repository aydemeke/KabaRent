package com.kabarent.service;

import com.kabarent.dto.request.CustomerRequest;
import com.kabarent.exception.InvalidPhoneNumberException;
import com.kabarent.model.Customer;
import com.kabarent.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * CustomerService find-or-create now keyed on the NORMALIZED phone, with email optional.
 * Uses a real {@link PhoneNumberService} so normalization is exercised end-to-end.
 */
@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    private static final String E164 = "+972525551234";

    @Mock private CustomerRepository customerRepository;
    private final PhoneNumberService phoneNumberService = new PhoneNumberService();

    private CustomerService service() {
        return new CustomerService(customerRepository, phoneNumberService);
    }

    private CustomerRequest request(String phone, String email) {
        CustomerRequest r = new CustomerRequest();
        r.setFullName("Sara");
        r.setPhone(phone);
        r.setEmail(email);
        return r;
    }

    @Test
    void findOrCreateByPhone_noEmail_createsRowWithNullEmailAndNormalizedPhone() {
        when(customerRepository.findByPhone(E164)).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        Customer created = service().findOrCreateByPhone(request("052-5551234", null));

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isEqualTo(E164);  // normalized before insert
        assertThat(captor.getValue().getEmail()).isNull();         // email optional
        assertThat(created.getPhone()).isEqualTo(E164);
    }

    @Test
    void findOrCreateByPhone_blankEmail_storedAsNull() {
        when(customerRepository.findByPhone(E164)).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        service().findOrCreateByPhone(request("0525551234", "   "));

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isNull();
    }

    @Test
    void findOrCreateByPhone_existingPhone_returnsExistingWithoutInsert() {
        Customer existing = Customer.builder().id(9L).phone(E164).fullName("Sara").build();
        // A different raw format must resolve to the same stored row.
        when(customerRepository.findByPhone(E164)).thenReturn(Optional.of(existing));

        Customer found = service().findOrCreateByPhone(request("+972-52-5551234", "x@y.com"));

        assertThat(found.getId()).isEqualTo(9L);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void findOrCreateByPhone_invalidPhone_throws() {
        assertThatThrownBy(() -> service().findOrCreateByPhone(request("not-a-phone", null)))
                .isInstanceOf(InvalidPhoneNumberException.class);
        verify(customerRepository, never()).save(any());
    }
}
