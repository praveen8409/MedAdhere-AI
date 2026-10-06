package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.PatientTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientTelemetryRepository extends JpaRepository<PatientTelemetry, Long> {
    List<PatientTelemetry> findByPatientIdOrderByTimestampDesc(Long patientId);
    List<PatientTelemetry> findTop15ByPatientIdOrderByTimestampDesc(Long patientId);
    Optional<PatientTelemetry> findFirstByPatientIdOrderByTimestampDesc(Long patientId);
    long countByPatientId(Long patientId);
    void deleteByPatientId(Long patientId);
}
