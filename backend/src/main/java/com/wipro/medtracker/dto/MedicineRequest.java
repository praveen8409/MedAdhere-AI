package com.wipro.medtracker.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineRequest {
    @NotNull
    private Long patientId;

    private Long caretakerAuthorId;

    @NotBlank
    private String name;

    @NotBlank
    private String dosage; // e.g. 500mg

    private String instructions; // e.g. After food

    @NotNull
    @Min(1)
    private Integer dailyDoseCount;

    @NotNull
    @Min(0)
    private Integer remainingTablets;

    @NotNull
    @Min(1)
    private Integer totalCourseDays;

    private Integer daysCompleted;

    private LocalDate expiryDate;

    private String emergencyPurpose;

    // Optional slot configuration for automatic schedule generation:
    // e.g. ["MORNING", "NIGHT"]
    private java.util.List<String> scheduledSlots;
}
