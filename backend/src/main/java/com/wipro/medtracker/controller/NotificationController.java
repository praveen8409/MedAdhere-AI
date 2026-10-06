package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.repository.CaretakerAlertRepository;
import com.wipro.medtracker.service.SseNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    private final SseNotificationService sseNotificationService;
    private final CaretakerAlertRepository alertRepository;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications() {
        return sseNotificationService.createEmitter();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<CaretakerAlert>> getRecentNotifications() {
        return ResponseEntity.ok(alertRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        List<CaretakerAlert> alerts = alertRepository.findAll();
        for (CaretakerAlert a : alerts) {
            a.setResolved(true);
        }
        alertRepository.saveAll(alerts);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "All notifications marked as read"));
    }
}
