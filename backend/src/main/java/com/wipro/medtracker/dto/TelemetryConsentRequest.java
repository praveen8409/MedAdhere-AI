package com.wipro.medtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryConsentRequest {
    private Boolean enabled;
    private Boolean shareWithCaretaker;
    private Integer frequencyMinutes;
}
