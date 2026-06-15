package com.kabarent.security;

import com.kabarent.model.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads the {@code Authorization: Bearer <jwt>} header, validates the token, and populates
 * the {@link SecurityContextHolder} with a {@link CustomerPrincipal} and its role authority.
 * Stateless: authentication is rebuilt from the token claims, with no DB lookup.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parse(token);
                Long customerId = Long.valueOf(claims.getSubject());
                String email = claims.get("email", String.class);
                String roleName = claims.get("role", String.class);
                Role role = roleName == null ? Role.CUSTOMER : Role.valueOf(roleName);

                CustomerPrincipal principal = new CustomerPrincipal(customerId, email, null, role);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (JwtException | IllegalArgumentException ex) {
                // Invalid/expired token: leave the context unauthenticated; the entry point handles 401.
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
