package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.CareAssignmentRequest;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.CareAssignmentRequestRepository;
import com.wipro.medtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CareAssignmentService {

    private final CareAssignmentRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final SseNotificationService sseNotificationService;

    @Transactional
    public CareAssignmentRequest createRequest(Long patientId, Long caretakerId, String prescriptionNotes, String prescriptionDocUrl) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
        User caretaker = userRepository.findById(caretakerId)
                .orElseThrow(() -> new RuntimeException("Caretaker not found: " + caretakerId));

        CareAssignmentRequest request = CareAssignmentRequest.builder()
                .patient(patient)
                .caretaker(caretaker)
                .status("PENDING")
                .prescriptionNotes(prescriptionNotes)
                .prescriptionDocUrl(prescriptionDocUrl)
                .createdAt(LocalDateTime.now())
                .build();

        CareAssignmentRequest saved = requestRepository.save(request);
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("PATIENT_REQUESTED", saved);
            sseNotificationService.broadcast("ASSIGNMENT_REQUESTED", saved);
        }
        return saved;
    }

    public List<CareAssignmentRequest> getRequestsByCaretaker(Long caretakerId) {
        return requestRepository.findByCaretakerIdOrderByCreatedAtDesc(caretakerId);
    }

    public List<CareAssignmentRequest> getRequestsByPatient(Long patientId) {
        return requestRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @Transactional
    public CareAssignmentRequest approveRequest(Long requestId, Long chemistId, String caretakerNotes) {
        CareAssignmentRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Assignment request not found: " + requestId));

        request.setStatus("APPROVED");
        request.setRespondedAt(LocalDateTime.now());
        if (caretakerNotes != null && !caretakerNotes.isBlank()) {
            request.setCaretakerResponseNotes(caretakerNotes);
        } else {
            request.setCaretakerResponseNotes("Approved by primary caretaker.");
        }

        User patient = request.getPatient();
        User caretaker = request.getCaretaker();

        // Bi-directional clinical binding: link patient to caretaker
        patient.setCaretaker(caretaker);

        // Bind chemist if specified by caretaker
        if (chemistId != null) {
            userRepository.findById(chemistId).ifPresent(patient::setChemist);
        }

        userRepository.save(patient);
        CareAssignmentRequest saved = requestRepository.save(request);

        if (sseNotificationService != null) {
            sseNotificationService.broadcast("REQUEST_APPROVED", saved);
            sseNotificationService.broadcast("ASSIGNMENT_APPROVED", saved);
        }
        return saved;
    }

    @Transactional
    public CareAssignmentRequest rejectRequest(Long requestId, String reason) {
        CareAssignmentRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Assignment request not found: " + requestId));

        request.setStatus("REJECTED");
        request.setRespondedAt(LocalDateTime.now());
        request.setCaretakerResponseNotes(reason != null ? reason : "Declined by caretaker.");

        CareAssignmentRequest saved = requestRepository.save(request);
        if (sseNotificationService != null) {
            sseNotificationService.broadcast("ASSIGNMENT_REJECTED", saved);
        }
        return saved;
    }
}
