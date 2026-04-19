package com.kabarent.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private String notes;
}
