package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.DoseSchedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoseScheduleRepository extends JpaRepository<DoseSchedule, Long> {
    List<DoseSchedule> findByPatientId(Long patientId);
    List<DoseSchedule> findByPatientIdAndStatus(Long patientId, String status);
    List<DoseSchedule> findByMedicineId(Long medicineId);
    List<DoseSchedule> findByPatientIdOrderByScheduledTimeAsc(Long patientId);
    List<DoseSchedule> findByStatusAndAlertSentToCaretakerFalse(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM DoseSchedule s WHERE s.id = :id")
    Optional<DoseSchedule> findByIdWithPessimisticLock(@Param("id") Long id);
}
