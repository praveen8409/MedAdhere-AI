package com.wipro.medtracker.config;

import com.wipro.medtracker.entity.*;
import com.wipro.medtracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final CaretakerAlertRepository alertRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Production Mode Active: All demo pre-seeded accounts have been removed. Ready for genuine user registrations.");
    }
}
