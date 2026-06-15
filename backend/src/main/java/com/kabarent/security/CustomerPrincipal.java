package com.kabarent.security;

import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Authenticated principal backed by a {@link Customer}. Carries the customer id so that
 * ownership checks derive {@code customerId} from the security context — never from a
 * request parameter.
 */
public class CustomerPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final Role role;

    public CustomerPrincipal(Long id, String email, String passwordHash, Role role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role == null ? Role.CUSTOMER : role;
    }

    public static CustomerPrincipal from(Customer customer) {
        return new CustomerPrincipal(
                customer.getId(), customer.getEmail(), customer.getPasswordHash(), customer.getRole());
    }

    public Long getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
