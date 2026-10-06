package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.CareAssignmentRequest;
import com.wipro.medtracker.service.CareAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignment-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class CareAssignmentController {

    private final CareAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<CareAssignmentRequest> createRequest(@RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.get("patientId").toString());
        Long caretakerId = Long.valueOf(body.get("caretakerId").toString());
        String prescriptionNotes = body.containsKey("prescriptionNotes") && body.get("prescriptionNotes") != null
                ? body.get("prescriptionNotes").toString() : "";
        String prescriptionDocUrl = body.containsKey("prescriptionDocUrl") && body.get("prescriptionDocUrl") != null
                ? body.get("prescriptionDocUrl").toString() : "";

        return ResponseEntity.ok(assignmentService.createRequest(patientId, caretakerId, prescriptionNotes, prescriptionDocUrl));
    }

    @GetMapping("/caretaker/{caretakerId}")
    public ResponseEntity<List<CareAssignmentRequest>> getCaretakerRequests(@PathVariable Long caretakerId) {
        return ResponseEntity.ok(assignmentService.getRequestsByCaretaker(caretakerId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<CareAssignmentRequest>> getPatientRequests(@PathVariable Long patientId) {
        return ResponseEntity.ok(assignmentService.getRequestsByPatient(patientId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<CareAssignmentRequest> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        Long chemistId = body != null && body.containsKey("chemistId") && body.get("chemistId") != null
                ? Long.valueOf(body.get("chemistId").toString()) : null;
        String notes = body != null && body.containsKey("notes") && body.get("notes") != null
                ? body.get("notes").toString() : null;

        return ResponseEntity.ok(assignmentService.approveRequest(id, chemistId, notes));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<CareAssignmentRequest> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Declined by caretaker.";
        return ResponseEntity.ok(assignmentService.rejectRequest(id, reason));
    }
}
