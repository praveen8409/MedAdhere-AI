package com.wipro.medtracker.service;

import com.wipro.medtracker.dto.MedicineRequest;
import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.RefillOrder;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.AuditLogRepository;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.DoseScheduleRepository;
import com.wipro.medtracker.repository.MedicineRepository;
import com.wipro.medtracker.repository.RefillOrderRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineService {

    public static final int LOW_STOCK_THRESHOLD = 5;

    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final CaretakerAlertRepository alertRepository;
    private final SseNotificationService sseNotificationService;
    private final AuditLogRepository auditLogRepository;

    public List<Medicine> getMedicinesByPatient(Long patientId) {
        return medicineRepository.findByPatientId(patientId);
    }

    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + id));
    }

    @Transactional
    public Medicine createMedicine(MedicineRequest request) {
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found: " + request.getPatientId()));

        User caretaker = null;
        if (request.getCaretakerAuthorId() != null) {
            caretaker = userRepository.findById(request.getCaretakerAuthorId()).orElse(patient.getCaretaker());
        } else {
            caretaker = patient.getCaretaker();
        }

        if (caretaker == null) {
            caretaker = patient; // Fallback self-authorized
        }

        Medicine medicine = Medicine.builder()
                .patient(patient)
                .caretakerAuthor(caretaker)
                .name(request.getName())
                .dosage(request.getDosage())
                .instructions(request.getInstructions() != null ? request.getInstructions() : "Take with water as prescribed")
                .dailyDoseCount(request.getDailyDoseCount())
                .remainingTablets(request.getRemainingTablets())
                .totalCourseDays(request.getTotalCourseDays())
                .daysCompleted(request.getDaysCompleted() != null ? request.getDaysCompleted() : 0)
                .expiryDate(request.getExpiryDate())
                .emergencyPurpose(request.getEmergencyPurpose())
                .autoRefillTriggered(false)
                .build();

        Medicine saved = medicineRepository.save(medicine);

        // Auto-generate daily dose schedules if slots were provided or default by daily count
        generateInitialSchedules(saved, request.getScheduledSlots());

        // Check if stock is immediately low
        checkAndTriggerLowStock(saved);

        return saved;
    }

    @Transactional
    public Medicine updateMedicine(Long id, MedicineRequest request) {
        Medicine medicine = getMedicineById(id);
        medicine.setName(request.getName());
        medicine.setDosage(request.getDosage());
        medicine.setInstructions(request.getInstructions());
        medicine.setDailyDoseCount(request.getDailyDoseCount());
        medicine.setRemainingTablets(request.getRemainingTablets());
        medicine.setTotalCourseDays(request.getTotalCourseDays());
        if (request.getDaysCompleted() != null) {
            medicine.setDaysCompleted(request.getDaysCompleted());
        }
        if (request.getExpiryDate() != null) {
            medicine.setExpiryDate(request.getExpiryDate());
        }
        if (request.getEmergencyPurpose() != null) {
            medicine.setEmergencyPurpose(request.getEmergencyPurpose());
        }

        if (medicine.getRemainingTablets() > LOW_STOCK_THRESHOLD) {
            medicine.setAutoRefillTriggered(false);
        } else {
            checkAndTriggerLowStock(medicine);
        }

        return medicineRepository.save(medicine);
    }

    @Transactional
    public void deleteMedicine(Long id) {
        Medicine medicine = getMedicineById(id);
        // Clean up associated schedules and refill orders if any
        List<DoseSchedule> schedules = doseScheduleRepository.findByMedicineId(id);
        doseScheduleRepository.deleteAll(schedules);
        medicineRepository.delete(medicine);
    }

    @Transactional
    public void decrementStockOnDoseTaken(Medicine medicine) {
        // Apply Pessimistic Write Lock during inventory updates
        Medicine lockedMed = medicineRepository.findByIdWithPessimisticLock(medicine.getId())
                .orElse(medicine);

        if (lockedMed.getRemainingTablets() != null && lockedMed.getRemainingTablets() > 0) {
            lockedMed.setRemainingTablets(lockedMed.getRemainingTablets() - 1);
            checkAndTriggerLowStock(lockedMed);
            medicineRepository.save(lockedMed);
        }
    }

    public void checkAndTriggerLowStock(Medicine medicine) {
        int dailyDose = (medicine.getDailyDoseCount() != null && medicine.getDailyDoseCount() > 0)
                ? medicine.getDailyDoseCount() : 1;
        int remaining = medicine.getRemainingTablets() != null ? medicine.getRemainingTablets() : 0;
        double daysRemaining = (double) remaining / dailyDose;

        // Burn-Rate Formula: Reorder threshold is 5.0 days supply
        if (daysRemaining <= 5.0 && !Boolean.TRUE.equals(medicine.getAutoRefillTriggered())) {
            medicine.setAutoRefillTriggered(true);

            User patient = medicine.getPatient();
            User chemist = (patient != null) ? patient.getChemist() : null;

            // Trigger pharmacy refill order if chemist is linked
            if (chemist != null) {
                RefillOrder refillOrder = RefillOrder.builder()
                        .medicine(medicine)
                        .patient(patient)
                        .chemist(chemist)
                        .quantity(30) // standard 30-day course pack
                        .orderStatus("REQUESTED")
                        .urgencyLevel(daysRemaining <= 2.0 ? "URGENT_CRITICAL" : "NORMAL")
                        .trackingNotes(String.format("Autonomous Low-Stock Trigger (%.1f Days Supply Left, %d units remaining)",
                                daysRemaining, remaining))
                        .orderDate(LocalDateTime.now())
                        .build();

                RefillOrder savedOrder = refillOrderRepository.save(refillOrder);

                if (sseNotificationService != null) {
                    sseNotificationService.broadcast("REFILL_REQUESTED", savedOrder);
                }
            }

            // Create low stock alert for caretaker
            User caretaker = (patient != null) ? patient.getCaretaker() : null;
            if (caretaker != null) {
                CaretakerAlert alert = CaretakerAlert.builder()
                        .patient(patient)
                        .caretaker(caretaker)
                        .medicine(medicine)
                        .alertType("CRITICAL_LOW_STOCK")
                        .severity(daysRemaining <= 2.0 ? "CRITICAL" : "HIGH")
                        .message(String.format("Low Stock Warning: %s has only %.1f days supply (%d tablets) remaining of %s (%s). Auto-refill initiated with %s.",
                                patient.getFullName(),
                                daysRemaining,
                                remaining,
                                medicine.getName(),
                                medicine.getDosage() != null ? medicine.getDosage() : "",
                                chemist != null ? chemist.getFullName() : "local chemist"))
                        .resolved(false)
                        .createdAt(LocalDateTime.now())
                        .build();

                alertRepository.save(alert);
            }
        }
    }

    private void generateInitialSchedules(Medicine medicine, List<String> slots) {
        if (slots == null || slots.isEmpty()) {
            int count = medicine.getDailyDoseCount();
            if (count == 1) {
                createScheduleEntry(medicine, "MORNING", LocalTime.of(8, 30));
            } else if (count == 2) {
                createScheduleEntry(medicine, "MORNING", LocalTime.of(8, 30));
                createScheduleEntry(medicine, "NIGHT", LocalTime.of(20, 30));
            } else {
                createScheduleEntry(medicine, "MORNING", LocalTime.of(8, 30));
                createScheduleEntry(medicine, "AFTERNOON", LocalTime.of(13, 30));
                createScheduleEntry(medicine, "NIGHT", LocalTime.of(20, 30));
            }
        } else {
            for (String slot : slots) {
                LocalTime time = switch (slot.toUpperCase()) {
                    case "MORNING" -> LocalTime.of(8, 30);
                    case "AFTERNOON" -> LocalTime.of(13, 30);
                    case "NIGHT" -> LocalTime.of(20, 30);
                    default -> LocalTime.of(12, 0);
                };
                createScheduleEntry(medicine, slot.toUpperCase(), time);
            }
        }
    }

    private void createScheduleEntry(Medicine medicine, String slot, LocalTime time) {
        DoseSchedule schedule = DoseSchedule.builder()
                .medicine(medicine)
                .patient(medicine.getPatient())
                .scheduledSlot(slot)
                .scheduledTime(time)
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build();
        doseScheduleRepository.save(schedule);
    }
}
