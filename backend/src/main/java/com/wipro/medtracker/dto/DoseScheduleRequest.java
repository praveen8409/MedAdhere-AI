package com.wipro.medtracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoseScheduleRequest {
    @NotNull
    private Long medicineId;

    @NotNull
    private Long patientId;

    @NotBlank
    private String scheduledSlot; // MORNING, AFTERNOON, NIGHT

    @NotNull
    private LocalTime scheduledTime;

    @Builder.Default
    private String status = "PENDING"; // PENDING, TAKEN, MISSED
}
