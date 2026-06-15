package com.kabarent.security;

import com.kabarent.config.CorsConfig;
import com.kabarent.config.SecurityConfig;
import com.kabarent.controller.*;
import com.kabarent.model.enums.Role;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the fail-closed authorization rules through the real security filter chain:
 * unauthenticated → 401, non-admin → 403 for every admin operation, public endpoints open,
 * and the customer tier (/api/my/**) scoped to ROLE_CUSTOMER.
 */
@WebMvcTest(controllers = {
        OrderController.class, CustomerController.class, KabaController.class,
        PaymentController.class, MyOrderController.class, AuthController.class
})
@Import({SecurityConfig.class, CorsConfig.class, JwtAuthenticationFilter.class, JwtService.class})
class SecurityAuthorizationTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private OrderService orderService;
    @MockBean private CustomerService customerService;
    @MockBean private KabaService kabaService;
    @MockBean private AvailabilityService availabilityService;
    @MockBean private PaymentService paymentService;
    @MockBean private AuthService authService;

    private RequestPostProcessor asCustomer(long id) {
        CustomerPrincipal p = new CustomerPrincipal(id, "c@x.com", null, Role.CUSTOMER);
        return authentication(new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
    }

    private RequestPostProcessor asAdmin(long id) {
        CustomerPrincipal p = new CustomerPrincipal(id, "admin@x.com", null, Role.ADMIN);
        return authentication(new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
    }

    // ---------- Unauthenticated → 401 ----------

    @Test
    void protectedEndpoints_noToken_areUnauthorized() throws Exception {
        mockMvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/orders/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/customers")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/payments")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/my/orders")).andExpect(status().isUnauthorized());
    }

    // ---------- Non-admin caller → 403 for each admin operation ----------

    @Test
    void adminOrderOperations_asCustomer_areForbidden() throws Exception {
        mockMvc.perform(get("/api/orders").with(asCustomer(7L))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/orders/1").with(asCustomer(7L))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/orders/customer/1").with(asCustomer(7L))).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/orders/1/status").with(asCustomer(7L))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCustomerOperations_asCustomer_areForbidden() throws Exception {
        mockMvc.perform(get("/api/customers").with(asCustomer(7L))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/customers/1").with(asCustomer(7L))).andExpect(status().isForbidden());
    }

    @Test
    void adminPaymentOperations_asCustomer_areForbidden() throws Exception {
        mockMvc.perform(get("/api/payments").with(asCustomer(7L))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/payments/order/1").with(asCustomer(7L))).andExpect(status().isForbidden());
    }

    @Test
    void kabaMutations_asCustomer_areForbidden() throws Exception {
        mockMvc.perform(post("/api/kabas").with(asCustomer(7L))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/kabas/1").with(asCustomer(7L))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/kabas/1").with(asCustomer(7L)))
                .andExpect(status().isForbidden());
    }

    // ---------- Public endpoints stay open ----------

    @Test
    void publicCatalog_noToken_isAllowed() throws Exception {
        when(kabaService.listActiveKabas(null, null)).thenReturn(List.of());
        mockMvc.perform(get("/api/kabas")).andExpect(status().isOk());
    }

    @Test
    void guestOrderCreation_noToken_passesSecurity() throws Exception {
        // Empty body → 400 (validation) proves the request was NOT blocked by 401/403.
        mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerAndLogin_noToken_areAllowed() throws Exception {
        // Empty body → 400 (validation), i.e. reached the controller (permitAll).
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- Customer tier (/api/my/**) ----------

    @Test
    void myOrders_asCustomer_isAllowed() throws Exception {
        when(orderService.getByCustomer(7L)).thenReturn(List.of());
        mockMvc.perform(get("/api/my/orders").with(asCustomer(7L))).andExpect(status().isOk());
    }

    @Test
    void myOrders_asAdmin_isForbidden() throws Exception {
        // Admin holds ROLE_ADMIN, not ROLE_CUSTOMER → /api/my/** is denied.
        mockMvc.perform(get("/api/my/orders").with(asAdmin(1L))).andExpect(status().isForbidden());
    }

    @Test
    void myOrderById_otherCustomersOrder_isNotFound() throws Exception {
        // Customer 7 requests an order they do not own → service raises 404 (not 403).
        when(orderService.getByIdForCustomer(anyLong(), org.mockito.ArgumentMatchers.eq(7L)))
                .thenThrow(new ResourceNotFoundException("Order not found with id: 99"));
        mockMvc.perform(get("/api/my/orders/99").with(asCustomer(7L))).andExpect(status().isNotFound());
    }
}
