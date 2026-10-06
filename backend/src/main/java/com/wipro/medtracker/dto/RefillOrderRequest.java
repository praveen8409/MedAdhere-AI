package com.wipro.medtracker.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefillOrderRequest {
    @NotNull
    private Long medicineId;

    @NotNull
    private Long patientId;

    private Long chemistId;

    @NotNull
    @Min(1)
    private Integer quantity; // e.g. 30, 60

    private String urgencyLevel; // NORMAL, URGENT_CRITICAL
    private String trackingNotes;
}
