package com.kabarent.service;

import com.kabarent.dto.request.CustomerRequest;
import com.kabarent.dto.response.CustomerResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Customer;
import com.kabarent.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PhoneNumberService phoneNumberService;

    public List<CustomerResponse> listAll() {
        return customerRepository.findAll()
                .stream()
                .map(CustomerResponse::from)
                .toList();
    }

    public CustomerResponse getById(Long id) {
        return CustomerResponse.from(findOrThrow(id));
    }

    public CustomerResponse create(CustomerRequest request) {
        return CustomerResponse.from(findOrCreateByPhone(request));
    }

    /**
     * Returns the existing customer with the given (normalized) phone, or creates a new one
     * if none exists. Phone is the identity key, so the raw phone is normalized to E.164 via
     * {@link PhoneNumberService} before both the lookup and the insert — so re-entering an
     * existing customer (e.g. admin re-adding the same phone) reuses the row instead of hitting
     * the UNIQUE(phone) constraint. Backs admin customer creation ({@link #create}); email is optional.
     */
    public Customer findOrCreateByPhone(CustomerRequest request) {
        String phone = phoneNumberService.normalizeToE164(request.getPhone());
        return customerRepository.findByPhone(phone)
                .orElseGet(() -> customerRepository.save(
                        Customer.builder()
                                .fullName(request.getFullName())
                                .phone(phone)
                                .email(blankToNull(request.getEmail()))
                                .notes(request.getNotes())
                                .build()
                ));
    }

    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findOrThrow(id);
        customer.setFullName(request.getFullName());
        customer.setPhone(phoneNumberService.normalizeToE164(request.getPhone()));
        customer.setEmail(blankToNull(request.getEmail()));
        customer.setNotes(request.getNotes());
        return CustomerResponse.from(customerRepository.save(customer));
    }

    /** Treat an absent/blank optional email as NULL so it never collides under UNIQUE(email). */
    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    public Customer findOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }
}
