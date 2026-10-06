package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<CaretakerAlert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    @GetMapping("/caretaker/{caretakerId}")
    public ResponseEntity<List<CaretakerAlert>> getAlertsByCaretaker(@PathVariable Long caretakerId) {
        return ResponseEntity.ok(alertService.getAlertsByCaretaker(caretakerId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<CaretakerAlert>> getAlertsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(alertService.getAlertsByPatient(patientId));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<CaretakerAlert> resolveAlert(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        String resolvedBy = body != null ? body.get("resolvedBy") : null;
        return ResponseEntity.ok(alertService.markResolved(id, notes, resolvedBy));
    }

    @PostMapping("/sos")
    public ResponseEntity<CaretakerAlert> triggerSos(@RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.get("patientId").toString());
        String reason = body.containsKey("reason") && body.get("reason") != null ? body.get("reason").toString() : null;
        return ResponseEntity.ok(alertService.triggerEmergencySos(patientId, reason));
    }
}
