package com.kabarent.validation;

import com.kabarent.exception.InvalidPhoneNumberException;
import com.kabarent.service.PhoneNumberService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;

/**
 * Backs {@link ValidPhone} by delegating to the single normalization point
 * ({@link PhoneNumberService#normalizeToE164(String)}). Spring injects the service into this
 * Spring-managed {@code ConstraintValidator}, so there is no duplicated parsing logic.
 */
@RequiredArgsConstructor
public class PhoneValidator implements ConstraintValidator<ValidPhone, String> {

    private final PhoneNumberService phoneNumberService;

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Defer emptiness to @NotBlank; only validate format when a value is present.
        if (value == null || value.isBlank()) {
            return true;
        }
        try {
            phoneNumberService.normalizeToE164(value);
            return true;
        } catch (InvalidPhoneNumberException e) {
            return false;
        }
    }
}
