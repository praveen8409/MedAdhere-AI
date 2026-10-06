package com.wipro.medtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * RefillOrder Entity representing pharmacy supply chain transactions in the Refill Mesh.
 * Triggered automatically when Medicine remainingTablets <= safety threshold or manually by Caretaker.
 * Managed and fulfilled by ROLE_CHEMIST.
 */
@Entity
@Table(name = "refill_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefillOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"caretaker", "chemist", "password"})
    private User patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chemist_id", nullable = false)
    @JsonIgnoreProperties({"caretaker", "chemist", "password"})
    private User chemist;

    @Column(nullable = false)
    private Integer quantity; // e.g. 30 or 60 tablets

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String orderStatus = "REQUESTED"; // REQUESTED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime orderDate = LocalDateTime.now();

    private LocalDateTime deliveryDate;

    @Column(length = 500)
    private String trackingNotes;

    @Column(length = 30)
    @Builder.Default
    private String urgencyLevel = "NORMAL"; // NORMAL, URGENT_CRITICAL
}
