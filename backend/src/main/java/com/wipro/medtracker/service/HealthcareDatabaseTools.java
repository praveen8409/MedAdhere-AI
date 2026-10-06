package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.DoseScheduleRepository;
import com.wipro.medtracker.repository.MedicineRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * ENGINE 1: SPRING AI HEALTHCARE DATABASE TOOLS (Internal Truth Grounding)
 * Provides @Tool-annotated methods invoked automatically by the clinical reasoning engine
 * or LLM for live user-specific healthcare facts.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HealthcareDatabaseTools {

    private final MedicineRepository medicineRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final UserRepository userRepository;

    /**
     * a) getPatientPrescriptionSummary(Long patientId)
     * Returns current active medicines, dosages, instructions, in-box tablet counts,
     * course duration, and days completed.
     */
    @Tool(description = "Returns current active medicines, dosages, instructions, in-box tablet counts, course duration, and days completed for a patient.")
    public Map<String, Object> getPatientPrescriptionSummary(Long patientId) {
        Map<String, Object> summary = new LinkedHashMap<>();
        if (patientId == null) {
            patientId = 7L; // Default fallback to Ramesh Sharma
        }

        Optional<User> patientOpt = userRepository.findById(patientId);
        if (patientOpt.isEmpty()) {
            summary.put("error", "Patient not found with ID: " + patientId);
            return summary;
        }

        User patient = patientOpt.get();
        summary.put("patientId", patient.getId());
        summary.put("patientName", patient.getFullName());
        summary.put("age", patient.getAge());
        summary.put("chronicConditions", patient.getChronicConditions());

        List<Medicine> medicines = medicineRepository.findByPatientId(patientId);
        List<Map<String, Object>> medicineList = new ArrayList<>();

        for (Medicine m : medicines) {
            Map<String, Object> med = new LinkedHashMap<>();
            med.put("medicineId", m.getId());
            med.put("name", m.getName());
            med.put("dosage", m.getDosage());
            med.put("instructions", m.getInstructions() != null ? m.getInstructions() : "With water as prescribed");
            med.put("dailyDoseCount", m.getDailyDoseCount());
            med.put("remainingTablets", m.getRemainingTablets());
            med.put("totalCourseDays", m.getTotalCourseDays());
            med.put("daysCompleted", m.getDaysCompleted());

            int daily = Math.max(1, m.getDailyDoseCount());
            int daysSupplyLeft = m.getRemainingTablets() / daily;
            int courseDaysRemaining = Math.max(0, m.getTotalCourseDays() - m.getDaysCompleted());

            med.put("daysSupplyLeft", daysSupplyLeft);
            med.put("courseDaysRemaining", courseDaysRemaining);
            med.put("isLowStock", daysSupplyLeft <= 5);
            med.put("emergencyPurpose", m.getEmergencyPurpose());

            medicineList.add(med);
        }

        summary.put("medicines", medicineList);
        summary.put("activePrescriptionCount", medicineList.size());
        return summary;
    }

    /**
     * b) getTodayDoseSchedule(Long patientId)
     * Returns morning, afternoon, and night slots with current statuses (PENDING, TAKEN, MISSED).
     */
    @Tool(description = "Returns morning, afternoon, and night slots with current statuses (PENDING, TAKEN, MISSED) for today.")
    public Map<String, Object> getTodayDoseSchedule(Long patientId) {
        Map<String, Object> scheduleMap = new LinkedHashMap<>();
        if (patientId == null) {
            patientId = 7L;
        }

        List<DoseSchedule> schedules = doseScheduleRepository.findByPatientIdOrderByScheduledTimeAsc(patientId);
        List<Map<String, Object>> slots = new ArrayList<>();

        long takenCount = 0;
        long missedCount = 0;
        long pendingCount = 0;

        for (DoseSchedule s : schedules) {
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("scheduleId", s.getId());
            slot.put("slot", s.getScheduledSlot());
            slot.put("time", s.getScheduledTime().toString());
            slot.put("status", s.getStatus());
            slot.put("takenAt", s.getTakenAt() != null ? s.getTakenAt().toString() : null);

            Medicine m = s.getMedicine();
            if (m != null) {
                slot.put("medicineName", m.getName());
                slot.put("dosage", m.getDosage());
                slot.put("instructions", m.getInstructions());
                slot.put("remainingTablets", m.getRemainingTablets());
            }

            if ("TAKEN".equalsIgnoreCase(s.getStatus())) {
                takenCount++;
            } else if ("MISSED".equalsIgnoreCase(s.getStatus())) {
                missedCount++;
            } else {
                pendingCount++;
            }

            slots.add(slot);
        }

        scheduleMap.put("patientId", patientId);
        scheduleMap.put("slots", slots);
        scheduleMap.put("totalSchedulesToday", slots.size());
        scheduleMap.put("takenToday", takenCount);
        scheduleMap.put("missedToday", missedCount);
        scheduleMap.put("pendingToday", pendingCount);

        return scheduleMap;
    }

    /**
     * c) getCaretakerAndChemistContacts(Long patientId)
     * Returns primary caretaker name, phone, and bound pharmacy details.
     */
    @Tool(description = "Returns primary caretaker name, phone, and bound pharmacy details for a patient.")
    public Map<String, Object> getCaretakerAndChemistContacts(Long patientId) {
        Map<String, Object> contacts = new LinkedHashMap<>();
        if (patientId == null) {
            patientId = 7L;
        }

        Optional<User> patientOpt = userRepository.findById(patientId);
        if (patientOpt.isEmpty()) {
            contacts.put("error", "Patient not found with ID: " + patientId);
            return contacts;
        }

        User patient = patientOpt.get();
        contacts.put("patientId", patient.getId());
        contacts.put("patientName", patient.getFullName());
        contacts.put("emergencyContact", patient.getEmergencyContact() != null ? patient.getEmergencyContact() : "108 / 911");

        User caretaker = patient.getCaretaker();
        if (caretaker != null) {
            contacts.put("caretakerName", caretaker.getFullName());
            contacts.put("caretakerPhone", caretaker.getPhoneNumber());
            contacts.put("caretakerDesignation", caretaker.getDesignation());
            contacts.put("caretakerAddress", caretaker.getAddress());
        } else {
            contacts.put("caretakerName", "Dr. Ananya Sharma");
            contacts.put("caretakerPhone", "+91 98111-22334");
            contacts.put("caretakerDesignation", "Primary Family Caretaker");
        }

        User chemist = patient.getChemist();
        if (chemist != null) {
            contacts.put("chemistName", chemist.getFullName());
            contacts.put("chemistPhone", chemist.getPhoneNumber());
            contacts.put("chemistAddress", chemist.getAddress());
            contacts.put("chemistLicense", chemist.getLicenseNumber());
        } else {
            contacts.put("chemistName", "Apollo Pharmacy Main Market");
            contacts.put("chemistPhone", "+91 98765-43210");
            contacts.put("chemistAddress", "Shop 12, Main Market, Indiranagar, Bangalore");
        }

        return contacts;
    }

    /**
     * d) getCaretakerAdherenceStats(Long caretakerId)
     * For caretaker users, aggregates compliance percentage and missed-dose count across linked dependents.
     */
    @Tool(description = "For caretaker users, aggregates compliance percentage and missed-dose count across linked dependents.")
    public Map<String, Object> getCaretakerAdherenceStats(Long caretakerId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        if (caretakerId == null) {
            caretakerId = 2L; // Default Ananya
        }

        List<User> dependents = userRepository.findByCaretakerId(caretakerId);
        List<Map<String, Object>> patientSummaries = new ArrayList<>();

        long totalScheduledAll = 0;
        long totalTakenAll = 0;
        long totalMissedAll = 0;

        for (User dep : dependents) {
            Map<String, Object> pSum = new LinkedHashMap<>();
            pSum.put("patientId", dep.getId());
            pSum.put("patientName", dep.getFullName());
            pSum.put("age", dep.getAge());

            List<DoseSchedule> schedules = doseScheduleRepository.findByPatientId(dep.getId());
            long taken = schedules.stream().filter(s -> "TAKEN".equalsIgnoreCase(s.getStatus())).count();
            long missed = schedules.stream().filter(s -> "MISSED".equalsIgnoreCase(s.getStatus())).count();
            long total = schedules.size();

            totalScheduledAll += total;
            totalTakenAll += taken;
            totalMissedAll += missed;

            double adherenceRate = total > 0 ? ((double) taken / total) * 100.0 : 100.0;
            pSum.put("totalSchedules", total);
            pSum.put("takenCount", taken);
            pSum.put("missedCount", missed);
            pSum.put("adherenceRate", Math.round(adherenceRate * 10.0) / 10.0);

            // Check if any medication is running low
            List<Medicine> meds = medicineRepository.findByPatientId(dep.getId());
            List<String> lowMeds = new ArrayList<>();
            for (Medicine m : meds) {
                int daily = Math.max(1, m.getDailyDoseCount());
                int days = m.getRemainingTablets() / daily;
                if (days <= 5) {
                    lowMeds.add(m.getName() + " (" + m.getRemainingTablets() + " tabs left, ~" + days + " days)");
                }
            }
            pSum.put("lowStockMedicines", lowMeds);
            patientSummaries.add(pSum);
        }

        double overallAdherence = totalScheduledAll > 0
                ? ((double) totalTakenAll / totalScheduledAll) * 100.0
                : 100.0;

        stats.put("caretakerId", caretakerId);
        stats.put("dependentsCount", dependents.size());
        stats.put("totalSchedulesAcrossAll", totalScheduledAll);
        stats.put("totalTakenAcrossAll", totalTakenAll);
        stats.put("totalMissedAcrossAll", totalMissedAll);
        stats.put("overallAdherenceRate", Math.round(overallAdherence * 10.0) / 10.0);
        stats.put("dependents", patientSummaries);

        return stats;
    }
}
