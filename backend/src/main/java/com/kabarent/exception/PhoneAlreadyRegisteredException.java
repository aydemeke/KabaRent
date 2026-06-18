package com.kabarent.exception;

/**
 * Thrown when registering a phone number that already has a real account (non-null password hash).
 * Mapped to HTTP 409 by {@link GlobalExceptionHandler}.
 */
public class PhoneAlreadyRegisteredException extends RuntimeException {

    public PhoneAlreadyRegisteredException(String message) {
        super(message);
    }
}
