package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.CareAssignmentRequest;
import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.MedicineRepository;
import com.wipro.medtracker.repository.UserRepository;
import com.wipro.medtracker.service.CareAssignmentService;
import com.wipro.medtracker.service.DoseScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Section 2: Patient Role Dedicated API Controller
 * Provides strictly operational, patient-scoped endpoints:
 * Search Caretakers, Ingest Medicine (Pessimistic Lock), Read Prescriptions.
 */
@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientRoleController {

    private final UserRepository userRepository;
    private final DoseScheduleService doseScheduleService;
    private final MedicineRepository medicineRepository;
    private final CareAssignmentService careAssignmentService;

    /**
     * Section 2.2: Caretaker Discovery & Live Search
     * Debounced lookup by name or mobile number
     */
    @GetMapping("/caretakers/search")
    public ResponseEntity<List<User>> searchCaretakers(@RequestParam(required = false, defaultValue = "") String query) {
        String q = query != null ? query.trim().toLowerCase() : "";
        List<User> caretakers = userRepository.findByRole("ROLE_CARETAKER");
        if (q.isBlank()) {
            return ResponseEntity.ok(caretakers);
        }
        List<User> filtered = caretakers.stream()
                .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(q)) ||
                             (u.getPhoneNumber() != null && u.getPhoneNumber().toLowerCase().contains(q)) ||
                             (u.getUsername() != null && u.getUsername().toLowerCase().contains(q)))
                .toList();
        return ResponseEntity.ok(filtered);
    }

    /**
     * Section 2.3: Dose Ingestion Service
     * Applies pessimistic write lock, marks dose TAKEN, decrements remaining tablets
     */
    @PostMapping("/dose/{id}/take")
    public ResponseEntity<DoseSchedule> takeDose(@PathVariable Long id) {
        return ResponseEntity.ok(doseScheduleService.markDoseTaken(id));
    }

    /**
     * Section 2.4: Patient Read-Only Prescription Registry
     */
    @GetMapping("/prescriptions")
    public ResponseEntity<List<Medicine>> getMyPrescriptions(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User patient = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Patient not found: " + userDetails.getUsername()));
        return ResponseEntity.ok(medicineRepository.findByPatientId(patient.getId()));
    }

    /**
     * Today's schedules for authenticated patient
     */
    @GetMapping("/schedules")
    public ResponseEntity<List<DoseSchedule>> getMySchedules(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User patient = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Patient not found: " + userDetails.getUsername()));
        return ResponseEntity.ok(doseScheduleService.getSchedulesByPatient(patient.getId()));
    }

    /**
     * Section 2.2: Caretaker Linking & Prescription Upload
     */
    @PostMapping("/link-caretaker")
    public ResponseEntity<CareAssignmentRequest> linkCaretaker(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User patient = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Patient not found: " + userDetails.getUsername()));

        Long caretakerId = Long.valueOf(body.get("caretakerId").toString());
        String notes = body.containsKey("notes") && body.get("notes") != null ? body.get("notes").toString() : "";
        String docUrl = body.containsKey("docUrl") && body.get("docUrl") != null ? body.get("docUrl").toString() : "";

        return ResponseEntity.ok(careAssignmentService.createRequest(patient.getId(), caretakerId, notes, docUrl));
    }
}
