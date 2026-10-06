package com.wipro.medtracker.controller;

import com.wipro.medtracker.dto.DashboardSummaryDTO;
import com.wipro.medtracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "patientId", required = false) Long patientId) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(dashboardService.getDashboardSummary(userDetails.getUsername(), patientId));
    }
}
