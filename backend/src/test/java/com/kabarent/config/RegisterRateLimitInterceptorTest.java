package com.kabarent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kabarent.controller.AuthController;
import com.kabarent.dto.response.AuthResponse;
import com.kabarent.service.AuthService;
import com.kabarent.service.PhoneNumberService;
import com.kabarent.validation.PhoneValidator;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.Duration;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Drives the registration {@link RateLimitInterceptor} through a standalone MockMvc (AuthService
 * mocked, no DB). Each test builds its OWN interceptor instance via {@link #mockMvcWithLimit}, so
 * the in-memory bucket store cannot leak across test methods — the isolation a shared singleton
 * store would break. Mirrors {@link OrderRateLimitInterceptorTest}.
 */
class RegisterRateLimitInterceptorTest {

    private static final String VALID_BODY =
            "{\"fullName\":\"Sara\",\"phone\":\"0525551234\",\"password\":\"password123\"}";

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        when(authService.register(any()))
                .thenReturn(AuthResponse.builder().customerId(1L).token("t").build());
    }

    /**
     * A validator that can construct the Spring-injected {@link PhoneValidator} (it has no no-arg
     * constructor) so {@code @ValidPhone} on RegisterRequest resolves under standalone MockMvc;
     * other constraint validators fall back to default no-arg instantiation. Needed because the
     * under-limit request must clear {@code @Valid} to reach 201.
     */
    private static LocalValidatorFactoryBean validator() {
        LocalValidatorFactoryBean bean = new LocalValidatorFactoryBean();
        bean.setConstraintValidatorFactory(new ConstraintValidatorFactory() {
            @Override
            public <T extends ConstraintValidator<?, ?>> T getInstance(Class<T> key) {
                if (PhoneValidator.class.equals(key)) {
                    return key.cast(new PhoneValidator(new PhoneNumberService()));
                }
                try {
                    return key.getDeclaredConstructor().newInstance();
                } catch (ReflectiveOperationException e) {
                    throw new IllegalStateException("Cannot instantiate validator " + key, e);
                }
            }

            @Override
            public void releaseInstance(ConstraintValidator<?, ?> instance) {
            }
        });
        bean.afterPropertiesSet();
        return bean;
    }

    /** Fresh interceptor (and thus a fresh bucket store) per call → deterministic, isolated. */
    private MockMvc mockMvcWithLimit(int perHour, int perDay) {
        RateLimitInterceptor interceptor = new RateLimitInterceptor(new ObjectMapper(), true, List.of(
                RateLimitInterceptor.limit(perHour, Duration.ofHours(1)),
                RateLimitInterceptor.limit(perDay, Duration.ofDays(1))));
        return MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setValidator(validator())
                .addInterceptors(interceptor)
                .build();
    }

    @Test
    void registerUnderLimit_succeeds() throws Exception {
        MockMvc mockMvc = mockMvcWithLimit(3, 10);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void registerOverPerHourLimit_returns429WithJsonAndRetryAfter() throws Exception {
        MockMvc mockMvc = mockMvcWithLimit(1, 1000); // 1/hour so the second register is throttled
        // First request consumes the only per-hour token.
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated());
        // Second request (same client key) is rejected before reaching the controller.
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").isNotEmpty());
    }
}
