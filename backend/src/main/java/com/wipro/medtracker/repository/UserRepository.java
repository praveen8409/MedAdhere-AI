package com.wipro.medtracker.repository;

import com.wipro.medtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    List<User> findByRole(String role);
    List<User> findByCaretakerId(Long caretakerId);
    List<User> findByChemistId(Long chemistId);
    Optional<User> findByFamilyLinkCode(String familyLinkCode);
    long countByRole(String role);
    List<User> findByStatus(String status);
}
