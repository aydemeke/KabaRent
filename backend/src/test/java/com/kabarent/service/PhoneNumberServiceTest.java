package com.kabarent.service;

import com.kabarent.exception.InvalidPhoneNumberException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhoneNumberServiceTest {

    private final PhoneNumberService service = new PhoneNumberService();

    @ParameterizedTest(name = "\"{0}\" -> +972525551234")
    @ValueSource(strings = {"052-5551234", "0525551234", "+972525551234", "972-52-5551234"})
    void normalize_variousFormats_mapToSameE164(String raw) {
        assertThat(service.normalizeToE164(raw)).isEqualTo("+972525551234");
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc", "12", "+1 555 not a number", "000"})
    void normalize_invalid_throws(String raw) {
        assertThatThrownBy(() -> service.normalizeToE164(raw))
                .isInstanceOf(InvalidPhoneNumberException.class);
    }

    @Test
    void normalize_null_throws() {
        assertThatThrownBy(() -> service.normalizeToE164(null))
                .isInstanceOf(InvalidPhoneNumberException.class);
    }

    @Test
    void normalize_blank_throws() {
        assertThatThrownBy(() -> service.normalizeToE164("   "))
                .isInstanceOf(InvalidPhoneNumberException.class);
    }
}
