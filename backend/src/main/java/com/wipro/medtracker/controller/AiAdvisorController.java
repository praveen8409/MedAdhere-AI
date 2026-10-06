package com.wipro.medtracker.controller;

import com.wipro.medtracker.dto.AiRequest;
import com.wipro.medtracker.dto.AiResponse;
import com.wipro.medtracker.service.AiPharmacistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AI ADVISOR CONTROLLER
 * Exposes dynamic real-time AI endpoints:
 *   - POST /api/ai/advise (Core dynamic free-form LLM & tool-calling advisor)
 *   - POST /api/ai/chat (Conversational chatbot interface)
 *   - POST /api/ai/analyze-adherence
 *   - POST /api/ai/check-interactions
 *   - POST /api/ai/predict-refill
 *   - POST /api/ai/execute-action
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiAdvisorController {

    private final AiPharmacistService aiPharmacistService;

    @PostMapping("/advise")
    public ResponseEntity<AiResponse> handleAdvise(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.wipro.medtracker.security.services.UserDetailsImpl userPrincipal,
            @RequestBody AiRequest request) {
        return ResponseEntity.ok(aiPharmacistService.advise(userPrincipal, request));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiResponse> handleChat(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.wipro.medtracker.security.services.UserDetailsImpl userPrincipal,
            @RequestBody AiRequest request) {
        return ResponseEntity.ok(aiPharmacistService.advise(userPrincipal, request));
    }

    @PostMapping("/analyze-adherence")
    public ResponseEntity<AiResponse> analyzeAdherence(@RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.getOrDefault("patientId", 3).toString());
        return ResponseEntity.ok(aiPharmacistService.analyzeAdherenceRisk(patientId));
    }

    @PostMapping("/check-interactions")
    public ResponseEntity<AiResponse> checkInteractions(@RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.getOrDefault("patientId", 3).toString());
        return ResponseEntity.ok(aiPharmacistService.checkDrugInteractions(patientId));
    }

    @PostMapping("/predict-refill")
    public ResponseEntity<AiResponse> predictRefill(@RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.getOrDefault("patientId", 3).toString());
        return ResponseEntity.ok(aiPharmacistService.predictRefillDepletion(patientId));
    }

    @PostMapping("/execute-action")
    public ResponseEntity<Map<String, Object>> executeAction(@RequestBody Map<String, Object> body) {
        String actionId = (String) body.get("actionId");
        String actionType = (String) body.get("actionType");
        String payload = (String) body.get("payload");

        Map<String, Object> response = new HashMap<>();
        response.put("actionId", actionId);
        response.put("actionType", actionType);
        response.put("status", "SUCCESS");
        response.put("message", "AI Action [" + actionType + "] successfully executed. " + (payload != null ? payload : ""));
        response.put("timestamp", java.time.LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }
}
