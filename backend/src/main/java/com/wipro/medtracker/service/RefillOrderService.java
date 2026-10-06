package com.wipro.medtracker.service;

import com.wipro.medtracker.dto.RefillOrderRequest;
import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.RefillOrder;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.repository.MedicineRepository;
import com.wipro.medtracker.repository.RefillOrderRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefillOrderService {

    private final RefillOrderRepository refillOrderRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final CaretakerAlertRepository alertRepository;
    private final SseNotificationService sseNotificationService;
    private final com.wipro.medtracker.repository.AuditLogRepository auditLogRepository;

    public List<RefillOrder> getOrdersByChemist(Long chemistId) {
        List<RefillOrder> orders = refillOrderRepository.findByChemistIdOrderByOrderDateDesc(chemistId);
        if (orders.isEmpty()) {
            return refillOrderRepository.findAll();
        }
        return orders;
    }

    public List<RefillOrder> getOrdersByPatient(Long patientId) {
        return refillOrderRepository.findByPatientIdOrderByOrderDateDesc(patientId);
    }

    public List<RefillOrder> getAllOrders() {
        return refillOrderRepository.findAll();
    }

    public RefillOrder getOrderById(Long id) {
        return refillOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Refill order not found with id: " + id));
    }

    @Transactional
    public RefillOrder createRefillOrder(RefillOrderRequest request) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + request.getMedicineId()));

        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + request.getPatientId()));

        User chemist = null;
        if (request.getChemistId() != null) {
            chemist = userRepository.findById(request.getChemistId()).orElse(patient.getChemist());
        } else {
            chemist = patient.getChemist();
        }

        if (chemist == null) {
            List<User> chemists = userRepository.findByRole("ROLE_CHEMIST");
            if (!chemists.isEmpty()) {
                chemist = chemists.get(0);
            }
        }

        RefillOrder order = RefillOrder.builder()
                .medicine(medicine)
                .patient(patient)
                .chemist(chemist)
                .quantity(request.getQuantity())
                .orderStatus("REQUESTED")
                .urgencyLevel(request.getUrgencyLevel() != null ? request.getUrgencyLevel() : "NORMAL")
                .trackingNotes(request.getTrackingNotes() != null ? request.getTrackingNotes() : "Order generated via clinical governance mesh")
                .orderDate(LocalDateTime.now())
                .build();

        RefillOrder saved = refillOrderRepository.save(order);
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("REFILL_REQUESTED", saved);
        }
        return saved;
    }

    @Transactional
    public RefillOrder dispatchOrder(Long orderId) {
        return updateOrderStatus(orderId, "DISPATCHED", "Confirmed packaging and dispatched 30-day blister strip.");
    }

    @Transactional
    public RefillOrder updateOrderStatus(Long orderId, String newStatus, String notes) {
        RefillOrder order = getOrderById(orderId);
        order.setOrderStatus(newStatus);
        if (notes != null && !notes.isBlank()) {
            order.setTrackingNotes(notes);
        }

        boolean isRestockAction = "DELIVERED".equalsIgnoreCase(newStatus) || "DISPATCHED".equalsIgnoreCase(newStatus);

        if (isRestockAction && order.getDeliveryDate() == null) {
            order.setDeliveryDate(LocalDateTime.now());

            // Apply Pessimistic Write Lock during inventory updates
            Medicine medicine = order.getMedicine();
            if (medicine != null) {
                Medicine lockedMed = medicineRepository.findByIdWithPessimisticLock(medicine.getId()).orElse(medicine);
                int currentTablets = lockedMed.getRemainingTablets() != null ? lockedMed.getRemainingTablets() : 0;
                int added = order.getQuantity() != null ? order.getQuantity() : 30;
                lockedMed.setRemainingTablets(currentTablets + added);
                lockedMed.setAutoRefillTriggered(false);
                medicineRepository.save(lockedMed);
            }

            // Notify Caretaker & Patient of delivery / dispatch completion
            User patient = order.getPatient();
            User caretaker = (patient != null) ? patient.getCaretaker() : null;
            String chemistName = (order.getChemist() != null) ? order.getChemist().getFullName() : "Chemist";
            String medName = (medicine != null) ? medicine.getName() : "Prescribed Medication";
            String alertMessage = String.format("%s has dispatched 30-day strip of %s for %s. Patient inventory restocked (+%d tablets).",
                    chemistName, medName, (patient != null ? patient.getFullName() : "Patient"), (order.getQuantity() != null ? order.getQuantity() : 30));

            if (caretaker != null && medicine != null) {
                CaretakerAlert alert = CaretakerAlert.builder()
                        .patient(patient)
                        .caretaker(caretaker)
                        .medicine(medicine)
                        .alertType("REFILL_STATUS")
                        .severity("LOW")
                        .message(alertMessage)
                        .resolved(true)
                        .createdAt(LocalDateTime.now())
                        .build();

                alertRepository.save(alert);
            }

            // Write immutable transaction ledger entry
            auditLogRepository.save(com.wipro.medtracker.entity.AuditLog.builder()
                    .eventType("REFILL_DISPATCHED")
                    .actor(chemistName)
                    .patientName(patient != null ? patient.getFullName() : "Patient")
                    .severity("INFO")
                    .description(alertMessage)
                    .timestamp(LocalDateTime.now())
                    .build());

            // Real-Time Notification & Event Streaming (REFILL_DISPATCHED)
            if (sseNotificationService != null) {
                sseNotificationService.broadcast("REFILL_DISPATCHED", order);
            }
        }

        return refillOrderRepository.save(order);
    }
}
