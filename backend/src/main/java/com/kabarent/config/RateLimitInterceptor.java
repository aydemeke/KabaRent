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
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Best-effort, per-client rate limiter for a public, DB-writing endpoint, as defense-in-depth
 * against casual abuse (spam / table-fill on the free tier). One instance is registered per
 * protected path (see {@link WebConfig}) with its own {@code limits} — e.g. {@code POST /api/orders}
 * (per-minute + per-hour) and {@code POST /api/auth/register} (per-hour + per-day). The bucket
 * enforces every limit simultaneously, so the most restrictive one applies.
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
 * <p>{@code preHandle} skips non-POST requests, so CORS preflight (OPTIONS) and any future GETs
 * on a protected path are naturally excluded. {@code /health} and authenticated endpoints are
 * untouched.
 */
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final List<Bandwidth> limits;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitInterceptor(ObjectMapper objectMapper, boolean enabled, List<Bandwidth> limits) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.limits = List.copyOf(limits);
    }

    /** Builds a greedy-refill bandwidth of {@code capacity} tokens per {@code window}. */
    public static Bandwidth limit(int capacity, Duration window) {
        return Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, window)
                .build();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (!enabled) {
            return true;
        }
        // Only rate-limit the write itself; non-POST (CORS preflight, future GETs) passes through.
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

    /** A fresh bucket enforcing every configured limit simultaneously (the most restrictive applies). */
    private Bucket newBucket() {
        var builder = Bucket.builder();
        limits.forEach(builder::addLimit);
        return builder.build();
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
