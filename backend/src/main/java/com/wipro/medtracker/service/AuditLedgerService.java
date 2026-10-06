package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.*;
import com.wipro.medtracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLedgerService {

    private final AuditLogRepository auditLogRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final MedicineRepository medicineRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final CaretakerAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final SseNotificationService sseNotificationService;

    public void logEvent(String eventType, String description, String actor, String patientName, String severity) {
        AuditLog log = AuditLog.builder()
                .eventType(eventType)
                .description(description)
                .actor(actor)
                .patientName(patientName)
                .severity(severity != null ? severity : "INFO")
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);

        // Real-time SSE Broadcast to connected clients
        sseNotificationService.broadcast("AUDIT_EVENT", log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    // Chaos Simulator 1: Simulate 90-Minute Missed Dose
    @Transactional
    public Map<String, Object> simulateMissedDose() {
        User patient = userRepository.findByUsername("ramesh_patient").orElse(null);
        User caretaker = patient != null ? patient.getCaretaker() : null;

        if (patient == null) {
            return Map.of("status", "ERROR", "message", "Ramesh patient record not found");
        }

        // Find an uncompleted schedule
        List<DoseSchedule> schedules = doseScheduleRepository.findByPatientId(patient.getId());
        DoseSchedule target = schedules.stream()
                .filter(s -> !"TAKEN".equalsIgnoreCase(s.getStatus()))
                .findFirst()
                .orElse(schedules.isEmpty() ? null : schedules.get(schedules.size() - 1));

        if (target != null) {
            target.setStatus("MISSED");
            target.setAlertSentToCaretaker(true);
            doseScheduleRepository.save(target);

            String medicineName = target.getMedicine() != null ? target.getMedicine().getName() : "BP Medication";
            String msg = String.format("CRITICAL ALERT: %s has missed his %s medication (%s) by over 90 minutes. Tap to call Dadaji now.",
                    patient.getFullName(), target.getScheduledSlot(), medicineName);

            CaretakerAlert alert = CaretakerAlert.builder()
                    .patient(patient)
                    .caretaker(caretaker)
                    .medicine(target.getMedicine())
                    .alertType("MISSED_DOSE")
                    .severity("CRITICAL")
                    .message(msg)
                    .resolved(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            alertRepository.save(alert);

            logEvent("MISSED_DOSE_ESCALATED", msg, "SYSTEM_DEAD_MAN_TIMER", patient.getFullName(), "CRITICAL");
            sseNotificationService.broadcast("CRITICAL_ALERT", alert);

            return Map.of(
                    "status", "SUCCESS",
                    "scenario", "90-Min Dead-Man's Timer Triggered",
                    "escalatedDose", target.getScheduledSlot() + " (" + medicineName + ")",
                    "alertMessage", msg
            );
        }

        return Map.of("status", "ERROR", "message", "No dose schedule available to mark missed");
    }

    // Chaos Simulator 2: Simulate Low Stock & Auto-Refill Dispatch
    @Transactional
    public Map<String, Object> simulateLowStock() {
        User patient = userRepository.findByUsername("ramesh_patient").orElse(null);
        if (patient == null) return Map.of("status", "ERROR");

        List<Medicine> medicines = medicineRepository.findByPatientId(patient.getId());
        Medicine metformin = medicines.stream()
                .filter(m -> m.getName().toLowerCase().contains("metformin"))
                .findFirst()
                .orElse(medicines.isEmpty() ? null : medicines.get(0));

        if (metformin != null) {
            metformin.setRemainingTablets(5); // 5 tablets / 2 daily = 2.5 days <= 5 days safety threshold!
            metformin.setAutoRefillTriggered(true);
            medicineRepository.save(metformin);

            // Trigger order to Apollo Pharmacy
            User chemist = patient.getChemist();
            RefillOrder order = RefillOrder.builder()
                    .medicine(metformin)
                    .patient(patient)
                    .chemist(chemist)
                    .quantity(30)
                    .orderStatus("REQUESTED")
                    .urgencyLevel("URGENT_CRITICAL")
                    .trackingNotes("Burn-Rate Engine Triggered: 5 tablets / 2 daily = 2.5 days supply <= 5 days safety limit.")
                    .orderDate(LocalDateTime.now())
                    .build();
            refillOrderRepository.save(order);

            String logMsg = String.format("Burn-Rate Trigger: %s stock dropped to 5 tabs (2.5 days supply <= 5). Auto-refill order #%d dispatched to %s.",
                    metformin.getName(), order.getId(), chemist != null ? chemist.getFullName() : "Apollo Pharmacy");
            logEvent("REFILL_REQUESTED", logMsg, "BURN_RATE_ENGINE", patient.getFullName(), "WARNING");

            return Map.of(
                    "status", "SUCCESS",
                    "scenario", "Burn-Rate Threshold Breach (2.5 Days <= 5 Days)",
                    "medicine", metformin.getName(),
                    "remainingTablets", 5,
                    "orderId", order.getId()
            );
        }

        return Map.of("status", "ERROR", "message", "Metformin not found");
    }

    // Chaos Simulator 3: Simulate Emergency SOS
    @Transactional
    public Map<String, Object> simulateEmergencySos() {
        User patient = userRepository.findByUsername("ramesh_patient").orElse(null);
        User caretaker = patient != null ? patient.getCaretaker() : null;
        if (patient == null) return Map.of("status", "ERROR");

        String msg = "EMERGENCY SOS: Ramesh Sharma activated 1-touch panic beacon. Severe dizziness / blood pressure anomaly suspected!";
        CaretakerAlert alert = CaretakerAlert.builder()
                .patient(patient)
                .caretaker(caretaker)
                .alertType("EMERGENCY_SOS")
                .severity("CRITICAL")
                .message(msg)
                .resolved(false)
                .createdAt(LocalDateTime.now())
                .build();
        alertRepository.save(alert);

        logEvent("EMERGENCY_SOS", msg, "PATIENT_BEACON", patient.getFullName(), "CRITICAL");
        sseNotificationService.broadcast("EMERGENCY_SOS", alert);

        return Map.of(
                "status", "SUCCESS",
                "scenario", "Emergency SOS Beacon Broadcasted",
                "message", msg
        );
    }

    // Chaos Simulator 4: Reset Scenario to Baseline
    @Transactional
    public Map<String, Object> resetScenario() {
        User patient = userRepository.findByUsername("ramesh_patient").orElse(null);
        if (patient != null) {
            List<Medicine> medicines = medicineRepository.findByPatientId(patient.getId());
            for (Medicine m : medicines) {
                if (m.getName().toLowerCase().contains("metformin")) {
                    m.setRemainingTablets(6);
                    m.setAutoRefillTriggered(false);
                    m.setDaysCompleted(42);
                    m.setTotalCourseDays(90);
                } else if (m.getName().toLowerCase().contains("telma")) {
                    m.setRemainingTablets(24);
                    m.setDaysCompleted(42);
                    m.setTotalCourseDays(90);
                }
                medicineRepository.save(m);
            }

            List<DoseSchedule> schedules = doseScheduleRepository.findByPatientId(patient.getId());
            for (int i = 0; i < schedules.size(); i++) {
                DoseSchedule s = schedules.get(i);
                if (i == 0) {
                    s.setStatus("TAKEN");
                    s.setTakenAt(LocalDateTime.now().withHour(8).withMinute(4));
                } else {
                    s.setStatus("PENDING");
                    s.setTakenAt(null);
                }
                s.setAlertSentToCaretaker(false);
                doseScheduleRepository.save(s);
            }

            logEvent("SCENARIO_RESET", "Demonstration state restored to Day 2 Baseline.", "ADMIN", patient.getFullName(), "INFO");
        }

        return Map.of("status", "SUCCESS", "message", "Clinical scenario restored to Day 2 baseline.");
    }
}
