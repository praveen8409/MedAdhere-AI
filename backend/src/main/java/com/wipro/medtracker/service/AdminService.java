package com.wipro.medtracker.service;

import com.wipro.medtracker.entity.*;
import com.wipro.medtracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final RefillOrderRepository refillOrderRepository;
    private final CaretakerAlertRepository alertRepository;
    private final AuditLogRepository auditLogRepository;
    private final SseNotificationService sseNotificationService;

    /**
     * Section 2.E: Platform Health Overview (Analytics at a Glance)
     */
    public Map<String, Object> getPlatformOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();

        long totalPatients = userRepository.countByRole("ROLE_PATIENT");
        long totalCaretakers = userRepository.countByRole("ROLE_CARETAKER");
        long totalChemists = userRepository.countByRole("ROLE_CHEMIST");
        long totalUsers = userRepository.count();

        List<User> allUsers = userRepository.findAll();
        long pendingVerifications = allUsers.stream()
                .filter(u -> "PENDING_APPROVAL".equalsIgnoreCase(u.getStatus()))
                .count();

        long blockedUsers = allUsers.stream()
                .filter(u -> "BLOCKED".equalsIgnoreCase(u.getStatus()))
                .count();

        List<RefillOrder> allOrders = refillOrderRepository.findAll();
        long activeRefillOrders = allOrders.stream()
                .filter(o -> "REQUESTED".equalsIgnoreCase(o.getOrderStatus()) ||
                             "PACKED".equalsIgnoreCase(o.getOrderStatus()) ||
                             "OUT_FOR_DELIVERY".equalsIgnoreCase(o.getOrderStatus()))
                .count();

        List<CaretakerAlert> allAlerts = alertRepository.findAll();
        long activeAlerts = allAlerts.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getResolved()))
                .count();

        // Calculate Overall System Adherence Rate
        List<DoseSchedule> allSchedules = doseScheduleRepository.findAll();
        long totalSchedules = allSchedules.size();
        long takenCount = allSchedules.stream().filter(s -> "TAKEN".equalsIgnoreCase(s.getStatus())).count();
        double adherenceRate = totalSchedules > 0 ? ((double) takenCount / totalSchedules) * 100.0 : 100.0;

        overview.put("totalUsers", totalUsers);
        overview.put("totalPatients", totalPatients);
        overview.put("totalCaretakers", totalCaretakers);
        overview.put("totalChemists", totalChemists);
        overview.put("pendingVerifications", pendingVerifications);
        overview.put("pendingApprovalsCount", pendingVerifications);
        overview.put("blockedUsers", blockedUsers);
        overview.put("activeRefillOrders", activeRefillOrders);
        overview.put("activeRefillsCount", activeRefillOrders);
        overview.put("activeAlerts", activeAlerts);
        overview.put("activeAlertsCount", activeAlerts);
        overview.put("overallAdherenceRate", Math.round(adherenceRate * 10.0) / 10.0);
        overview.put("averageAdherence", Math.round(adherenceRate * 10.0) / 10.0);
        overview.put("systemHealth", pendingVerifications > 0 ? "ACTION_REQUIRED" : "OPTIMAL");
        overview.put("recentAuditEvents", auditLogRepository.findTop15ByOrderByTimestampDesc());

        return overview;
    }

    /**
     * Section 2.A & 2.B: User Management with Role, Status, and Search Filters
     */
    public List<User> getAllUsers(String role, String status, String query) {
        List<User> users = userRepository.findAll();

        return users.stream()
                .filter(u -> !"ROLE_ADMIN".equalsIgnoreCase(u.getRole())) // Keep admin list clean
                .filter(u -> {
                    if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
                        return role.equalsIgnoreCase(u.getRole());
                    }
                    return true;
                })
                .filter(u -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        return status.equalsIgnoreCase(u.getStatus());
                    }
                    return true;
                })
                .filter(u -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase().trim();
                        return (u.getFullName() != null && u.getFullName().toLowerCase().contains(q)) ||
                               (u.getUsername() != null && u.getUsername().toLowerCase().contains(q)) ||
                               (u.getPhoneNumber() != null && u.getPhoneNumber().toLowerCase().contains(q)) ||
                               (u.getLicenseNumber() != null && u.getLicenseNumber().toLowerCase().contains(q));
                    }
                    return true;
                })
                .toList();
    }

    /**
     * Section 2.A: Approve Chemist or Caretaker Professional Credentials
     */
    @Transactional
    public User approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setStatus("ACTIVE");
        User saved = userRepository.save(user);

        String msg = String.format("Admin approved credential for %s (%s). Account activated.",
                user.getFullName(), user.getRole());

        auditLogRepository.save(AuditLog.builder()
                .eventType("USER_VERIFIED")
                .actor("SYSTEM_ADMIN")
                .patientName(user.getFullName())
                .severity("INFO")
                .description(msg)
                .timestamp(LocalDateTime.now())
                .build());

        if (sseNotificationService != null) {
            sseNotificationService.broadcast("USER_STATUS_CHANGED", Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "status", "ACTIVE",
                    "message", msg
            ));
        }

        return saved;
    }

    /**
     * Section 2.B: Instant User Blocking (Suspicious Activity Lock)
     */
    @Transactional
    public User blockUser(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setStatus("BLOCKED");
        User saved = userRepository.save(user);

        String note = (reason != null && !reason.isBlank()) ? reason : "Suspicious activity detected by Medical Director.";
        String msg = String.format("Admin suspended account for %s (%s). Reason: %s",
                user.getFullName(), user.getUsername(), note);

        auditLogRepository.save(AuditLog.builder()
                .eventType("USER_BLOCKED")
                .actor("SYSTEM_ADMIN")
                .patientName(user.getFullName())
                .severity("CRITICAL")
                .description(msg)
                .timestamp(LocalDateTime.now())
                .build());

        if (sseNotificationService != null) {
            sseNotificationService.broadcast("USER_STATUS_CHANGED", Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "status", "BLOCKED",
                    "message", msg
            ));
        }

        return saved;
    }

    /**
     * Section 2.B: Unblock / Restore User Access
     */
    @Transactional
    public User unblockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setStatus("ACTIVE");
        User saved = userRepository.save(user);

        String msg = String.format("Admin restored access for %s (%s). Account reinstated.",
                user.getFullName(), user.getUsername());

        auditLogRepository.save(AuditLog.builder()
                .eventType("USER_UNBLOCKED")
                .actor("SYSTEM_ADMIN")
                .patientName(user.getFullName())
                .severity("INFO")
                .description(msg)
                .timestamp(LocalDateTime.now())
                .build());

        if (sseNotificationService != null) {
            sseNotificationService.broadcast("USER_STATUS_CHANGED", Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "status", "ACTIVE",
                    "message", msg
            ));
        }

        return saved;
    }

    /**
     * Section 2.D: Printable User Dossier / Report Card
     * Generates a complete clinical compliance dossier ready for window.print() or PDF export.
     */
    public Map<String, Object> getUserDossier(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Map<String, Object> dossier = new LinkedHashMap<>();
        dossier.put("user", user);
        dossier.put("generatedAt", LocalDateTime.now());
        dossier.put("dossierGeneratedAt", LocalDateTime.now());
        dossier.put("medicalDirector", "Dr. Rajesh Nair, MD (MedAdhere Board)");

        // Linked care partners & network mapping
        Map<String, Object> careTeam = new LinkedHashMap<>();
        careTeam.put("caretaker", user.getCaretaker() != null ? user.getCaretaker().getFullName() : "Self / Unassigned");
        careTeam.put("caretakerPhone", user.getCaretaker() != null ? user.getCaretaker().getPhoneNumber() : "N/A");
        careTeam.put("chemist", user.getChemist() != null ? user.getChemist().getFullName() : "No Bound Pharmacy");
        careTeam.put("chemistPhone", user.getChemist() != null ? user.getChemist().getPhoneNumber() : "N/A");
        dossier.put("careTeam", careTeam);

        Map<String, Object> network = new LinkedHashMap<>();
        if (user.getCaretaker() != null) {
            Map<String, Object> ctMap = new LinkedHashMap<>();
            ctMap.put("fullName", user.getCaretaker().getFullName());
            ctMap.put("phoneNumber", user.getCaretaker().getPhoneNumber() != null ? user.getCaretaker().getPhoneNumber() : "—");
            network.put("caretaker", ctMap);
        }
        if (user.getChemist() != null) {
            Map<String, Object> chMap = new LinkedHashMap<>();
            chMap.put("fullName", user.getChemist().getFullName());
            chMap.put("phoneNumber", user.getChemist().getPhoneNumber() != null ? user.getChemist().getPhoneNumber() : "—");
            network.put("chemist", chMap);
        }
        if ("ROLE_CARETAKER".equalsIgnoreCase(user.getRole())) {
            network.put("linkedPatients", userRepository.findByCaretakerId(user.getId()));
        } else if ("ROLE_CHEMIST".equalsIgnoreCase(user.getRole())) {
            network.put("linkedPatients", userRepository.findByChemistId(user.getId()));
        }
        dossier.put("network", network);

        // If patient, fetch active prescriptions and adherence analytics
        if ("ROLE_PATIENT".equalsIgnoreCase(user.getRole())) {
            List<Medicine> medicines = medicineRepository.findByPatientId(user.getId());
            dossier.put("prescriptions", medicines);

            List<DoseSchedule> schedules = doseScheduleRepository.findByPatientId(user.getId());
            long totalDoses = schedules.size();
            long takenDoses = schedules.stream().filter(s -> "TAKEN".equalsIgnoreCase(s.getStatus())).count();
            long missedDoses = schedules.stream().filter(s -> "MISSED".equalsIgnoreCase(s.getStatus())).count();
            long pendingDoses = schedules.stream().filter(s -> "PENDING".equalsIgnoreCase(s.getStatus())).count();
            double complianceScore = totalDoses > 0 ? ((double) takenDoses / totalDoses) * 100.0 : 100.0;

            Map<String, Object> adherenceReport = new LinkedHashMap<>();
            adherenceReport.put("totalScheduled", totalDoses);
            adherenceReport.put("takenCount", takenDoses);
            adherenceReport.put("missedCount", missedDoses);
            adherenceReport.put("pendingCount", pendingDoses);
            adherenceReport.put("complianceScore", Math.round(complianceScore * 10.0) / 10.0);
            adherenceReport.put("clinicalGrade", complianceScore >= 90 ? "EXCELLENT" : complianceScore >= 75 ? "GOOD" : "NEEDS_ATTENTION");
            dossier.put("adherenceAnalytics", adherenceReport);

            Map<String, Object> adherence = new LinkedHashMap<>();
            adherence.put("rate", Math.round(complianceScore * 10.0) / 10.0);
            adherence.put("totalSchedules", totalDoses);
            adherence.put("taken", takenDoses);
            adherence.put("missed", missedDoses);
            adherence.put("pending", pendingDoses);
            dossier.put("adherence", adherence);

            List<RefillOrder> refills = refillOrderRepository.findByPatientIdOrderByOrderDateDesc(user.getId());
            dossier.put("refillHistory", refills);
        }

        // Fetch User-Specific Master Audit Trail
        List<AuditLog> allLogs = auditLogRepository.findAll();
        List<AuditLog> userLogs = allLogs.stream()
                .filter(l -> (l.getActor() != null && l.getActor().contains(user.getFullName())) ||
                             (l.getPatientName() != null && l.getPatientName().contains(user.getFullName())) ||
                             (l.getDescription() != null && l.getDescription().contains(user.getUsername())))
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .limit(20)
                .toList();

        dossier.put("auditTimeline", userLogs);
        dossier.put("auditHistory", userLogs);

        return dossier;
    }

    /**
     * Section 2.C: User-Specific Master Logs & Audit Trail Filter
     */
    public List<AuditLog> getFilteredAuditLogs(String actor, String patient, String severity, String query) {
        List<AuditLog> logs = auditLogRepository.findAll();

        return logs.stream()
                .filter(l -> {
                    if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) {
                        return severity.equalsIgnoreCase(l.getSeverity());
                    }
                    return true;
                })
                .filter(l -> {
                    if (actor != null && !actor.isBlank()) {
                        return l.getActor() != null && l.getActor().toLowerCase().contains(actor.toLowerCase());
                    }
                    return true;
                })
                .filter(l -> {
                    if (patient != null && !patient.isBlank()) {
                        return l.getPatientName() != null && l.getPatientName().toLowerCase().contains(patient.toLowerCase());
                    }
                    return true;
                })
                .filter(l -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase();
                        return (l.getDescription() != null && l.getDescription().toLowerCase().contains(q)) ||
                               (l.getEventType() != null && l.getEventType().toLowerCase().contains(q));
                    }
                    return true;
                })
                .sorted(Comparator.comparing(AuditLog::getTimestamp).reversed())
                .toList();
    }
}
