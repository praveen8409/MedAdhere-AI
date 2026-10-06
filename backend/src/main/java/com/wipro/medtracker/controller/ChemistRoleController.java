package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.RefillOrder;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.MedicineRepository;
import com.wipro.medtracker.repository.RefillOrderRepository;
import com.wipro.medtracker.repository.UserRepository;
import com.wipro.medtracker.service.RefillOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Section 4: Chemist Role Dedicated API Controller
 * Provides pharmacy fulfillment endpoints with Privacy-Compliant Data Minimization:
 * Mapped patient directory (diagnostics withheld), autonomous refill queue, order dispatch, fulfillment history.
 */
@RestController
@RequestMapping("/api/chemist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChemistRoleController {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final RefillOrderService refillOrderService;

    /**
     * Section 4.3: Chemist Mapped Patients Directory
     * Privacy-Compliant Data Minimization: Sensitive diagnostic/disease data is withheld.
     * Only reveals: Name, Delivery Address, Active Medicines, Daily Consumption Rate, Days Supply Left, Caretaker Name & Phone.
     */
    @GetMapping("/patients")
    public ResponseEntity<List<Map<String, Object>>> getMappedPatients(@AuthenticationPrincipal UserDetails userDetails) {
        User chemist = getChemist(userDetails);
        List<User> patients = (chemist != null)
                ? userRepository.findByChemistId(chemist.getId())
                : userRepository.findByRole("ROLE_PATIENT");

        List<Map<String, Object>> result = new ArrayList<>();
        for (User p : patients) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("patientId", p.getId());
            item.put("patientName", p.getFullName());
            item.put("deliveryAddress", p.getAddress() != null ? p.getAddress() : "Address on file");
            item.put("patientPhone", p.getPhoneNumber());

            // Designated Caretaker details
            if (p.getCaretaker() != null) {
                item.put("caretakerName", p.getCaretaker().getFullName());
                item.put("caretakerPhone", p.getCaretaker().getPhoneNumber());
            } else {
                item.put("caretakerName", "Unassigned");
                item.put("caretakerPhone", "N/A");
            }

            // Minimized Medicine List (Diagnostic Purpose EXCLUDED for clinical privacy)
            List<Medicine> meds = medicineRepository.findByPatientId(p.getId());
            List<Map<String, Object>> sanitizedMeds = new ArrayList<>();
            double minDaysRemaining = Double.MAX_VALUE;

            for (Medicine m : meds) {
                Map<String, Object> sm = new LinkedHashMap<>();
                sm.put("medicineId", m.getId());
                sm.put("name", m.getName());
                sm.put("dosage", m.getDosage());
                sm.put("dailyDoseCount", m.getDailyDoseCount());
                sm.put("remainingTablets", m.getRemainingTablets());

                int daily = (m.getDailyDoseCount() != null && m.getDailyDoseCount() > 0) ? m.getDailyDoseCount() : 1;
                int rem = (m.getRemainingTablets() != null) ? m.getRemainingTablets() : 0;
                double daysLeft = (double) rem / daily;
                sm.put("daysSupplyRemaining", Math.round(daysLeft * 10.0) / 10.0);

                if (daysLeft < minDaysRemaining) {
                    minDaysRemaining = daysLeft;
                }
                sanitizedMeds.add(sm);
            }

            item.put("activeMedicines", sanitizedMeds);
            item.put("daysSupplyRemaining", minDaysRemaining < Double.MAX_VALUE ? Math.round(minDaysRemaining * 10.0) / 10.0 : 30.0);
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Section 4.2: Chemist Live Refill Queue Dashboard
     * Ordered by urgency
     */
    @GetMapping("/queue")
    public ResponseEntity<List<RefillOrder>> getRefillQueue(@AuthenticationPrincipal UserDetails userDetails) {
        User chemist = getChemist(userDetails);
        if (chemist != null) {
            return ResponseEntity.ok(refillOrderService.getOrdersByChemist(chemist.getId()));
        }
        return ResponseEntity.ok(refillOrderService.getAllOrders());
    }

    /**
     * Section 4.2: Confirm Package & Dispatch 30-Day Strip
     * Calls atomic stock replenishment (+30 tablets per strip) under pessimistic lock,
     * clears low-stock flags, sets status DISPATCHED, dispatches real-time SSE.
     */
    @PostMapping("/order/{id}/dispatch")
    public ResponseEntity<RefillOrder> dispatchOrder(@PathVariable Long id) {
        return ResponseEntity.ok(refillOrderService.dispatchOrder(id));
    }

    /**
     * Section 4.4: Chemist Fulfillment History & Invoice Ledger
     * Archive of all completed dispatches
     */
    @GetMapping("/history")
    public ResponseEntity<List<RefillOrder>> getFulfillmentHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User chemist = getChemist(userDetails);
        List<RefillOrder> orders = (chemist != null)
                ? refillOrderRepository.findByChemistIdOrderByOrderDateDesc(chemist.getId())
                : refillOrderRepository.findAll();

        List<RefillOrder> completed = orders.stream()
                .filter(o -> "DISPATCHED".equalsIgnoreCase(o.getOrderStatus()) || "DELIVERED".equalsIgnoreCase(o.getOrderStatus()))
                .toList();

        return ResponseEntity.ok(completed);
    }

    private User getChemist(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }
}
