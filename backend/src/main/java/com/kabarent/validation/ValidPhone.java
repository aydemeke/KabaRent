package com.kabarent.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Field-level constraint: the value must be a phone number that
 * {@link com.kabarent.service.PhoneNumberService#normalizeToE164(String)} accepts.
 *
 * <p>Null/blank values are considered valid here so emptiness reporting stays with
 * {@code @NotBlank}; combine the two when the field is also required.
 */
@Documented
@Constraint(validatedBy = PhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPhone {
    String message() default "Phone number is not valid";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
