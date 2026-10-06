package com.wipro.medtracker.service;

import com.wipro.medtracker.dto.AiRequest;
import com.wipro.medtracker.dto.AiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * AI Service delegating all dual-engine operations to AiPharmacistService.
 */
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiPharmacistService aiPharmacistService;

    public AiResponse handleChat(AiRequest request) {
        return aiPharmacistService.handleChat(request);
    }

    public AiResponse advise(AiRequest request) {
        return aiPharmacistService.advise(request);
    }

    public AiResponse analyzeAdherenceRisk(Long patientId) {
        return aiPharmacistService.analyzeAdherenceRisk(patientId);
    }

    public AiResponse checkDrugInteractions(Long patientId) {
        return aiPharmacistService.checkDrugInteractions(patientId);
    }

    public AiResponse predictRefillDepletion(Long patientId) {
        return aiPharmacistService.predictRefillDepletion(patientId);
    }
}
