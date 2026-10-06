package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.CareAssignmentRequest;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.UserRepository;
import com.wipro.medtracker.service.CareAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Section 3: Caretaker Role Dedicated API Controller
 * Provides clinical governance endpoints:
 * Chemist directory, review patient assignment requests, approve/reject, bind chemist.
 */
@RestController
@RequestMapping("/api/caretaker")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class CaretakerRoleController {

    private final UserRepository userRepository;
    private final CareAssignmentService careAssignmentService;

    /**
     * Section 3.5: Registered Chemist Directory Selector
     */
    @GetMapping("/chemists")
    public ResponseEntity<List<User>> getRegisteredChemists() {
        return ResponseEntity.ok(userRepository.findByRole("ROLE_CHEMIST"));
    }

    /**
     * Section 3.3: Caretaker Incoming Patient Requests Desk
     */
    @GetMapping("/requests")
    public ResponseEntity<List<CareAssignmentRequest>> getIncomingRequests(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User caretaker = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Caretaker not found: " + userDetails.getUsername()));
        return ResponseEntity.ok(careAssignmentService.getRequestsByCaretaker(caretaker.getId()));
    }

    /**
     * Approve incoming patient assignment request
     */
    @PutMapping("/requests/{id}/approve")
    public ResponseEntity<CareAssignmentRequest> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        Long chemistId = body != null && body.containsKey("chemistId") && body.get("chemistId") != null
                ? Long.valueOf(body.get("chemistId").toString()) : null;
        String notes = body != null && body.containsKey("notes") && body.get("notes") != null
                ? body.get("notes").toString() : null;

        return ResponseEntity.ok(careAssignmentService.approveRequest(id, chemistId, notes));
    }

    /**
     * Reject incoming patient assignment request
     */
    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<CareAssignmentRequest> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Declined by caretaker.";
        return ResponseEntity.ok(careAssignmentService.rejectRequest(id, reason));
    }

    /**
     * Section 3.5: Bind designated Pharmacy to Patient
     */
    @PostMapping("/bind-chemist")
    public ResponseEntity<User> bindChemist(@RequestBody Map<String, Long> body) {
        Long patientId = body.get("patientId");
        Long chemistId = body.get("chemistId");

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        if (chemistId != null) {
            User chemist = userRepository.findById(chemistId)
                    .orElseThrow(() -> new RuntimeException("Chemist not found: " + chemistId));
            patient.setChemist(chemist);
        } else {
            patient.setChemist(null);
        }

        return ResponseEntity.ok(userRepository.save(patient));
    }
}
