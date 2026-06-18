package com.kabarent.exception;

/**
 * Thrown when a phone number is null/blank, unparseable, or not a valid number for its region.
 * Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class InvalidPhoneNumberException extends RuntimeException {

    public InvalidPhoneNumberException(String message) {
        super(message);
    }
}
