package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.AuditLog;
import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.AuditLogRepository;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.DoseScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DoseMonitoringWorker {

    private final DoseScheduleRepository doseScheduleRepository;
    private final CaretakerAlertRepository alertRepository;
    private final AuditLogRepository auditLogRepository;
    private final SseNotificationService sseNotificationService;

    /**
     * Autonomous Evaluation Worker (Lifecycle 3):
     * Evaluates all PENDING schedules where alertSentToCaretaker is false.
     * If scheduled_time + 90 minutes < Current Time, marks MISSED,
     * logs CRITICAL audit entry, and escalates to Caretaker via SSE.
     */
    @Scheduled(fixedRate = 30000) // Runs every 30 seconds
    @Transactional
    public void evaluateMissedDosesCron() {
        evaluateMissedDoses();
    }

    @Transactional
    public int evaluateMissedDoses() {
        List<DoseSchedule> pendingSchedules = doseScheduleRepository.findByStatusAndAlertSentToCaretakerFalse("PENDING");
        LocalTime now = LocalTime.now();
        int missedCount = 0;

        for (DoseSchedule schedule : pendingSchedules) {
            LocalTime scheduledTime = schedule.getScheduledTime();
            if (scheduledTime == null) continue;

            LocalTime deadline = scheduledTime.plusMinutes(90);
            boolean isPast90MinWindow;
            if (deadline.isAfter(scheduledTime)) {
                isPast90MinWindow = now.isAfter(deadline);
            } else {
                // Wrapped past midnight
                isPast90MinWindow = now.isAfter(deadline) && now.isBefore(scheduledTime);
            }

            if (isPast90MinWindow) {
                schedule.setStatus("MISSED");
                schedule.setAlertSentToCaretaker(true);
                doseScheduleRepository.save(schedule);

                User patient = schedule.getPatient();
                Medicine medicine = schedule.getMedicine();
                User caretaker = (patient != null) ? patient.getCaretaker() : null;

                String patientName = (patient != null) ? patient.getFullName() : "Patient";
                String medName = (medicine != null) ? medicine.getName() : "Prescribed Medication";
                String medDosage = (medicine != null && medicine.getDosage() != null) ? medicine.getDosage() : "";
                String alertMsg = String.format("CRITICAL: %s has missed scheduled medication (%s %s) due at %s by over 90 minutes!",
                        patientName, medName, medDosage, scheduledTime.toString());

                if (caretaker != null) {
                    CaretakerAlert alert = CaretakerAlert.builder()
                            .patient(patient)
                            .caretaker(caretaker)
                            .medicine(medicine)
                            .alertType("MISSED_DOSE")
                            .severity("CRITICAL")
                            .message(alertMsg)
                            .resolved(false)
                            .createdAt(LocalDateTime.now())
                            .build();

                    CaretakerAlert savedAlert = alertRepository.save(alert);

                    // Push high-priority SSE to Caretaker session
                    if (sseNotificationService != null) {
                        sseNotificationService.broadcast("DOSE_MISSED", savedAlert);
                        sseNotificationService.broadcast("CRITICAL_ALERT", savedAlert);
                    }
                }

                // Write immutable transaction ledger entry
                auditLogRepository.save(AuditLog.builder()
                        .eventType("MISSED_DOSE_ESCALATION")
                        .actor("SYSTEM_TELEMETRY")
                        .patientName(patientName)
                        .severity("CRITICAL")
                        .description(alertMsg)
                        .timestamp(LocalDateTime.now())
                        .build());

                log.warn("Missed dose escalation dispatched for patient: {} - med: {}", patientName, medName);
                missedCount++;
            }
        }

        return missedCount;
    }
}
