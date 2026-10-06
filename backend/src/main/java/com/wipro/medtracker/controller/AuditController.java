package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.AuditLog;
import com.wipro.medtracker.service.AuditLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuditController {

    private final AuditLedgerService auditLedgerService;

    @GetMapping({"", "/logs"})
    public ResponseEntity<List<AuditLog>> getRecentLogs() {
        return ResponseEntity.ok(auditLedgerService.getRecentLogs());
    }

    @PostMapping("/chaos/missed-dose")
    public ResponseEntity<Map<String, Object>> simulateMissedDose() {
        return ResponseEntity.ok(auditLedgerService.simulateMissedDose());
    }

    @PostMapping("/chaos/low-stock")
    public ResponseEntity<Map<String, Object>> simulateLowStock() {
        return ResponseEntity.ok(auditLedgerService.simulateLowStock());
    }

    @PostMapping("/chaos/emergency-sos")
    public ResponseEntity<Map<String, Object>> simulateEmergencySos() {
        return ResponseEntity.ok(auditLedgerService.simulateEmergencySos());
    }

    @PostMapping("/chaos/reset")
    public ResponseEntity<Map<String, Object>> resetScenario() {
        return ResponseEntity.ok(auditLedgerService.resetScenario());
    }
}
