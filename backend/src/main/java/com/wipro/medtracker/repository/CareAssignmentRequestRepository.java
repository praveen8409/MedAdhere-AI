package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.CareAssignmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CareAssignmentRequestRepository extends JpaRepository<CareAssignmentRequest, Long> {
    List<CareAssignmentRequest> findByCaretakerIdOrderByCreatedAtDesc(Long caretakerId);
    List<CareAssignmentRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<CareAssignmentRequest> findByCaretakerIdAndStatusOrderByCreatedAtDesc(Long caretakerId, String status);
}
