package com.kabarent.controller;

import com.kabarent.dto.request.KabaRequest;
import com.kabarent.dto.response.AvailabilityResponse;
import com.kabarent.dto.response.KabaResponse;
import com.kabarent.service.AvailabilityService;
import com.kabarent.service.KabaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/kabas")
@RequiredArgsConstructor
public class KabaController {

    private final KabaService kabaService;
    private final AvailabilityService availabilityService;

    @GetMapping
    public ResponseEntity<List<KabaResponse>> listKabas(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String size) {
        return ResponseEntity.ok(kabaService.listActiveKabas(category, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KabaResponse> getKaba(@PathVariable Long id) {
        return ResponseEntity.ok(kabaService.getById(id));
    }

    // GET /api/kabas/{id}/availability?eventDate=2025-06-01&returnDate=2025-06-03
    @GetMapping("/{id}/availability")
    public ResponseEntity<AvailabilityResponse> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate returnDate) {
        return ResponseEntity.ok(availabilityService.checkAvailability(id, eventDate, returnDate));
    }

    // GET /api/kabas/available?eventDate=2025-06-01&returnDate=2025-06-03
    @GetMapping("/available")
    public ResponseEntity<List<KabaResponse>> getAvailableKabas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate returnDate) {
        return ResponseEntity.ok(availabilityService.getAvailableKabas(eventDate, returnDate));
    }

    @PostMapping
    public ResponseEntity<KabaResponse> createKaba(@Valid @RequestBody KabaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kabaService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KabaResponse> updateKaba(
            @PathVariable Long id,
            @Valid @RequestBody KabaRequest request) {
        return ResponseEntity.ok(kabaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKaba(@PathVariable Long id) {
        kabaService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
