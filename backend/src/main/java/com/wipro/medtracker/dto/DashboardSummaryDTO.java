package com.wipro.medtracker.dto;

import com.wipro.medtracker.entity.CaretakerAlert;
import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.entity.Medicine;
import com.wipro.medtracker.entity.PatientTelemetry;
import com.wipro.medtracker.entity.RefillOrder;
import com.wipro.medtracker.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private String role;
    private User currentUser;
    private User linkedPatient;
    private User linkedCaretaker;
    private User linkedChemist;

    private Double adherenceRate; // percentage 0 - 100
    private Integer totalMedicines;
    private Integer totalDosesToday;
    private Integer dosesTakenToday;
    private Integer dosesPendingToday;
    private Integer dosesMissedToday;
    private Integer lowStockMedicinesCount;
    private Integer pendingRefillsCount;
    private Integer unreadAlertsCount;

    private Boolean telemetryEnabled;
    private PatientTelemetry latestTelemetry;

    private List<DoseSchedule> todaySchedules;
    private List<Medicine> medicines;
    private List<RefillOrder> activeRefillOrders;
    private List<CaretakerAlert> recentAlerts;
}

