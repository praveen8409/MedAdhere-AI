package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/caretakers/{caretakerId}/patients")
    public ResponseEntity<List<User>> getPatientsByCaretaker(@PathVariable Long caretakerId) {
        return ResponseEntity.ok(userRepository.findByCaretakerId(caretakerId));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<User>> getAllPatients() {
        return ResponseEntity.ok(userRepository.findByRole("ROLE_PATIENT"));
    }

    @GetMapping("/patients/{patientId}")
    public ResponseEntity<User> getPatientById(@PathVariable Long patientId) {
        return ResponseEntity.ok(userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId)));
    }

    @GetMapping("/chemists/{chemistId}/patients")
    public ResponseEntity<List<User>> getPatientsByChemist(@PathVariable Long chemistId) {
        return ResponseEntity.ok(userRepository.findByChemistId(chemistId));
    }

    @GetMapping("/caretakers")
    public ResponseEntity<List<User>> getAllCaretakers() {
        return ResponseEntity.ok(userRepository.findByRole("ROLE_CARETAKER"));
    }

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

    @GetMapping("/chemists")
    public ResponseEntity<List<User>> getAllChemists() {
        return ResponseEntity.ok(userRepository.findByRole("ROLE_CHEMIST"));
    }

    @PutMapping("/patients/{patientId}/chemist")
    public ResponseEntity<User> bindChemistToPatient(
            @PathVariable Long patientId,
            @RequestBody Map<String, Long> body) {
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
