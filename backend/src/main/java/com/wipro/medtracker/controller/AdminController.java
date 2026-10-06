package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.AuditLog;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getPlatformOverview() {
        return ResponseEntity.ok(adminService.getPlatformOverview());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(adminService.getAllUsers(role, status, query));
    }

    @GetMapping("/users/{id}/dossier")
    public ResponseEntity<Map<String, Object>> getUserDossier(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDossier(id));
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<User> approveUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveUser(id));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<User> rejectUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Rejected by Administrator.";
        return ResponseEntity.ok(adminService.blockUser(id, reason));
    }

    @PutMapping("/users/{id}/block")
    public ResponseEntity<User> blockUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Suspended by Administrator.";
        return ResponseEntity.ok(adminService.blockUser(id, reason));
    }

    @PutMapping("/users/{id}/unblock")
    public ResponseEntity<User> unblockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unblockUser(id));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String patient,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(adminService.getFilteredAuditLogs(actor, patient, severity, query));
    }
}
