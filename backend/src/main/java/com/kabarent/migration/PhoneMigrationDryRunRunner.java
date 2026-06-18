package com.kabarent.migration;

import com.kabarent.exception.InvalidPhoneNumberException;
import com.kabarent.model.Customer;
import com.kabarent.model.enums.Role;
import com.kabarent.repository.CustomerRepository;
import com.kabarent.service.PhoneNumberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * READ-ONLY Phase A dry-run for the email→phone identity migration.
 *
 * <p>Activates ONLY when {@code migration.phone.dry-run=true}, so it never runs during normal
 * startup. It loads every customer, attempts to normalize each non-admin phone to E.164 entirely
 * IN MEMORY, and prints a report of what the real (Phase B) migration would do. It performs
 * ZERO writes and creates NO constraints — it only reads.
 *
 * <p>The report flags two blockers for Phase B:
 * <ul>
 *   <li><b>invalid</b> phones (unparseable / not valid) — these must be fixed before migrating;</li>
 *   <li><b>collision groups</b> — distinct rows that normalize to the SAME E.164, which would
 *       violate the planned UNIQUE(phone) constraint and need dedup first.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "migration.phone.dry-run", havingValue = "true")
public class PhoneMigrationDryRunRunner implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final PhoneNumberService phoneNumberService;

    private record InvalidRow(Long id, String name, String rawPhone, String reason) {}

    private record ChangeRow(Long id, String name, String rawPhone, String e164) {}

    @Override
    @Transactional(readOnly = true)
    public void run(String... args) {
        List<Customer> all = customerRepository.findAll();

        int adminSkipped = 0;
        int unchanged = 0;
        List<ChangeRow> wouldChange = new ArrayList<>();
        List<InvalidRow> invalid = new ArrayList<>();
        // normalized E.164 -> rows that map to it (insertion-ordered for stable output)
        Map<String, List<Customer>> byNormalized = new LinkedHashMap<>();

        for (Customer c : all) {
            if (c.getRole() == Role.ADMIN) {
                adminSkipped++;
                continue;
            }
            String raw = c.getPhone();
            try {
                String e164 = phoneNumberService.normalizeToE164(raw);
                byNormalized.computeIfAbsent(e164, k -> new ArrayList<>()).add(c);
                if (e164.equals(raw)) {
                    unchanged++;
                } else {
                    wouldChange.add(new ChangeRow(c.getId(), c.getFullName(), raw, e164));
                }
            } catch (InvalidPhoneNumberException e) {
                invalid.add(new InvalidRow(c.getId(), c.getFullName(), raw, e.getMessage()));
            }
        }

        // Collision groups: normalized values shared by more than one row.
        List<Map.Entry<String, List<Customer>>> collisions = byNormalized.entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("\n========== PHONE MIGRATION DRY-RUN (READ-ONLY, ZERO WRITES) ==========\n");
        sb.append("Total customer rows          : ").append(all.size()).append('\n');
        sb.append("ADMIN rows skipped           : ").append(adminSkipped).append('\n');
        sb.append("Non-admin rows processed     : ").append(all.size() - adminSkipped).append('\n');
        sb.append("  - phone would CHANGE       : ").append(wouldChange.size()).append('\n');
        sb.append("  - phone already canonical  : ").append(unchanged).append('\n');
        sb.append("  - phone INVALID (blockers) : ").append(invalid.size()).append('\n');
        sb.append("Collision groups (blockers)  : ").append(collisions.size()).append('\n');

        sb.append("\n--- WILL CHANGE: raw -> canonical E.164 (literal backfill values) ---\n");
        if (wouldChange.isEmpty()) {
            sb.append("(none)\n");
        } else {
            for (ChangeRow r : wouldChange) {
                sb.append(String.format("  id=%d  name=%s  rawPhone=%s  e164=%s%n",
                        r.id(), r.name(), quote(r.rawPhone()), r.e164()));
            }
        }

        sb.append("\n--- INVALID / UNPARSEABLE PHONES (must fix before Phase B) ---\n");
        if (invalid.isEmpty()) {
            sb.append("(none)\n");
        } else {
            for (InvalidRow r : invalid) {
                sb.append(String.format("  id=%d  name=%s  rawPhone=%s  reason=%s%n",
                        r.id(), r.name(), quote(r.rawPhone()), r.reason()));
            }
        }

        sb.append("\n--- COLLISION GROUPS: rows normalizing to the SAME E.164 (need dedup in Phase B) ---\n");
        if (collisions.isEmpty()) {
            sb.append("(none)\n");
        } else {
            for (Map.Entry<String, List<Customer>> group : collisions) {
                sb.append("  ").append(group.getKey()).append(" <= ").append(group.getValue().size()).append(" rows\n");
                for (Customer c : group.getValue()) {
                    sb.append(String.format("      id=%d  name=%s  rawPhone=%s  email=%s%n",
                            c.getId(), c.getFullName(), quote(c.getPhone()), quote(c.getEmail())));
                }
            }
        }
        sb.append("=====================================================================\n");

        // Print to both the log and stdout so the report is visible regardless of log config.
        log.info(sb.toString());
        System.out.println(sb);
    }

    private static String quote(String v) {
        return v == null ? "<null>" : "\"" + v + "\"";
    }
}
