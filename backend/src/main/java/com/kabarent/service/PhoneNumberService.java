package com.kabarent.service;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberFormat;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import com.kabarent.exception.InvalidPhoneNumberException;
import org.springframework.stereotype.Service;

/**
 * The SINGLE point of truth for phone-number normalization. Every write (registration,
 * find-or-create) and every lookup (login, find-by-phone) must route raw phone strings
 * through {@link #normalizeToE164(String)} so the stored value and the lookup key always
 * use the identical canonical form. Do not parse/normalize phone numbers anywhere else.
 */
@Service
public class PhoneNumberService {

    /** Default region for numbers entered without a country code (e.g. "0501234567"). */
    private static final String DEFAULT_REGION = "IL";

    private final PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();

    /**
     * Parses {@code raw} (assuming the Israeli region when no country code is present),
     * validates it, and returns the canonical E.164 string (e.g. {@code +972501234567}).
     *
     * @throws InvalidPhoneNumberException if {@code raw} is null/blank, cannot be parsed,
     *                                     or is not a valid phone number.
     */
    public String normalizeToE164(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidPhoneNumberException("Phone number is required");
        }
        PhoneNumber parsed;
        try {
            parsed = phoneUtil.parse(raw, DEFAULT_REGION);
        } catch (NumberParseException e) {
            throw new InvalidPhoneNumberException("Phone number is not valid: " + raw);
        }
        if (!phoneUtil.isValidNumber(parsed)) {
            throw new InvalidPhoneNumberException("Phone number is not valid: " + raw);
        }
        return phoneUtil.format(parsed, PhoneNumberFormat.E164);
    }
}
