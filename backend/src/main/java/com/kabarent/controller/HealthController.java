package com.kabarent.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public, DB-free liveness check for external keep-alive pings (warms the Render service
 * to avoid cold starts). Intentionally does NOT touch the database: pinging this must not
 * wake the Neon DB and burn its CU-hour budget. (Deliberately not Spring Actuator.)
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
