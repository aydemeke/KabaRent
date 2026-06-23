package com.kabarent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;
import java.util.List;

/**
 * Registers a {@link RateLimitInterceptor} on each public, DB-writing POST endpoint with its own
 * limits: {@code POST /api/orders} (per-minute + per-hour) and {@code POST /api/auth/register}
 * (per-hour + per-day). Both share the {@code app.rate-limit.enabled} flag.
 *
 * <p>The interceptors are constructed here (not exposed as {@code @Component}s) on purpose:
 * {@code @WebMvcTest} auto-includes any {@code WebMvcConfigurer}, and separate interceptor
 * beans would have to be provided by every slice test. Building them inside this config keeps
 * their dependencies ({@link ObjectMapper} + the {@code app.rate-limit.*} values, all available
 * in the MVC slice) self-contained.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor orderRateLimitInterceptor;
    private final RateLimitInterceptor registerRateLimitInterceptor;

    public WebConfig(ObjectMapper objectMapper,
                     @Value("${app.rate-limit.enabled:true}") boolean rateLimitEnabled,
                     @Value("${app.rate-limit.orders.per-minute:5}") int ordersPerMinute,
                     @Value("${app.rate-limit.orders.per-hour:20}") int ordersPerHour,
                     @Value("${app.rate-limit.register.per-hour:3}") int registerPerHour,
                     @Value("${app.rate-limit.register.per-day:10}") int registerPerDay) {
        this.orderRateLimitInterceptor = new RateLimitInterceptor(objectMapper, rateLimitEnabled, List.of(
                RateLimitInterceptor.limit(ordersPerMinute, Duration.ofMinutes(1)),
                RateLimitInterceptor.limit(ordersPerHour, Duration.ofHours(1))));
        this.registerRateLimitInterceptor = new RateLimitInterceptor(objectMapper, rateLimitEnabled, List.of(
                RateLimitInterceptor.limit(registerPerHour, Duration.ofHours(1)),
                RateLimitInterceptor.limit(registerPerDay, Duration.ofDays(1))));
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Exact paths: sibling routes (e.g. /api/orders/{id} admin, /api/auth/login) are NOT matched.
        registry.addInterceptor(orderRateLimitInterceptor).addPathPatterns("/api/orders");
        registry.addInterceptor(registerRateLimitInterceptor).addPathPatterns("/api/auth/register");
    }
}
