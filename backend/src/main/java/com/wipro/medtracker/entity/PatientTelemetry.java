package com.wipro.medtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PatientTelemetry Entity representing vital health metrics and wearable sensor streams.
 * Clinical Governance Rule:
 * Telemetry data is STRICTLY COLLECTED AND STREAMED ONLY IF the patient has explicitly
 * opted in and enabled telemetry by themselves. Caretakers and chemists cannot force telemetry.
 */
@Entity
@Table(name = "patient_telemetries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientTelemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"password", "caretaker", "chemist"})
    private User patient;

    // Vital signs metrics
    private Integer heartRate;          // Beats per minute (normal: 60-100 bpm)
    private Integer systolicBp;         // Systolic Blood Pressure (mmHg, normal: 90-120)
    private Integer diastolicBp;        // Diastolic Blood Pressure (mmHg, normal: 60-80)
    private Double bloodGlucose;        // Blood Glucose (mg/dL, normal fasting: 70-110)
    private Double oxygenSaturation;    // Blood Oxygen SpO2 % (normal: 95-100%)
    private Double bodyTemperature;     // Body Temperature (°F, normal: 97.6-99.0°F)
    private Integer stepCount;          // Daily ambulatory mobility step count
    private Integer deviceBatteryLevel; // Sensor/wearable battery percentage (0-100%)

    @Column(length = 50)
    @Builder.Default
    private String deviceStatus = "CONNECTED"; // CONNECTED, SYNCED, STANDBY, LOW_BATTERY

    @Column(length = 150)
    @Builder.Default
    private String sensorSource = "Patient BLE Smart Health Band"; // e.g. BLE Health Band, Pulse Oximeter, CGM

    @Column(length = 500)
    private String telemetryNotes;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    @Builder.Default
    private Boolean abnormalReading = false;

    @Column(length = 255)
    private String anomalyWarning;

    @PrePersist
    public void onPrePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (deviceStatus == null || deviceStatus.isBlank()) {
            deviceStatus = "CONNECTED";
        }
        if (abnormalReading == null) {
            abnormalReading = false;
        }
    }
}
