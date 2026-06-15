package com.kabarent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kabarent.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Fail-closed security: {@code anyRequest().authenticated()} is the default — nothing
 * falls through to public. Only the explicit matchers below are open or role-restricted.
 *
 * <p>Tiers: public (catalog GETs, auth, guest order creation), ROLE_CUSTOMER (/api/my/**),
 * ROLE_ADMIN (all management operations). Stateless JWT; no server-side session.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // --- Public ---
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/kabas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll() // guest checkout
                        // --- Customer (own data only) ---
                        .requestMatchers("/api/my/**").hasRole("CUSTOMER")
                        // --- Admin (management) ---
                        .requestMatchers(HttpMethod.POST, "/api/kabas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/kabas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/kabas/**").hasRole("ADMIN")
                        .requestMatchers("/api/orders/**").hasRole("ADMIN") // list, get-by-id, status, by-customer
                        .requestMatchers("/api/customers/**").hasRole("ADMIN")
                        .requestMatchers("/api/payments/**").hasRole("ADMIN")
                        // --- Fail closed ---
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(restAuthenticationEntryPoint())
                        .accessDeniedHandler(restAccessDeniedHandler()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /** 401 for unauthenticated requests, in the same JSON shape as GlobalExceptionHandler. */
    private AuthenticationEntryPoint restAuthenticationEntryPoint() {
        return (request, response, authException) ->
                writeError(response, HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    /** 403 for authenticated-but-forbidden requests. */
    private AccessDeniedHandler restAccessDeniedHandler() {
        return (request, response, accessDeniedException) ->
                writeError(response, HttpStatus.FORBIDDEN, "Access denied");
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", message
        ));
    }
}
