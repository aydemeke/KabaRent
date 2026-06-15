package com.kabarent.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    /**
     * CORS settings exposed as a {@link CorsConfigurationSource} so Spring Security applies
     * them inside its filter chain (via {@code http.cors(...)}), which also lets OPTIONS
     * preflight requests through the fail-closed authorization rules.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow sending Authorization/credentials headers.
        config.setAllowCredentials(true);

        // Allowed origins (the Vercel URL must be exact and have no trailing slash).
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "https://kaba-rent.vercel.app"
        ));

        // Allow all headers (Authorization, Content-Type, etc.).
        config.setAllowedHeaders(Arrays.asList("*"));

        // Allow all HTTP methods, including the preflight OPTIONS request.
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
