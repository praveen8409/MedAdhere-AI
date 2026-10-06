package com.wipro.medtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity representing a patient's request to be assigned to a Caretaker,
 * accompanied by their prescription document and clinical notes.
 */
@Entity
@Table(name = "care_assignment_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareAssignmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password", "caretaker", "chemist"})
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "caretaker_id", nullable = false)
    @JsonIgnoreProperties({"password", "caretaker", "chemist"})
    private User caretaker;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(length = 2000)
    private String prescriptionNotes;

    @Column(length = 500)
    private String prescriptionDocUrl;

    @Column(length = 500)
    private String caretakerResponseNotes;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime respondedAt;
}
