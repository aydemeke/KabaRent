package com.kabarent.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow sending cookies and authentication headers if needed
        config.setAllowCredentials(true);

        // Allowed origins (Make sure the Vercel URL is exact and has no trailing slash)
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",
                "https://kaba-rent.vercel.app"
        ));

        // Allow all headers (Authorization, Content-Type, etc.)
        config.setAllowedHeaders(Arrays.asList("*"));

        // Allow all HTTP methods, including the preflight OPTIONS request
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Apply these CORS settings to all API endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}