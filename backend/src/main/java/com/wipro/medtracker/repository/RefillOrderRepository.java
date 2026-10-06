package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.RefillOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefillOrderRepository extends JpaRepository<RefillOrder, Long> {
    List<RefillOrder> findByPatientId(Long patientId);
    List<RefillOrder> findByChemistId(Long chemistId);
    List<RefillOrder> findByOrderStatus(String orderStatus);
    List<RefillOrder> findByChemistIdOrderByOrderDateDesc(Long chemistId);
    List<RefillOrder> findByPatientIdOrderByOrderDateDesc(Long patientId);
}
