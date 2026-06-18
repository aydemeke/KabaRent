package com.kabarent.dto.request;

import com.kabarent.validation.ValidPhone;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone is required")
    @ValidPhone
    private String phone;

    // Email is optional now that phone is the identity key; validated for format only when present.
    @Email(message = "Email must be valid")
    private String email;

    private String notes;
}
