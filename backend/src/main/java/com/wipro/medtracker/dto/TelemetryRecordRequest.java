package com.wipro.medtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryRecordRequest {
    private Integer heartRate;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Double bloodGlucose;
    private Double oxygenSaturation;
    private Double bodyTemperature;
    private Integer stepCount;
    private Integer deviceBatteryLevel;
    private String sensorSource;
    private String telemetryNotes;
}
