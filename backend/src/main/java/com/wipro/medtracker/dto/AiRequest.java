package com.wipro.medtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRequest {
    private String message;
    private String query;
    private String prompt;
    private Long patientId;
    private String queryType; // ADHERENCE_RISK, DRUG_INTERACTION, REFILL_PREDICTION, CLINICAL_TRIAGE, GENERAL_CHAT
    private String role; // ROLE_PATIENT, ROLE_CARETAKER, ROLE_CHEMIST, ROLE_ADMIN

    public String getEffectiveMessage() {
        if (query != null && !query.isBlank()) {
            return query.trim();
        }
        if (message != null && !message.isBlank()) {
            return message.trim();
        }
        if (prompt != null && !prompt.isBlank()) {
            return prompt.trim();
        }
        return "";
    }
}

