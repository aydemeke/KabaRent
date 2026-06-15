package com.kabarent.model.enums;

/**
 * Authorization role for a {@link com.kabarent.model.Customer}.
 * Guest customers (no password) default to CUSTOMER.
 */
public enum Role {
    CUSTOMER,
    ADMIN
}
