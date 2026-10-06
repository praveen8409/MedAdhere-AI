package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.*;
import com.wipro.medtracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestDataService {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final CaretakerAlertRepository alertRepository;
    private final CareAssignmentRequestRepository careAssignmentRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final PatientTelemetryRepository patientTelemetryRepository;
    private final PasswordEncoder passwordEncoder;
    private final jakarta.persistence.EntityManager entityManager;

    @Transactional
    public Map<String, Object> populateTestData(boolean resetExisting) {
        if (resetExisting) {
            log.info("Resetting existing database records...");
            patientTelemetryRepository.deleteAll();
            doseScheduleRepository.deleteAll();
            refillOrderRepository.deleteAll();
            alertRepository.deleteAll();
            medicineRepository.deleteAll();
            careAssignmentRequestRepository.deleteAll();
            auditLogRepository.deleteAll();

            // Clear self-referencing foreign keys on users before deleting users
            entityManager.createQuery("UPDATE User u SET u.caretaker = null, u.chemist = null").executeUpdate();
            entityManager.flush();
            entityManager.clear();

            userRepository.deleteAll();
            userRepository.flush();
        }

        log.info("Populating comprehensive multi-user clinical test dataset...");
        String encodedPassword = passwordEncoder.encode("Password@123");

        // ==========================================
        // 0. SYSTEM SUPERVISORY ADMIN (ROLE_ADMIN)
        // ==========================================
        User admin = User.builder()
                .username("admin")
                .password(encodedPassword)
                .fullName("Dr. Rajesh Nair (Medical Director & Head Admin)")
                .role("ROLE_ADMIN")
                .phoneNumber("+91 99000-00001")
                .address("MedAdhere Central Board, Prestige Meridian, MG Road, Bangalore")
                .designation("Medical Director & Chief Compliance Officer")
                .status("ACTIVE")
                .registeredAt(LocalDateTime.now().minusDays(90))
                .build();
        userRepository.save(admin);

        // ==========================================
        // 1. CARETAKERS (Verified + Pending Verification)
        // ==========================================
        User ananya = User.builder()
                .username("ananya_caretaker")
                .password(encodedPassword)
                .fullName("Dr. Ananya Sharma (Daughter)")
                .role("ROLE_CARETAKER")
                .phoneNumber("+91 98111-22334")
                .address("DLF Phase 2, Gurugram, Haryana")
                .familyLinkCode("CARE01")
                .designation("Daughter & Geriatric Physician")
                .status("ACTIVE")
                .registeredAt(LocalDateTime.now().minusDays(60))
                .build();
        userRepository.save(ananya);

        User sunitaPending = User.builder()
                .username("sunita_nurse")
                .password(encodedPassword)
                .fullName("Sister Sunita Deshmukh")
                .role("ROLE_CARETAKER")
                .phoneNumber("+91 98777-11223")
                .address("Staff Quarters, Manipal Hospital, Bangalore")
                .designation("Registered Geriatric Nurse")
                .licenseNumber("NURSE-REG-KA-2024-8841")
                .status("PENDING_APPROVAL")
                .registeredAt(LocalDateTime.now().minusHours(4))
                .build();
        userRepository.save(sunitaPending);

        User priya = User.builder()
                .username("priya_caretaker")
                .password(encodedPassword)
                .fullName("Dr. Priya Malhotra (Eldercare Specialist)")
                .role("ROLE_CARETAKER")
                .phoneNumber("+91 98222-77889")
                .address("Sector 56, Golf Course Road, Gurugram")
                .familyLinkCode("CARE02")
                .build();
        userRepository.save(priya);

        User rajesh = User.builder()
                .username("rajesh_caretaker")
                .password(encodedPassword)
                .fullName("Rajesh Patel (Family Caregiver)")
                .role("ROLE_CARETAKER")
                .phoneNumber("+91 98333-66778")
                .address("B-104, Shivalik Enclave, New Delhi")
                .familyLinkCode("CARE03")
                .build();
        userRepository.save(rajesh);

        // ==========================================
        // 2. CHEMISTS (3 verified community pharmacies)
        // ==========================================
        User apollo = User.builder()
                .username("apollo_chemist")
                .password(encodedPassword)
                .fullName("Apollo Pharmacy Main Market")
                .role("ROLE_CHEMIST")
                .phoneNumber("+91 98222-33445")
                .address("Shop 14, Apollo Medical Complex, Main Market, Gurugram")
                .build();
        userRepository.save(apollo);

        User sanjeevani = User.builder()
                .username("sanjeevani_chemist")
                .password(encodedPassword)
                .fullName("Sanjeevani Meds & Surgical Hub")
                .role("ROLE_CHEMIST")
                .phoneNumber("+91 98333-44556")
                .address("Shop 12, Market Complex, Sector 14, Gurugram")
                .build();
        userRepository.save(sanjeevani);

        User medplus = User.builder()
                .username("medplus_chemist")
                .password(encodedPassword)
                .fullName("MedPlus Healthcare Pharmacy")
                .role("ROLE_CHEMIST")
                .phoneNumber("+91 98444-55667")
                .address("Plot 45, Cyber City Commercial Road, Gurugram")
                .build();
        userRepository.save(medplus);

        User wellnessChemist = User.builder()
                .username("wellness_chemist")
                .password(encodedPassword)
                .fullName("Wellness Forever Super Pharmacy")
                .role("ROLE_CHEMIST")
                .phoneNumber("+91 98555-44332")
                .address("Indiranagar 100ft Road, Bangalore")
                .licenseNumber("DL-KA-2024-88412")
                .status("PENDING_APPROVAL")
                .registeredAt(LocalDateTime.now().minusHours(6))
                .build();
        userRepository.save(wellnessChemist);

        User suspiciousTrader = User.builder()
                .username("suspicious_trader")
                .password(encodedPassword)
                .fullName("QuickDiscounts Pharma & OTC (Blacklisted)")
                .role("ROLE_CHEMIST")
                .phoneNumber("+91 99999-00112")
                .address("Basement Shop, Sadar Bazar, Delhi")
                .licenseNumber("REVOKED-DL-2022-99")
                .status("BLOCKED")
                .registeredAt(LocalDateTime.now().minusDays(45))
                .build();
        userRepository.save(suspiciousTrader);

        // ==========================================
        // 3. PATIENTS (5 diverse geriatric patients)
        // ==========================================
        // Patient 1: Ramesh Sharma (Dadaji) -> Cared by Ananya, Bound to Apollo
        User ramesh = User.builder()
                .username("ramesh_patient")
                .password(encodedPassword)
                .fullName("Ramesh Sharma (Dadaji)")
                .role("ROLE_PATIENT")
                .phoneNumber("+91 98765-43210")
                .address("Flat 402, Green Valley Apartments, Gurugram")
                .age(72)
                .familyLinkCode("CARE01")
                .caretaker(ananya)
                .chemist(apollo)
                .build();
        userRepository.save(ramesh);

        // Patient 2: Kanta Sharma (Mother/Dadi) -> Cared by Ananya, Bound to Apollo
        User kanta = User.builder()
                .username("kanta_patient")
                .password(encodedPassword)
                .fullName("Kanta Sharma (Mother)")
                .role("ROLE_PATIENT")
                .phoneNumber("+91 98765-43211")
                .address("Flat 402, Green Valley Apartments, Gurugram")
                .age(68)
                .familyLinkCode("CARE01")
                .caretaker(ananya)
                .chemist(apollo)
                .build();
        userRepository.save(kanta);

        // Patient 3: Vikram Malhotra (Cardiac Senior) -> Cared by Priya, Bound to Apollo
        User vikram = User.builder()
                .username("vikram_patient")
                .password(encodedPassword)
                .fullName("Vikram Malhotra (Post-Angioplasty)")
                .role("ROLE_PATIENT")
                .phoneNumber("+91 98111-99887")
                .address("Villa 18, Palm Meadows, Golf Course Ext., Gurugram")
                .age(76)
                .familyLinkCode("CARE02")
                .caretaker(priya)
                .chemist(apollo)
                .build();
        userRepository.save(vikram);

        // Patient 4: Meena Patel (Diabetic Senior) -> Cared by Rajesh, Bound to Sanjeevani
        User meena = User.builder()
                .username("meena_patient")
                .password(encodedPassword)
                .fullName("Meena Patel (Diabetic Senior)")
                .role("ROLE_PATIENT")
                .phoneNumber("+91 98222-11334")
                .address("Flat 203, Orchid Towers, South City 1, Gurugram")
                .age(70)
                .familyLinkCode("CARE03")
                .caretaker(rajesh)
                .chemist(sanjeevani)
                .build();
        userRepository.save(meena);

        // Patient 5: Suresh Verma (Newly Registered Patient -> Has PENDING request to Rajesh!)
        User suresh = User.builder()
                .username("suresh_patient")
                .password(encodedPassword)
                .fullName("Suresh Verma (Arthritis Patient)")
                .role("ROLE_PATIENT")
                .phoneNumber("+91 98333-22110")
                .address("C-12, Rosewood City, Sector 49, Gurugram")
                .age(74)
                .caretaker(null) // Not yet approved!
                .chemist(null)
                .build();
        userRepository.save(suresh);

        // ==========================================
        // 4. CARE ASSIGNMENT REQUESTS
        // ==========================================
        // Request 1: Ramesh -> Ananya (APPROVED)
        careAssignmentRequestRepository.save(CareAssignmentRequest.builder()
                .patient(ramesh)
                .caretaker(ananya)
                .status("APPROVED")
                .prescriptionNotes("Type-2 Diabetes & Hypertension Regimen: Metformin 500mg morning/night; Telma 40 after dinner.")
                .prescriptionDocUrl("https://example.org/rx/ramesh-rx-full.pdf")
                .caretakerResponseNotes("Prescription verified by Dr. Ananya. Apollo Pharmacy bound for auto-refill fulfillment.")
                .createdAt(LocalDateTime.now().minusDays(3))
                .respondedAt(LocalDateTime.now().minusDays(3).plusHours(1))
                .build());

        // Request 2: Kanta -> Ananya (APPROVED)
        careAssignmentRequestRepository.save(CareAssignmentRequest.builder()
                .patient(kanta)
                .caretaker(ananya)
                .status("APPROVED")
                .prescriptionNotes("Thyroid & Osteoporosis Care: Thyronorm 50mcg morning empty stomach; Amlodipine 5mg; Shelcal 500.")
                .prescriptionDocUrl("https://example.org/rx/kanta-rx.pdf")
                .caretakerResponseNotes("Regimen approved. Apollo Pharmacy designated as dispensing partner.")
                .createdAt(LocalDateTime.now().minusDays(2))
                .respondedAt(LocalDateTime.now().minusDays(2).plusHours(2))
                .build());

        // Request 3: Vikram -> Priya (APPROVED)
        careAssignmentRequestRepository.save(CareAssignmentRequest.builder()
                .patient(vikram)
                .caretaker(priya)
                .status("APPROVED")
                .prescriptionNotes("Cardiovascular Protection Post-Angioplasty: Ecosprin 75 after lunch; Atorva 20 at bedtime.")
                .prescriptionDocUrl("https://example.org/rx/vikram-cardiac-rx.pdf")
                .caretakerResponseNotes("Clinical regimen authorized. Telemetry locked on patient companion terminal.")
                .createdAt(LocalDateTime.now().minusDays(1))
                .respondedAt(LocalDateTime.now().minusDays(1).plusHours(3))
                .build());

        // Request 4: Meena -> Rajesh (APPROVED)
        careAssignmentRequestRepository.save(CareAssignmentRequest.builder()
                .patient(meena)
                .caretaker(rajesh)
                .status("APPROVED")
                .prescriptionNotes("Type-2 Glycemic Stabilization: Glycomet Trio 1 twice daily before meals.")
                .prescriptionDocUrl("https://example.org/rx/meena-diabetic.pdf")
                .caretakerResponseNotes("Approved by Rajesh Patel. Bound to Sanjeevani Meds Sector 14.")
                .createdAt(LocalDateTime.now().minusDays(1))
                .respondedAt(LocalDateTime.now().minusDays(1).plusHours(1))
                .build());

        // Request 5: Suresh -> Rajesh (PENDING! Shows up in Rajesh's Incoming Requests Queue!)
        careAssignmentRequestRepository.save(CareAssignmentRequest.builder()
                .patient(suresh)
                .caretaker(rajesh)
                .status("PENDING")
                .prescriptionNotes("Severe knee osteoarthritis and mild hypertension. Currently taking Pain relief Tab Ultracet and Losartan 50mg. Attached prescription slip for dosage authoring.")
                .prescriptionDocUrl("https://example.org/rx/suresh-arthritis-slip.pdf")
                .createdAt(LocalDateTime.now().minusHours(3))
                .build());

        // ==========================================
        // 5. MEDICINES & INVENTORY
        // ==========================================
        // A. Ramesh's Medicines
        Medicine rameshMeds1 = Medicine.builder()
                .patient(ramesh)
                .caretakerAuthor(ananya)
                .name("Metformin Glycomet (500mg)")
                .dosage("500mg (1 Tablet)")
                .instructions("Strictly take after meals with warm water.")
                .dailyDoseCount(2)
                .remainingTablets(6) // Low stock (3 days remaining <= 5 threshold!)
                .totalCourseDays(90)
                .daysCompleted(42)
                .expiryDate(LocalDate.now().plusMonths(14))
                .autoRefillTriggered(true)
                .emergencyPurpose("Type-2 Diabetes Glycemic Control")
                .build();
        medicineRepository.save(rameshMeds1);

        Medicine rameshMeds2 = Medicine.builder()
                .patient(ramesh)
                .caretakerAuthor(ananya)
                .name("Telma 40 (Telmisartan)")
                .dosage("40mg (1 Tablet)")
                .instructions("Take after dinner at 8:30 PM with water.")
                .dailyDoseCount(1)
                .remainingTablets(24)
                .totalCourseDays(90)
                .daysCompleted(42)
                .expiryDate(LocalDate.now().plusMonths(18))
                .autoRefillTriggered(false)
                .emergencyPurpose("Hypertension & Cardiovascular Defense")
                .build();
        medicineRepository.save(rameshMeds2);

        Medicine rameshMeds3 = Medicine.builder()
                .patient(ramesh)
                .caretakerAuthor(ananya)
                .name("Becadexamin Zinc Multivitamin")
                .dosage("1 Capsule")
                .instructions("Take daily after lunch.")
                .dailyDoseCount(1)
                .remainingTablets(18)
                .totalCourseDays(60)
                .daysCompleted(30)
                .expiryDate(LocalDate.now().plusMonths(10))
                .autoRefillTriggered(false)
                .emergencyPurpose("Immunity & Nutritional Support")
                .build();
        medicineRepository.save(rameshMeds3);

        // B. Kanta's Medicines
        Medicine kantaMeds1 = Medicine.builder()
                .patient(kanta)
                .caretakerAuthor(ananya)
                .name("Thyronorm (50mcg)")
                .dosage("50mcg (1 Tablet)")
                .instructions("Take first thing in morning empty stomach with water.")
                .dailyDoseCount(1)
                .remainingTablets(22)
                .totalCourseDays(90)
                .daysCompleted(50)
                .expiryDate(LocalDate.now().plusMonths(20))
                .autoRefillTriggered(false)
                .emergencyPurpose("Thyroid Hormone Regulation")
                .build();
        medicineRepository.save(kantaMeds1);

        Medicine kantaMeds2 = Medicine.builder()
                .patient(kanta)
                .caretakerAuthor(ananya)
                .name("Amlodipine Besylate (5mg)")
                .dosage("5mg (1 Tablet)")
                .instructions("Take morning after breakfast with water.")
                .dailyDoseCount(1)
                .remainingTablets(14)
                .totalCourseDays(60)
                .daysCompleted(25)
                .expiryDate(LocalDate.now().plusMonths(16))
                .autoRefillTriggered(false)
                .emergencyPurpose("Hypertension & Cardiac Support")
                .build();
        medicineRepository.save(kantaMeds2);

        Medicine kantaMeds3 = Medicine.builder()
                .patient(kanta)
                .caretakerAuthor(ananya)
                .name("Shelcal 500 (Calcium + Vit D3)")
                .dosage("500mg (1 Tablet)")
                .instructions("Take daily after lunch with water.")
                .dailyDoseCount(1)
                .remainingTablets(5) // Low stock threshold triggered!
                .totalCourseDays(30)
                .daysCompleted(20)
                .expiryDate(LocalDate.now().plusMonths(12))
                .autoRefillTriggered(true)
                .emergencyPurpose("Osteoporosis & Bone Density")
                .build();
        medicineRepository.save(kantaMeds3);

        // C. Vikram's Medicines
        Medicine vikramMeds1 = Medicine.builder()
                .patient(vikram)
                .caretakerAuthor(priya)
                .name("Ecosprin 75 (Aspirin)")
                .dosage("75mg (1 Tablet)")
                .instructions("Take after lunch with water.")
                .dailyDoseCount(1)
                .remainingTablets(28)
                .totalCourseDays(90)
                .daysCompleted(40)
                .expiryDate(LocalDate.now().plusMonths(24))
                .autoRefillTriggered(false)
                .emergencyPurpose("Antiplatelet Cardiovascular Defense")
                .build();
        medicineRepository.save(vikramMeds1);

        Medicine vikramMeds2 = Medicine.builder()
                .patient(vikram)
                .caretakerAuthor(priya)
                .name("Atorva 20 (Atorvastatin)")
                .dosage("20mg (1 Tablet)")
                .instructions("Take at night after dinner.")
                .dailyDoseCount(1)
                .remainingTablets(25)
                .totalCourseDays(90)
                .daysCompleted(40)
                .expiryDate(LocalDate.now().plusMonths(18))
                .autoRefillTriggered(false)
                .emergencyPurpose("Lipid & Cholesterol Management")
                .build();
        medicineRepository.save(vikramMeds2);

        // D. Meena's Medicines
        Medicine meenaMeds1 = Medicine.builder()
                .patient(meena)
                .caretakerAuthor(rajesh)
                .name("Glycomet Trio 1")
                .dosage("1 Tablet")
                .instructions("Take twice daily before meals.")
                .dailyDoseCount(2)
                .remainingTablets(4) // Critical Low stock!
                .totalCourseDays(60)
                .daysCompleted(35)
                .expiryDate(LocalDate.now().plusMonths(15))
                .autoRefillTriggered(true)
                .emergencyPurpose("Type-2 Diabetes Triple Drug Therapy")
                .build();
        medicineRepository.save(meenaMeds1);

        // ==========================================
        // 6. DOSE SCHEDULES (TODAY)
        // ==========================================
        // Ramesh Today
        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(rameshMeds1)
                .patient(ramesh)
                .scheduledSlot("MORNING")
                .scheduledTime(LocalTime.of(8, 0))
                .status("TAKEN")
                .takenAt(LocalDateTime.now().withHour(8).withMinute(4))
                .alertSentToCaretaker(false)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(rameshMeds3)
                .patient(ramesh)
                .scheduledSlot("AFTERNOON")
                .scheduledTime(LocalTime.of(13, 30))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(rameshMeds1)
                .patient(ramesh)
                .scheduledSlot("NIGHT")
                .scheduledTime(LocalTime.of(20, 30))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(rameshMeds2)
                .patient(ramesh)
                .scheduledSlot("NIGHT")
                .scheduledTime(LocalTime.of(20, 30))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        // Kanta Today
        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(kantaMeds1)
                .patient(kanta)
                .scheduledSlot("MORNING")
                .scheduledTime(LocalTime.of(7, 30))
                .status("TAKEN")
                .takenAt(LocalDateTime.now().withHour(7).withMinute(32))
                .alertSentToCaretaker(false)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(kantaMeds2)
                .patient(kanta)
                .scheduledSlot("MORNING")
                .scheduledTime(LocalTime.of(9, 0))
                .status("TAKEN")
                .takenAt(LocalDateTime.now().withHour(9).withMinute(5))
                .alertSentToCaretaker(false)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(kantaMeds3)
                .patient(kanta)
                .scheduledSlot("AFTERNOON")
                .scheduledTime(LocalTime.of(13, 30))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        // Vikram Today
        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(vikramMeds1)
                .patient(vikram)
                .scheduledSlot("AFTERNOON")
                .scheduledTime(LocalTime.of(13, 30))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(vikramMeds2)
                .patient(vikram)
                .scheduledSlot("NIGHT")
                .scheduledTime(LocalTime.of(21, 0))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        // Meena Today (Shows a MISSED DOSE to test Missed Dose Radar!)
        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(meenaMeds1)
                .patient(meena)
                .scheduledSlot("MORNING")
                .scheduledTime(LocalTime.of(8, 0))
                .status("MISSED") // Missed dose demonstration!
                .alertSentToCaretaker(true)
                .build());

        doseScheduleRepository.save(DoseSchedule.builder()
                .medicine(meenaMeds1)
                .patient(meena)
                .scheduledSlot("NIGHT")
                .scheduledTime(LocalTime.of(20, 30))
                .status("PENDING")
                .alertSentToCaretaker(false)
                .build());

        // ==========================================
        // 7. REFILL ORDERS FOR CHEMISTS
        // ==========================================
        // Order 1 for Apollo: Metformin for Ramesh (REQUESTED)
        refillOrderRepository.save(RefillOrder.builder()
                .medicine(rameshMeds1)
                .patient(ramesh)
                .chemist(apollo)
                .quantity(30)
                .orderStatus("REQUESTED")
                .urgencyLevel("NORMAL")
                .trackingNotes("Burn-rate replenishment: 30-tablet monthly strip queued for Apollo Pharmacy Main Market.")
                .orderDate(LocalDateTime.now().minusHours(2))
                .build());

        // Order 2 for Apollo: Shelcal for Kanta (PACKED)
        refillOrderRepository.save(RefillOrder.builder()
                .medicine(kantaMeds3)
                .patient(kanta)
                .chemist(apollo)
                .quantity(30)
                .orderStatus("PACKED")
                .urgencyLevel("NORMAL")
                .trackingNotes("Low-stock auto refill: Shelcal 500 strip packaged, ready for courier pickup.")
                .orderDate(LocalDateTime.now().minusHours(1))
                .build());

        // Order 3 for Sanjeevani: Glycomet for Meena (OUT_FOR_DELIVERY)
        refillOrderRepository.save(RefillOrder.builder()
                .medicine(meenaMeds1)
                .patient(meena)
                .chemist(sanjeevani)
                .quantity(30)
                .orderStatus("OUT_FOR_DELIVERY")
                .urgencyLevel("CRITICAL")
                .trackingNotes("Urgent refill: Out for delivery via Sanjeevani Express courier to South City 1.")
                .orderDate(LocalDateTime.now().minusMinutes(45))
                .build());

        // Order 4 for Apollo: Ecosprin for Vikram (DELIVERED / RESTOCKED)
        refillOrderRepository.save(RefillOrder.builder()
                .medicine(vikramMeds1)
                .patient(vikram)
                .chemist(apollo)
                .quantity(30)
                .orderStatus("DELIVERED")
                .urgencyLevel("NORMAL")
                .trackingNotes("Restocked in physical medicine box at Villa 18 Palm Meadows.")
                .orderDate(LocalDateTime.now().minusDays(5))
                .build());

        // ==========================================
        // 8. CARETAKER GOVERNANCE ALERTS
        // ==========================================
        alertRepository.save(CaretakerAlert.builder()
                .patient(ramesh)
                .caretaker(ananya)
                .medicine(rameshMeds1)
                .alertType("INVENTORY_NOTICE")
                .severity("MEDIUM")
                .message("Inventory Warning: Ramesh Sharma has 6 tablets remaining of Metformin 500mg (3 days supply remaining).")
                .resolved(false)
                .createdAt(LocalDateTime.now().minusHours(4))
                .build());

        alertRepository.save(CaretakerAlert.builder()
                .patient(kanta)
                .caretaker(ananya)
                .medicine(kantaMeds3)
                .alertType("INVENTORY_NOTICE")
                .severity("MEDIUM")
                .message("Low Stock Refill: Kanta Sharma has 5 tablets of Shelcal 500 remaining. Auto-refill order dispatched to Apollo Pharmacy.")
                .resolved(false)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build());

        alertRepository.save(CaretakerAlert.builder()
                .patient(meena)
                .caretaker(rajesh)
                .medicine(meenaMeds1)
                .alertType("MISSED_DOSE")
                .severity("HIGH")
                .message("Missed Dose Radar: Meena Patel did not take Morning Glycomet Trio within the scheduled intake window (08:00 AM - 09:30 AM).")
                .resolved(false)
                .createdAt(LocalDateTime.now().minusHours(3))
                .build());

        // ==========================================
        // 9. AUDIT LOG RECORDS
        // ==========================================
        auditLogRepository.save(AuditLog.builder()
                .eventType("ONBOARDING_COMPLETED")
                .description("Family pairing established: Ramesh Sharma (Dadaji) bound to Dr. Ananya Sharma.")
                .actor("SYSTEM")
                .patientName(ramesh.getFullName())
                .severity("INFO")
                .timestamp(LocalDateTime.now().minusDays(3))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .eventType("PRESCRIPTION_LOCKED")
                .description("Dr. Ananya Sharma authored prescription for Metformin 500mg and Telma 40. Read-only lock enforced.")
                .actor(ananya.getFullName())
                .patientName(ramesh.getFullName())
                .severity("INFO")
                .timestamp(LocalDateTime.now().minusDays(3).plusHours(2))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .eventType("CHEMIST_BOUND")
                .description("Apollo Pharmacy Main Market selected as primary refill partner for Ramesh Sharma.")
                .actor(ananya.getFullName())
                .patientName(ramesh.getFullName())
                .severity("INFO")
                .timestamp(LocalDateTime.now().minusDays(3).plusHours(3))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .eventType("DOSE_TAKEN")
                .description("Ramesh Sharma tapped 'Dose Taken' for Morning Metformin Glycomet at 08:04 AM. Physical stock decremented.")
                .actor(ramesh.getFullName())
                .patientName(ramesh.getFullName())
                .severity("INFO")
                .timestamp(LocalDateTime.now().withHour(8).withMinute(4))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .eventType("MISSED_DOSE_ESCALATION")
                .description("Missed dose detected for Meena Patel (Morning Glycomet). Escalation dispatched to Caretaker Rajesh Patel.")
                .actor("SYSTEM_TELEMETRY")
                .patientName(meena.getFullName())
                .severity("WARNING")
                .timestamp(LocalDateTime.now().minusHours(3))
                .build());

        log.info("Comprehensive multi-user clinical test dataset successfully seeded.");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SUCCESS");
        result.put("message", "Database successfully populated with multiple users for all roles.");
        result.put("totalUsers", userRepository.count());
        result.put("totalMedicines", medicineRepository.count());
        result.put("totalSchedules", doseScheduleRepository.count());
        result.put("totalRefills", refillOrderRepository.count());
        result.put("totalAlerts", alertRepository.count());
        result.put("totalAssignmentRequests", careAssignmentRequestRepository.count());
        result.put("defaultPassword", "Password@123");

        return result;
    }
}
