package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.DoseScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoseScheduleService {

    private final DoseScheduleRepository doseScheduleRepository;
    private final MedicineService medicineService;
    private final CaretakerAlertRepository alertRepository;
    private final SseNotificationService sseNotificationService;

    public List<DoseSchedule> getSchedulesByPatient(Long patientId) {
        return doseScheduleRepository.findByPatientIdOrderByScheduledTimeAsc(patientId);
    }

    public List<DoseSchedule> getAllSchedules() {
        return doseScheduleRepository.findAll();
    }

    public DoseSchedule getScheduleById(Long id) {
        return doseScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dose schedule not found with id: " + id));
    }

    @Transactional
    public DoseSchedule markDoseTaken(Long scheduleId) {
        DoseSchedule schedule = doseScheduleRepository.findByIdWithPessimisticLock(scheduleId)
                .orElseGet(() -> getScheduleById(scheduleId));
        schedule.setStatus("TAKEN");
        schedule.setTakenAt(LocalDateTime.now());

        // Decrement physical medicine stock & trigger auto-refill if low
        Medicine medicine = schedule.getMedicine();
        if (medicine != null) {
            medicineService.decrementStockOnDoseTaken(medicine);
        }

        DoseSchedule saved = doseScheduleRepository.save(schedule);
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("DOSE_TAKEN", saved);
            sseNotificationService.broadcast("AUDIT_EVENT", saved);
        }
        return saved;
    }

    @Transactional
    public DoseSchedule markDoseMissed(Long scheduleId) {
        DoseSchedule schedule = getScheduleById(scheduleId);
        schedule.setStatus("MISSED");
        schedule.setAlertSentToCaretaker(true);

        User patient = schedule.getPatient();
        Medicine medicine = schedule.getMedicine();
        User caretaker = patient != null ? patient.getCaretaker() : null;

        if (caretaker != null && patient != null && medicine != null) {
            boolean isCritical = medicine.getEmergencyPurpose() != null &&
                    (medicine.getEmergencyPurpose().toLowerCase().contains("sugar") ||
                     medicine.getEmergencyPurpose().toLowerCase().contains("blood") ||
                     medicine.getEmergencyPurpose().toLowerCase().contains("hyper") ||
                     medicine.getEmergencyPurpose().toLowerCase().contains("heart"));

            CaretakerAlert alert = CaretakerAlert.builder()
                    .patient(patient)
                    .caretaker(caretaker)
                    .medicine(medicine)
                    .alertType("MISSED_DOSE")
                    .severity(isCritical ? "CRITICAL" : "HIGH")
                    .message(String.format("CRITICAL ADHERENCE ALERT: %s missed their %s dose of %s (%s) scheduled at %s. 90-min duration window expired!",
                            patient.getFullName(),
                            schedule.getScheduledSlot(),
                            medicine.getName(),
                            medicine.getDosage(),
                            schedule.getScheduledTime().toString()))
                    .resolved(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            CaretakerAlert savedAlert = alertRepository.save(alert);
            if (sseNotificationService != null) {
                sseNotificationService.broadcast("CRITICAL_ALERT", savedAlert);
            }
        }

        return doseScheduleRepository.save(schedule);
    }

    @Transactional
    public void resetSchedulesForDemo(Long patientId) {
        List<DoseSchedule> schedules = doseScheduleRepository.findByPatientId(patientId);
        for (int i = 0; i < schedules.size(); i++) {
            DoseSchedule s = schedules.get(i);
            if (i == 0 || i == 1) {
                s.setStatus("TAKEN");
                s.setTakenAt(LocalDateTime.now().minusHours(4));
            } else {
                s.setStatus("PENDING");
                s.setTakenAt(null);
            }
            s.setAlertSentToCaretaker(false);
            doseScheduleRepository.save(s);
        }
    }
}
