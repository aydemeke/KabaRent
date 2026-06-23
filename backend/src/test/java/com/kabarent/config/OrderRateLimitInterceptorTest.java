package com.kabarent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kabarent.controller.OrderController;
import com.kabarent.dto.response.OrderResponse;
import com.kabarent.model.enums.Role;
import com.kabarent.security.CustomerPrincipal;
import com.kabarent.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Drives {@link OrderRateLimitInterceptor} through a standalone MockMvc (OrderService mocked, no DB).
 * Each test builds its OWN interceptor instance via {@link #mockMvcWithLimit}, so the in-memory bucket
 * store cannot leak across test methods — the isolation that a shared singleton store would break.
 */
class OrderRateLimitInterceptorTest {

    private static final String VALID_BODY = String.format(
            "{\"eventDate\":\"%s\",\"returnDate\":\"%s\","
                    + "\"items\":[{\"kabaId\":1,\"quantity\":1}]}",
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(2));

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = mock(OrderService.class);
        when(orderService.create(any(), any(), any())).thenReturn(OrderResponse.builder().id(1L).build());
    }

    /**
     * Resolves the controller's {@code @AuthenticationPrincipal CustomerPrincipal} in standalone
     * MockMvc, which has no Spring Security argument resolver — without this the principal is null
     * and {@code principal.getId()} would NPE before the rate limiter is even exercised.
     */
    private static final HandlerMethodArgumentResolver PRINCIPAL_RESOLVER = new HandlerMethodArgumentResolver() {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return CustomerPrincipal.class.equals(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            return new CustomerPrincipal(1L, "c@x.com", null, Role.CUSTOMER);
        }
    };

    /** Fresh interceptor (and thus a fresh bucket store) per call → deterministic, isolated. */
    private MockMvc mockMvcWithLimit(int perMinute, int perHour) {
        OrderRateLimitInterceptor interceptor =
                new OrderRateLimitInterceptor(new ObjectMapper(), true, perMinute, perHour);
        return MockMvcBuilders.standaloneSetup(new OrderController(orderService))
                .setCustomArgumentResolvers(PRINCIPAL_RESOLVER)
                .addInterceptors(interceptor)
                .build();
    }

    @Test
    void requestUnderLimit_succeeds() throws Exception {
        MockMvc mockMvc = mockMvcWithLimit(5, 20);
        mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void requestOverPerMinuteLimit_returns429WithJsonAndRetryAfter() throws Exception {
        MockMvc mockMvc = mockMvcWithLimit(1, 1000); // 1/min so the second POST is throttled
        // First request consumes the only per-minute token.
        mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated());
        // Second request (same client key) is rejected before reaching the controller.
        mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").isNotEmpty());
    }
}
