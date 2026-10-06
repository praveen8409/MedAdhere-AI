package com.wipro.medtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * AuditLog Entity representing immutable transactional activity records,
 * tamper detection logs, and chaos simulation tracking in the in-memory ledger.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String eventType; // DOSE_TAKEN, INVENTORY_DEDUCTED, REFILL_REQUESTED, REFILL_DISPATCHED, MISSED_DOSE_ESCALATED, AI_QUERY, EMERGENCY_SOS

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 100)
    private String actor;

    @Column(length = 150)
    private String patientName;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String severity = "INFO"; // INFO, WARNING, CRITICAL

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
