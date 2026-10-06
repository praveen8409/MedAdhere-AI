package com.wipro.medtracker.controller;

import com.wipro.medtracker.dto.TelemetryConsentRequest;
import com.wipro.medtracker.dto.TelemetryRecordRequest;
import com.wipro.medtracker.dto.TelemetryStatusResponse;
import com.wipro.medtracker.entity.PatientTelemetry;
import com.wipro.medtracker.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
@Slf4j
public class TelemetryController {

    private final TelemetryService telemetryService;

    /**
     * Get patient telemetry status and current readings.
     */
    @GetMapping("/status")
    public ResponseEntity<TelemetryStatusResponse> getMyTelemetryStatus(Authentication auth) {
        return ResponseEntity.ok(telemetryService.getTelemetryStatus(null, auth.getName()));
    }

    @GetMapping("/status/{patientId}")
    public ResponseEntity<TelemetryStatusResponse> getPatientTelemetryStatus(
            @PathVariable Long patientId,
            Authentication auth) {
        return ResponseEntity.ok(telemetryService.getTelemetryStatus(patientId, auth.getName()));
    }

    /**
     * CLINICAL GOVERNANCE REQUIREMENT:
     * ONLY the Patient themselves can update their telemetry opt-in consent and settings.
     */
    @PostMapping("/consent")
    @PreAuthorize("hasRole('ROLE_PATIENT')")
    public ResponseEntity<?> updateConsent(
            @RequestBody TelemetryConsentRequest request,
            Authentication auth) {
        try {
            TelemetryStatusResponse response = telemetryService.updatePatientConsent(null, request, auth.getName());
            return ResponseEntity.ok(response);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/consent/{patientId}")
    @PreAuthorize("hasRole('ROLE_PATIENT')")
    public ResponseEntity<?> updateConsentForPatient(
            @PathVariable Long patientId,
            @RequestBody TelemetryConsentRequest request,
            Authentication auth) {
        try {
            TelemetryStatusResponse response = telemetryService.updatePatientConsent(patientId, request, auth.getName());
            return ResponseEntity.ok(response);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Record a telemetry reading (e.g. from IoT device / Wearable / App sync).
     * Strictly rejected if patient has disabled telemetry.
     */
    @PostMapping("/record/{patientId}")
    public ResponseEntity<?> recordTelemetry(
            @PathVariable Long patientId,
            @RequestBody TelemetryRecordRequest request,
            Authentication auth) {
        try {
            PatientTelemetry saved = telemetryService.recordTelemetry(patientId, request, auth.getName());
            return ResponseEntity.ok(saved);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(403).body(Map.of("error", ise.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Trigger a live sensor sync reading.
     * Strictly rejected if patient has disabled telemetry.
     */
    @PostMapping("/sync/{patientId}")
    public ResponseEntity<?> simulateSensorSync(
            @PathVariable Long patientId,
            Authentication auth) {
        try {
            PatientTelemetry synced = telemetryService.simulateSensorSync(patientId, auth.getName());
            return ResponseEntity.ok(synced);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(403).body(Map.of("error", ise.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Get historical telemetry records.
     */
    @GetMapping("/history/{patientId}")
    public ResponseEntity<List<PatientTelemetry>> getTelemetryHistory(
            @PathVariable Long patientId,
            Authentication auth) {
        return ResponseEntity.ok(telemetryService.getTelemetryHistory(patientId, auth.getName()));
    }
}
