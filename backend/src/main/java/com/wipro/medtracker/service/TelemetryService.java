package com.wipro.medtracker.service;

import com.wipro.medtracker.dto.TelemetryConsentRequest;
import com.wipro.medtracker.dto.TelemetryRecordRequest;
import com.wipro.medtracker.dto.TelemetryStatusResponse;
import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.PatientTelemetry;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.PatientTelemetryRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryService {

    private final PatientTelemetryRepository telemetryRepository;
    private final UserRepository userRepository;
    private final CaretakerAlertRepository alertRepository;
    private final AuditLedgerService auditLedgerService;
    private final SseNotificationService sseNotificationService;

    private final Random random = new Random();

    /**
     * Get Telemetry Status for a Patient with Clinical Governance checks.
     * If the patient has NOT enabled telemetry, Caretakers and third parties cannot view telemetry data.
     */
    public TelemetryStatusResponse getTelemetryStatus(Long patientId, String authenticatedUsername) {
        User caller = userRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUsername));

        User patient;
        if (patientId != null) {
            patient = userRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
        } else {
            patient = caller;
        }

        boolean isPatientThemselves = caller.getId().equals(patient.getId());
        boolean isPrimaryCaretaker = patient.getCaretaker() != null && patient.getCaretaker().getId().equals(caller.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(caller.getRole());

        boolean isEnabled = Boolean.TRUE.equals(patient.getTelemetryEnabled());
        boolean isSharingAllowed = isPatientThemselves || (isPrimaryCaretaker && Boolean.TRUE.equals(patient.getTelemetrySharingConsent())) || isAdmin;

        if (!isEnabled || !isSharingAllowed) {
            String msg = !isEnabled
                    ? "Health telemetry is strictly disabled by patient consent preference. Data collection is suspended."
                    : "Patient has enabled local telemetry but restricted sharing with third-party dashboards.";

            return TelemetryStatusResponse.builder()
                    .patientId(patient.getId())
                    .patientName(patient.getFullName())
                    .telemetryEnabled(isEnabled)
                    .shareWithCaretaker(patient.getTelemetrySharingConsent())
                    .frequencyMinutes(patient.getTelemetryFrequencyMinutes())
                    .consentAt(patient.getTelemetryConsentAt())
                    .message(msg)
                    .latestReading(null)
                    .recentReadings(Collections.emptyList())
                    .build();
        }

        PatientTelemetry latest = telemetryRepository.findFirstByPatientIdOrderByTimestampDesc(patient.getId()).orElse(null);
        List<PatientTelemetry> recents = telemetryRepository.findTop15ByPatientIdOrderByTimestampDesc(patient.getId());

        return TelemetryStatusResponse.builder()
                .patientId(patient.getId())
                .patientName(patient.getFullName())
                .telemetryEnabled(true)
                .shareWithCaretaker(patient.getTelemetrySharingConsent())
                .frequencyMinutes(patient.getTelemetryFrequencyMinutes())
                .consentAt(patient.getTelemetryConsentAt())
                .message("Active vital telemetry streaming enabled by patient consent.")
                .latestReading(latest)
                .recentReadings(recents)
                .build();
    }

    /**
     * CLINICAL GOVERNANCE ENFORCEMENT:
     * Telemetry can ONLY be enabled or modified directly by the Patient themselves.
     * Caretakers and Pharmacists are not authorized to override patient privacy consent.
     */
    @Transactional
    public TelemetryStatusResponse updatePatientConsent(Long patientId, TelemetryConsentRequest request, String authenticatedUsername) {
        User caller = userRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUsername));

        User patient = (patientId != null)
                ? userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found: " + patientId))
                : caller;

        // Governance Rule: Only the patient themselves can toggle or configure their telemetry
        if (!caller.getId().equals(patient.getId())) {
            throw new SecurityException("Clinical Governance Violation: Telemetry can ONLY be enabled or modified directly by the Patient themselves. Caretakers and Pharmacists cannot override patient privacy consent.");
        }

        if (!"ROLE_PATIENT".equalsIgnoreCase(caller.getRole())) {
            throw new SecurityException("Clinical Governance Violation: Only patients can provide telemetry consent.");
        }

        boolean newEnabled = Boolean.TRUE.equals(request.getEnabled());
        patient.setTelemetryEnabled(newEnabled);

        if (newEnabled) {
            patient.setTelemetryConsentAt(LocalDateTime.now());
            patient.setTelemetrySharingConsent(request.getShareWithCaretaker() != null ? request.getShareWithCaretaker() : true);
            patient.setTelemetryFrequencyMinutes(request.getFrequencyMinutes() != null ? request.getFrequencyMinutes() : 30);
        } else {
            patient.setTelemetrySharingConsent(false);
        }

        User updated = userRepository.save(patient);

        // Audit Event
        String action = newEnabled ? "TELEMETRY_OPT_IN" : "TELEMETRY_OPT_OUT";
        String description = "Patient " + updated.getFullName() + " explicitly " +
                (newEnabled ? "enabled real-time vital telemetry tracking with autonomous consent." : "disabled health telemetry tracking per privacy preference.");
        auditLedgerService.logEvent(action, description, updated.getFullName(), updated.getFullName(), "INFO");

        // Real-time broadcast so caretaker and patient views update live
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("TELEMETRY_CONSENT_CHANGED", updated);
        }

        return getTelemetryStatus(updated.getId(), authenticatedUsername);
    }

    /**
     * Record a new Telemetry reading.
     * Rejects ingestion if patient has disabled telemetry.
     */
    @Transactional
    public PatientTelemetry recordTelemetry(Long patientId, TelemetryRecordRequest request, String authenticatedUsername) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        // Strict Check: Is telemetry enabled by the patient?
        if (!Boolean.TRUE.equals(patient.getTelemetryEnabled())) {
            throw new IllegalStateException("Telemetry is currently disabled by Patient (" + patient.getFullName() +
                    "). Data recording and streaming are rejected in compliance with patient privacy consent.");
        }

        // Anomaly Evaluation
        boolean abnormal = false;
        StringBuilder warnings = new StringBuilder();

        if (request.getHeartRate() != null) {
            if (request.getHeartRate() > 115) {
                abnormal = true;
                warnings.append("Tachycardia detected (HR: ").append(request.getHeartRate()).append(" bpm); ");
            } else if (request.getHeartRate() < 52) {
                abnormal = true;
                warnings.append("Bradycardia detected (HR: ").append(request.getHeartRate()).append(" bpm); ");
            }
        }

        if (request.getSystolicBp() != null && request.getSystolicBp() > 155) {
            abnormal = true;
            warnings.append("High Systolic BP (").append(request.getSystolicBp()).append(" mmHg); ");
        }

        if (request.getOxygenSaturation() != null && request.getOxygenSaturation() < 92.0) {
            abnormal = true;
            warnings.append("Low Oxygen SpO2 (").append(request.getOxygenSaturation()).append("%); ");
        }

        if (request.getBloodGlucose() != null) {
            if (request.getBloodGlucose() > 220.0) {
                abnormal = true;
                warnings.append("Hyperglycemia detected (").append(request.getBloodGlucose()).append(" mg/dL); ");
            } else if (request.getBloodGlucose() < 65.0) {
                abnormal = true;
                warnings.append("Hypoglycemia detected (").append(request.getBloodGlucose()).append(" mg/dL); ");
            }
        }

        if (request.getBodyTemperature() != null && request.getBodyTemperature() > 101.5) {
            abnormal = true;
            warnings.append("High Fever (").append(request.getBodyTemperature()).append("°F); ");
        }

        PatientTelemetry telemetry = PatientTelemetry.builder()
                .patient(patient)
                .heartRate(request.getHeartRate() != null ? request.getHeartRate() : 74)
                .systolicBp(request.getSystolicBp() != null ? request.getSystolicBp() : 120)
                .diastolicBp(request.getDiastolicBp() != null ? request.getDiastolicBp() : 80)
                .bloodGlucose(request.getBloodGlucose() != null ? request.getBloodGlucose() : 110.0)
                .oxygenSaturation(request.getOxygenSaturation() != null ? request.getOxygenSaturation() : 98.5)
                .bodyTemperature(request.getBodyTemperature() != null ? request.getBodyTemperature() : 98.6)
                .stepCount(request.getStepCount() != null ? request.getStepCount() : 2500)
                .deviceBatteryLevel(request.getDeviceBatteryLevel() != null ? request.getDeviceBatteryLevel() : 90)
                .sensorSource(request.getSensorSource() != null ? request.getSensorSource() : "Patient BLE Smart Health Band")
                .telemetryNotes(request.getTelemetryNotes())
                .deviceStatus("CONNECTED")
                .timestamp(LocalDateTime.now())
                .abnormalReading(abnormal)
                .anomalyWarning(abnormal ? warnings.toString().trim() : null)
                .build();

        PatientTelemetry saved = telemetryRepository.save(telemetry);

        // If abnormal and sharing with caretaker is permitted, raise urgent Caretaker Alert
        if (abnormal && Boolean.TRUE.equals(patient.getTelemetrySharingConsent()) && patient.getCaretaker() != null) {
            CaretakerAlert alert = CaretakerAlert.builder()
                    .patient(patient)
                    .caretaker(patient.getCaretaker())
                    .alertType("VITAL_TELEMETRY_ANOMALY")
                    .severity("CRITICAL")
                    .message("⚠️ VITAL TELEMETRY ALERT for " + patient.getFullName() + ": " + warnings.toString().trim())
                    .resolved(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            alertRepository.save(alert);

            if (sseNotificationService != null) {
                sseNotificationService.broadcast("CRITICAL_ALERT", alert);
            }

            auditLedgerService.logEvent(
                    "ABNORMAL_VITAL_TELEMETRY",
                    "Critical vital signs telemetry anomaly recorded for " + patient.getFullName() + ": " + warnings.toString().trim(),
                    "Wearable Sensor Telemetry Mesh",
                    patient.getFullName(),
                    "CRITICAL"
            );
        }

        // Real-time broadcast
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("TELEMETRY_UPDATE", saved);
        }

        return saved;
    }

    /**
     * Simulate a Live Wearable Sensor Sync for a patient.
     * Strictly blocked if patient has disabled telemetry.
     */
    @Transactional
    public PatientTelemetry simulateSensorSync(Long patientId, String authenticatedUsername) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        if (!Boolean.TRUE.equals(patient.getTelemetryEnabled())) {
            throw new IllegalStateException("Telemetry Sync Blocked: Telemetry is currently disabled by " +
                    patient.getFullName() + ". In compliance with clinical governance, patient must self-enable telemetry first.");
        }

        // Generate standard healthy or slightly varied elder vitals
        int hr = 68 + random.nextInt(18); // 68 - 85 bpm
        int sys = 118 + random.nextInt(16); // 118 - 133 mmHg
        int dia = 74 + random.nextInt(12); // 74 - 85 mmHg
        double spo2 = Math.round((97.2 + (random.nextDouble() * 2.3)) * 10.0) / 10.0; // 97.2 - 99.5%
        double glucose = Math.round((95.0 + (random.nextDouble() * 30.0)) * 10.0) / 10.0; // 95 - 125 mg/dL
        double temp = Math.round((98.2 + (random.nextDouble() * 0.8)) * 10.0) / 10.0; // 98.2 - 99.0°F
        int steps = 1800 + random.nextInt(1500); // 1800 - 3300 steps
        int battery = 75 + random.nextInt(25); // 75 - 99%

        TelemetryRecordRequest req = TelemetryRecordRequest.builder()
                .heartRate(hr)
                .systolicBp(sys)
                .diastolicBp(dia)
                .oxygenSaturation(spo2)
                .bloodGlucose(glucose)
                .bodyTemperature(temp)
                .stepCount(steps)
                .deviceBatteryLevel(battery)
                .sensorSource("Patient BLE Wearable Hub")
                .telemetryNotes("Live sensor synchronization via Web Bluetooth / IoT Gateway.")
                .build();

        return recordTelemetry(patientId, req, authenticatedUsername);
    }

    /**
     * Get Telemetry History. Returns empty if disabled or unauthorized.
     */
    public List<PatientTelemetry> getTelemetryHistory(Long patientId, String authenticatedUsername) {
        User caller = userRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUsername));

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        boolean isPatientThemselves = caller.getId().equals(patient.getId());
        boolean isPrimaryCaretaker = patient.getCaretaker() != null && patient.getCaretaker().getId().equals(caller.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(caller.getRole());

        if (!Boolean.TRUE.equals(patient.getTelemetryEnabled())) {
            return Collections.emptyList();
        }

        if (!isPatientThemselves && !isAdmin) {
            if (!isPrimaryCaretaker || !Boolean.TRUE.equals(patient.getTelemetrySharingConsent())) {
                return Collections.emptyList();
            }
        }

        return telemetryRepository.findByPatientIdOrderByTimestampDesc(patientId);
    }
}
