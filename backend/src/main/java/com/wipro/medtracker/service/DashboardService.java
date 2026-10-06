package com.wipro.medtracker.service;

import com.wipro.medtracker.dto.DashboardSummaryDTO;
import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.RefillOrder;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.DoseScheduleRepository;
import com.wipro.medtracker.repository.MedicineRepository;
import com.wipro.medtracker.repository.RefillOrderRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final CaretakerAlertRepository alertRepository;
    private final com.wipro.medtracker.repository.PatientTelemetryRepository telemetryRepository;

    public DashboardSummaryDTO getDashboardSummary(String username, Long selectedPatientId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        User patient = null;
        User caretaker = null;
        User chemist = null;

        List<Medicine> medicines = Collections.emptyList();
        List<DoseSchedule> todaySchedules = Collections.emptyList();
        List<RefillOrder> activeRefills = Collections.emptyList();
        List<CaretakerAlert> recentAlerts = Collections.emptyList();

        if ("ROLE_PATIENT".equalsIgnoreCase(user.getRole())) {
            patient = user;
            caretaker = user.getCaretaker();
            chemist = user.getChemist();

            medicines = medicineRepository.findByPatientId(user.getId());
            todaySchedules = doseScheduleRepository.findByPatientIdOrderByScheduledTimeAsc(user.getId());
            activeRefills = refillOrderRepository.findByPatientIdOrderByOrderDateDesc(user.getId());
            recentAlerts = alertRepository.findByPatientIdOrderByCreatedAtDesc(user.getId());

        } else if ("ROLE_CARETAKER".equalsIgnoreCase(user.getRole())) {
            caretaker = user;
            List<User> patients = userRepository.findByCaretakerId(user.getId());
            if (!patients.isEmpty()) {
                if (selectedPatientId != null) {
                    patient = patients.stream()
                            .filter(p -> p.getId().equals(selectedPatientId))
                            .findFirst()
                            .orElse(patients.get(0));
                } else {
                    patient = patients.get(0);
                }
                chemist = patient.getChemist();
                medicines = medicineRepository.findByPatientId(patient.getId());
                todaySchedules = doseScheduleRepository.findByPatientIdOrderByScheduledTimeAsc(patient.getId());
                activeRefills = refillOrderRepository.findByPatientIdOrderByOrderDateDesc(patient.getId());
            } else {
                medicines = medicineRepository.findAll();
                todaySchedules = doseScheduleRepository.findAll();
                activeRefills = refillOrderRepository.findAll();
            }
            recentAlerts = alertRepository.findByCaretakerIdOrderByCreatedAtDesc(user.getId());

        } else if ("ROLE_CHEMIST".equalsIgnoreCase(user.getRole())) {
            chemist = user;
            List<User> patients = userRepository.findByChemistId(user.getId());
            if (patients.isEmpty()) {
                patients = userRepository.findByRole("ROLE_PATIENT");
            }
            if (!patients.isEmpty()) {
                if (selectedPatientId != null) {
                    patient = patients.stream()
                            .filter(p -> p.getId().equals(selectedPatientId))
                            .findFirst()
                            .orElse(patients.get(0));
                } else {
                    patient = patients.get(0);
                }
            }
            activeRefills = refillOrderRepository.findByChemistIdOrderByOrderDateDesc(user.getId());
            if (activeRefills.isEmpty()) {
                activeRefills = refillOrderRepository.findAll();
            }
            medicines = patient != null ? medicineRepository.findByPatientId(patient.getId()) : medicineRepository.findAll();
            todaySchedules = patient != null ? doseScheduleRepository.findByPatientIdOrderByScheduledTimeAsc(patient.getId()) : Collections.emptyList();
            recentAlerts = alertRepository.findAllByOrderByCreatedAtDesc();
        }

        int totalDoses = todaySchedules.size();
        int taken = (int) todaySchedules.stream().filter(s -> "TAKEN".equalsIgnoreCase(s.getStatus())).count();
        int missed = (int) todaySchedules.stream().filter(s -> "MISSED".equalsIgnoreCase(s.getStatus())).count();
        int pending = totalDoses - taken - missed;

        double adherenceRate = (totalDoses > 0)
                ? Math.round(((double) taken / totalDoses) * 1000.0) / 10.0
                : 100.0;

        int lowStockCount = (int) medicines.stream()
                .filter(m -> m.getRemainingTablets() <= MedicineService.LOW_STOCK_THRESHOLD)
                .count();

        int unreadAlerts = (int) recentAlerts.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getResolved()))
                .count();

        int pendingRefills = (int) activeRefills.stream()
                .filter(r -> !"DELIVERED".equalsIgnoreCase(r.getOrderStatus()) && !"CANCELLED".equalsIgnoreCase(r.getOrderStatus()))
                .count();

        // Clinical Governance: Only expose telemetry if enabled by the patient themselves
        Boolean isTelemetryEnabled = patient != null && Boolean.TRUE.equals(patient.getTelemetryEnabled());
        com.wipro.medtracker.entity.PatientTelemetry latestTelem = null;
        if (isTelemetryEnabled) {
            boolean isPatientThemselves = user.getId().equals(patient.getId());
            boolean canCaretakerView = Boolean.TRUE.equals(patient.getTelemetrySharingConsent());
            if (isPatientThemselves || canCaretakerView || "ROLE_ADMIN".equalsIgnoreCase(user.getRole())) {
                latestTelem = telemetryRepository.findFirstByPatientIdOrderByTimestampDesc(patient.getId()).orElse(null);
            }
        }

        return DashboardSummaryDTO.builder()
                .role(user.getRole())
                .currentUser(user)
                .linkedPatient(patient)
                .linkedCaretaker(caretaker)
                .linkedChemist(chemist)
                .adherenceRate(adherenceRate)
                .totalMedicines(medicines.size())
                .totalDosesToday(totalDoses)
                .dosesTakenToday(taken)
                .dosesPendingToday(pending)
                .dosesMissedToday(missed)
                .lowStockMedicinesCount(lowStockCount)
                .pendingRefillsCount(pendingRefills)
                .unreadAlertsCount(unreadAlerts)
                .telemetryEnabled(isTelemetryEnabled)
                .latestTelemetry(latestTelem)
                .todaySchedules(todaySchedules)
                .medicines(medicines)
                .activeRefillOrders(activeRefills)
                .recentAlerts(recentAlerts)
                .build();
    }
}
