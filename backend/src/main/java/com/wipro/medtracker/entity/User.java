package com.wipro.medtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

/**
 * User Entity representing system actors across three clinical roles:
 * ROLE_PATIENT, ROLE_CARETAKER, and ROLE_CHEMIST.
 * Provides multi-tenant data binding with direct self-referencing links
 * between Geriatric Patients, Primary Family Caretakers, and Local Chemists.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 50)
    private String role; // ROLE_PATIENT, ROLE_CARETAKER, ROLE_CHEMIST

    @Column(length = 20)
    private String phoneNumber;

    @Column(length = 255)
    private String address;

    @Column(length = 20)
    private String familyLinkCode;

    private Integer age;

    @Column(length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, PENDING_APPROVAL, BLOCKED

    @Column(length = 100)
    private String licenseNumber; // Drug License No for chemist, Govt ID / Nurse Reg for caretaker

    @Column(length = 100)
    private String designation; // e.g., Daughter, Registered Nurse, Head Pharmacist

    @Column(length = 150)
    private String emergencyContact;

    @Column(length = 255)
    private String chronicConditions;

    private java.time.LocalDateTime registeredAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean telemetryEnabled = false;

    private java.time.LocalDateTime telemetryConsentAt;

    @Builder.Default
    private Integer telemetryFrequencyMinutes = 30;

    @Builder.Default
    private Boolean telemetrySharingConsent = false;

    @PrePersist
    public void onPrePersist() {
        if (registeredAt == null) {
            registeredAt = java.time.LocalDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = "ACTIVE";
        }
        if (telemetryEnabled == null) {
            telemetryEnabled = false;
        }
        if (telemetryFrequencyMinutes == null) {
            telemetryFrequencyMinutes = 30;
        }
        if (telemetrySharingConsent == null) {
            telemetrySharingConsent = false;
        }
    }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "caretaker_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"caretaker", "chemist", "password"})
    private User caretaker;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chemist_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"caretaker", "chemist", "password"})
    private User chemist;
}
