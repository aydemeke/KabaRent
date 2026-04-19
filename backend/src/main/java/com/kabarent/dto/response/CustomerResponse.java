package com.kabarent.dto.response;

import com.kabarent.model.Customer;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustomerResponse {

    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String notes;
    private LocalDateTime createdAt;

    public static CustomerResponse from(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .notes(customer.getNotes())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
