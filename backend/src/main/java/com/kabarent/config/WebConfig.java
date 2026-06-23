package com.kabarent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registers the {@link OrderRateLimitInterceptor} for the public guest-checkout endpoint only.
 *
 * <p>The interceptor is constructed here (not exposed as a {@code @Component}) on purpose:
 * {@code @WebMvcTest} auto-includes any {@code WebMvcConfigurer}, and a separate interceptor
 * bean would have to be provided by every slice test. Building it inside this config keeps its
 * dependencies ({@link ObjectMapper} + the {@code app.rate-limit.*} values, all available in the
 * MVC slice) self-contained.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final OrderRateLimitInterceptor orderRateLimitInterceptor;

    public WebConfig(ObjectMapper objectMapper,
                     @Value("${app.rate-limit.enabled:true}") boolean rateLimitEnabled,
                     @Value("${app.rate-limit.orders.per-minute:5}") int ordersPerMinute,
                     @Value("${app.rate-limit.orders.per-hour:20}") int ordersPerHour) {
        this.orderRateLimitInterceptor =
                new OrderRateLimitInterceptor(objectMapper, rateLimitEnabled, ordersPerMinute, ordersPerHour);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Exact path: sibling routes like /api/orders/{id} (admin) are NOT matched.
        registry.addInterceptor(orderRateLimitInterceptor).addPathPatterns("/api/orders");
    }
}
