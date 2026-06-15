package com.kabarent.exception;

/**
 * Thrown when registering an email that already has a real account (non-null password hash).
 * Mapped to HTTP 409 by {@link GlobalExceptionHandler}.
 */
public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String message) {
        super(message);
    }
}
