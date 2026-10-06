package com.wipro.medtracker.controller;

import org.springframework.stereotype.Component;

/**
 * Legacy alias for AiAdvisorController.
 * All dynamic real-time AI endpoints are actively served by AiAdvisorController:
 *   - POST /api/ai/advise
 *   - POST /api/ai/chat
 *   - POST /api/ai/analyze-adherence
 *   - POST /api/ai/check-interactions
 *   - POST /api/ai/predict-refill
 *   - POST /api/ai/execute-action
 */
@Component
public class AiController {
}
