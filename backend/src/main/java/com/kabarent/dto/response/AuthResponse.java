package com.kabarent.dto.response;

import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {

    private String token;
    private Long customerId;
    private String fullName;
    private String phone;
    private String email;
    private Role role;

    public static AuthResponse of(String token, Customer customer) {
        return AuthResponse.builder()
                .token(token)
                .customerId(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .role(customer.getRole())
                .build();
    }
}
