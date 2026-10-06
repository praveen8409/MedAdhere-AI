package com.wipro.medtracker.dto;

import com.wipro.medtracker.entity.PatientTelemetry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryStatusResponse {
    private Long patientId;
    private String patientName;
    private Boolean telemetryEnabled;
    private Boolean shareWithCaretaker;
    private Integer frequencyMinutes;
    private LocalDateTime consentAt;
    private String message;
    private PatientTelemetry latestReading;
    private List<PatientTelemetry> recentReadings;
}
