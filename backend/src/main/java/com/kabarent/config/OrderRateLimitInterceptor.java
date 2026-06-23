package com.kabarent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Best-effort, per-client rate limiter for the order-creation endpoint (POST /api/orders).
 * Ordering now requires an authenticated CUSTOMER, so this is defense-in-depth behind auth:
 * it caps how fast a single client can write orders (runaway double-submits, an abusive
 * account spamming orders / filling the customer/order tables on the free tier).
 *
 * <p>Intentionally limited in scope: it raises the bar against casual abuse and runaway
 * double-submits, NOT a determined attacker rotating IPs/headers.
 *
 * <p>The bucket store is an in-memory map, so it is <b>per-instance</b>: this is fine for
 * the single Render free-tier instance, but a scaled-out deployment would need a shared
 * store (e.g. Redis via bucket4j's distributed backends). The map also grows unboundedly
 * as distinct client keys accumulate; acceptable at current volume (low traffic, single
 * instance). Swap in an expiring cache (e.g. Caffeine {@code expireAfterAccess}) if that
 * ever becomes a concern.
 *
 * <p>Registered only for {@code /api/orders} (see {@link WebConfig}); {@code preHandle}
 * additionally skips non-POST requests, so CORS preflight (OPTIONS) and any future GETs on
 * that path are naturally excluded. {@code /health} and authenticated endpoints are untouched.
 */
@Slf4j
public class OrderRateLimitInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final int perMinute;
    private final int perHour;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public OrderRateLimitInterceptor(ObjectMapper objectMapper, boolean enabled, int perMinute, int perHour) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.perMinute = perMinute;
        this.perHour = perHour;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (!enabled) {
            return true;
        }
        // Only rate-limit the actual order creation; non-POST (CORS preflight, future GETs) passes through.
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        Bucket bucket = buckets.computeIfAbsent(resolveClientKey(request), key -> newBucket());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return true;
        }

        long retryAfterSeconds = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
        writeTooManyRequests(response, retryAfterSeconds);
        return false;
    }

    /** A fresh bucket enforcing both limits simultaneously (the most restrictive applies). */
    private Bucket newBucket() {
        Bandwidth perMin = Bandwidth.builder()
                .capacity(perMinute)
                .refillGreedy(perMinute, Duration.ofMinutes(1))
                .build();
        Bandwidth perHr = Bandwidth.builder()
                .capacity(perHour)
                .refillGreedy(perHour, Duration.ofHours(1))
                .build();
        return Bucket.builder()
                .addLimit(perMin)
                .addLimit(perHr)
                .build();
    }

    /**
     * Resolves the per-client key. On Render every web service is fronted by Render's own
     * Cloudflare edge, so:
     * <ol>
     *   <li>{@code CF-Connecting-IP} — a single, per-client IP stamped by that edge and not
     *       client-spoofable (the origin is only reachable through Cloudflare, which overwrites
     *       the header). Reliable on Render but <b>undocumented by Render</b>, so it could break
     *       if they change infrastructure — hence the fallbacks below.</li>
     *   <li>{@code X-Forwarded-For} leftmost entry — Render's <b>documented</b> position for the
     *       real client IP. (Leftmost is client-spoofable in general, acceptable for this
     *       best-effort scope.)</li>
     *   <li>{@code getRemoteAddr()} — last resort only; on Render this is a shared internal
     *       load-balancer IP, so it must NOT be the primary key (it would collapse the limiter
     *       into a single global bucket).</li>
     * </ol>
     */
    private String resolveClientKey(HttpServletRequest request) {
        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (cfConnectingIp != null && !cfConnectingIp.isBlank()) {
            return cfConnectingIp.trim();
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Writes a 429 by hand: an interceptor's {@code preHandle} rejection never reaches
     * {@link com.kabarent.exception.GlobalExceptionHandler}, so we emit the same
     * {@code {timestamp, status, error}} JSON shape (mirroring {@code SecurityConfig.writeError})
     * plus a {@code Retry-After} header.
     */
    private void writeTooManyRequests(HttpServletResponse response, long retryAfterSeconds) throws java.io.IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));
        objectMapper.writeValue(response.getWriter(), Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "error", "Too many requests. Please slow down and try again shortly."
        ));
    }

    /** Test hook: drops all accumulated buckets so limiter state does not leak across tests. */
    void clear() {
        buckets.clear();
    }
}
