package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.CaretakerAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaretakerAlertRepository extends JpaRepository<CaretakerAlert, Long> {
    List<CaretakerAlert> findByCaretakerIdOrderByCreatedAtDesc(Long caretakerId);
    List<CaretakerAlert> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<CaretakerAlert> findByCaretakerIdAndResolvedFalseOrderByCreatedAtDesc(Long caretakerId);
    List<CaretakerAlert> findAllByOrderByCreatedAtDesc();
}
