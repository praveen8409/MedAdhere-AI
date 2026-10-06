package com.wipro.medtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {
    private String reply; // Primary conversational response text
    private String chatReply; // Backwards compatibility alias
    private List<String> toolsUsed; // Tool names executed during synthesis
    private String timestamp; // ISO response timestamp
    private Object toolData; // Structured grounding data returned by the tool(s)

    private String title;
    private String summary;
    private Integer riskScore; // 0 - 100
    private String riskTier; // LOW, MODERATE, HIGH, CRITICAL
    private List<String> insights;
    private List<AiActionItem> actionItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiActionItem {
        private String id;
        private String label;
        private String actionType; // DISPATCH_REMINDER, TRIGGER_REFILL, ADJUST_SCHEDULE, NOTIFY_DOCTOR
        private String payload;
        private boolean executable;
    }
}
