package com.wipro.medtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * CaretakerAlert Entity representing clinical escalations, missed medication notices,
 * low-stock alarms, and patient emergency SOS broadcasts.
 */
@Entity
@Table(name = "caretaker_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaretakerAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"caretaker", "chemist", "password"})
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "caretaker_id", nullable = false)
    @JsonIgnoreProperties({"caretaker", "chemist", "password"})
    private User caretaker;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(nullable = false, length = 50)
    private String alertType; // MISSED_DOSE, CRITICAL_LOW_STOCK, EMERGENCY_SOS, REFILL_STATUS

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private Boolean resolved = false;

    private LocalDateTime resolvedAt;

    @Column(length = 500)
    private String resolutionNotes;

    @Column(length = 100)
    private String resolvedBy;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
