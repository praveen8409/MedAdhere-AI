package com.wipro.medtracker.controller;

import com.wipro.medtracker.entity.DoseSchedule;
import com.wipro.medtracker.service.DoseScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DoseScheduleController {

    private final DoseScheduleService doseScheduleService;

    @GetMapping
    public ResponseEntity<List<DoseSchedule>> getAllSchedules() {
        return ResponseEntity.ok(doseScheduleService.getAllSchedules());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<DoseSchedule>> getSchedulesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(doseScheduleService.getSchedulesByPatient(patientId));
    }

    @PutMapping("/{id}/taken")
    public ResponseEntity<DoseSchedule> markDoseTaken(@PathVariable Long id) {
        return ResponseEntity.ok(doseScheduleService.markDoseTaken(id));
    }

    @PutMapping("/{id}/missed")
    public ResponseEntity<DoseSchedule> markDoseMissed(@PathVariable Long id) {
        return ResponseEntity.ok(doseScheduleService.markDoseMissed(id));
    }

    @PostMapping("/reset/{patientId}")
    public ResponseEntity<Void> resetSchedules(@PathVariable Long patientId) {
        doseScheduleService.resetSchedulesForDemo(patientId);
        return ResponseEntity.ok().build();
    }
}
