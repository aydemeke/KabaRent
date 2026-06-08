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
        return CustomerResponse.from(findOrCreateByEmail(request));
    }

    /**
     * Returns the existing customer with the given email, or creates a new one
     * if none exists. Prevents the UNIQUE(email) constraint violation that occurs
     * when a returning customer places another order.
     */
    public Customer findOrCreateByEmail(CustomerRequest request) {
        return customerRepository.findByEmail(request.getEmail())
                .orElseGet(() -> customerRepository.save(
                        Customer.builder()
                                .fullName(request.getFullName())
                                .phone(request.getPhone())
                                .email(request.getEmail())
                                .notes(request.getNotes())
                                .build()
                ));
    }

    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = findOrThrow(id);
        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setNotes(request.getNotes());
        return CustomerResponse.from(customerRepository.save(customer));
    }

    public Customer findOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }
}
