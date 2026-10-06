package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.Medicine;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByPatientId(Long patientId);
    List<Medicine> findByCaretakerAuthorId(Long caretakerAuthorId);
    List<Medicine> findByPatientIdAndRemainingTabletsLessThanEqual(Long patientId, Integer threshold);
    List<Medicine> findByRemainingTabletsLessThanEqualAndAutoRefillTriggeredFalse(Integer threshold);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Medicine m WHERE m.id = :id")
    Optional<Medicine> findByIdWithPessimisticLock(@Param("id") Long id);
}
