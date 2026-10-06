package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final CaretakerAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final SseNotificationService sseNotificationService;

    public List<CaretakerAlert> getAlertsByCaretaker(Long caretakerId) {
        return alertRepository.findByCaretakerIdOrderByCreatedAtDesc(caretakerId);
    }

    public List<CaretakerAlert> getAlertsByPatient(Long patientId) {
        return alertRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<CaretakerAlert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public CaretakerAlert markResolved(Long alertId) {
        return markResolved(alertId, null, null);
    }

    @Transactional
    public CaretakerAlert markResolved(Long alertId, String notes, String resolvedBy) {
        CaretakerAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + alertId));
        alert.setResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        if (notes != null && !notes.isBlank()) {
            alert.setResolutionNotes(notes);
        } else {
            alert.setResolutionNotes("Resolved by caretaker intervention.");
        }
        if (resolvedBy != null && !resolvedBy.isBlank()) {
            alert.setResolvedBy(resolvedBy);
        }
        CaretakerAlert saved = alertRepository.save(alert);
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("ALERT_RESOLVED", saved);
        }
        return saved;
    }

    @Transactional
    public CaretakerAlert triggerEmergencySos(Long patientId, String reason) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        User caretaker = patient.getCaretaker();
        if (caretaker == null) {
            List<User> caretakers = userRepository.findByRole("ROLE_CARETAKER");
            if (!caretakers.isEmpty()) {
                caretaker = caretakers.get(0);
            } else {
                caretaker = patient;
            }
        }

        String alertMessage = (reason != null && !reason.isBlank())
                ? "EMERGENCY SOS TRIGGERED by " + patient.getFullName() + ": " + reason
                : "EMERGENCY SOS TRIGGERED: " + patient.getFullName() + " activated the 1-touch emergency assistance button. Immediate caretaker response required!";

        CaretakerAlert alert = CaretakerAlert.builder()
                .patient(patient)
                .caretaker(caretaker)
                .alertType("EMERGENCY_SOS")
                .severity("CRITICAL")
                .message(alertMessage)
                .resolved(false)
                .createdAt(LocalDateTime.now())
                .build();

        CaretakerAlert saved = alertRepository.save(alert);
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("CRITICAL_ALERT", saved);
        }
        return saved;
    }
}
