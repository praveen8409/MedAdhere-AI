package com.wipro.medtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DoseSchedule Entity representing a discrete scheduled medication event.
 * Slots: MORNING, AFTERNOON, NIGHT.
 * Statuses: PENDING, TAKEN, MISSED.
 */
@Entity
@Table(name = "dose_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoseSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false, length = 30)
    private String scheduledSlot; // MORNING, AFTERNOON, NIGHT

    @Column(nullable = false)
    private LocalTime scheduledTime;

    @Column(nullable = false, length = 30)
    private String status; // PENDING, TAKEN, MISSED

    private LocalDateTime takenAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean alertSentToCaretaker = false;
}
