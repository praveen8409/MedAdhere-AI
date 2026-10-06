package com.wipro.medtracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/**
 * Medicine Entity representing prescribed pharmaceuticals under Caretaker Governance.
 * Tracks current inventory, daily burn rate, total course progression, and auto-refill triggers.
 */
@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "caretaker_author_id", nullable = false)
    private User caretakerAuthor;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String dosage; // e.g. 500mg, 1 tablet

    @Column(length = 500)
    private String instructions; // e.g. After food with warm water

    @Column(nullable = false)
    private Integer dailyDoseCount; // e.g. 1, 2, 3 times daily

    @Column(nullable = false)
    private Integer remainingTablets; // atomic decrement on dose taken

    @Column(nullable = false)
    private Integer totalCourseDays; // e.g. 90 days

    @Column(nullable = false)
    private Integer daysCompleted; // increments as course progresses

    private LocalDate expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean autoRefillTriggered = false;

    @Column(length = 255)
    private String emergencyPurpose; // e.g. Blood Sugar Regulation, Hypertension, Vitamin Booster
}
