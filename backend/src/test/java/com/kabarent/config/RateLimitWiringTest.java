package com.kabarent.config;

import com.kabarent.controller.AuthController;
import com.kabarent.controller.OrderController;
import com.kabarent.dto.response.AuthResponse;
import com.kabarent.dto.response.OrderResponse;
import com.kabarent.model.enums.Role;
import com.kabarent.security.CustomerPrincipal;
import com.kabarent.security.JwtAuthenticationFilter;
import com.kabarent.security.JwtService;
import com.kabarent.service.AuthService;
import com.kabarent.service.OrderService;
import com.kabarent.service.PhoneNumberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the rate-limiter PATH WIRING in {@link WebConfig} (its {@code addPathPatterns}), not the
 * interceptor logic (covered by {@link OrderRateLimitInterceptorTest} /
 * {@link RegisterRateLimitInterceptorTest}). This loads the REAL {@code WebConfig} via the MVC slice
 * with the real security chain (mirroring {@code SecurityAuthorizationTest}) and rate limiting
 * ENABLED at tiny limits, so a path typo (e.g. registering on {@code /api/auth/**}, which would
 * silently throttle {@code /login} and lock out legit users) would fail here.
 *
 * <p>The {@code WebConfig} interceptors are singletons in the shared test context, so each test uses
 * a DISTINCT client key (CF-Connecting-IP header) to keep its bucket store isolated and deterministic.
 */
@WebMvcTest(controllers = {AuthController.class, OrderController.class})
@Import({SecurityConfig.class, CorsConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        PhoneNumberService.class})
@TestPropertySource(properties = {
        "app.rate-limit.enabled=true",
        "app.rate-limit.orders.per-minute=1",
        "app.rate-limit.orders.per-hour=1000",
        "app.rate-limit.register.per-hour=1",
        "app.rate-limit.register.per-day=1000"
})
class RateLimitWiringTest {

    private static final String REGISTER_BODY =
            "{\"fullName\":\"Sara\",\"phone\":\"0525551234\",\"password\":\"password123\"}";
    private static final String LOGIN_BODY =
            "{\"identifier\":\"sara@example.com\",\"password\":\"password123\"}";
    private static final String ORDER_BODY = String.format(
            "{\"eventDate\":\"%s\",\"returnDate\":\"%s\",\"items\":[{\"kabaId\":1,\"quantity\":1}]}",
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(2));

    @Autowired private MockMvc mockMvc;

    @MockBean private AuthService authService;
    @MockBean private OrderService orderService;

    @BeforeEach
    void setUp() {
        when(authService.register(any())).thenReturn(AuthResponse.builder().customerId(1L).token("t").build());
        when(authService.login(any())).thenReturn(AuthResponse.builder().customerId(1L).token("t").build());
        when(orderService.create(any(), any(), any())).thenReturn(OrderResponse.builder().id(1L).build());
    }

    private RequestPostProcessor asCustomer(long id) {
        CustomerPrincipal p = new CustomerPrincipal(id, "c@x.com", null, Role.CUSTOMER);
        return authentication(new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
    }

    @Test
    void register_isRateLimited() throws Exception {
        // First registration from this client passes; the second (per-hour=1) is throttled.
        mockMvc.perform(post("/api/auth/register").header("CF-Connecting-IP", "10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON).content(REGISTER_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").header("CF-Connecting-IP", "10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON).content(REGISTER_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    void login_isNotRateLimited() throws Exception {
        // Login is NOT on a rate-limited path: even past register's per-hour limit it never 429s.
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login").header("CF-Connecting-IP", "10.0.0.2")
                            .contentType(MediaType.APPLICATION_JSON).content(LOGIN_BODY))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void orders_isRateLimited() throws Exception {
        // POST /api/orders is ROLE_CUSTOMER-only, so authenticate to clear security and reach the
        // interceptor. First order passes; the second (per-minute=1) is throttled.
        mockMvc.perform(post("/api/orders").with(asCustomer(7L)).header("CF-Connecting-IP", "10.0.0.3")
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/orders").with(asCustomer(7L)).header("CF-Connecting-IP", "10.0.0.3")
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));
    }
}
