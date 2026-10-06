package com.wipro.medtracker.controller;

import com.wipro.medtracker.service.TestDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test-data")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@Slf4j
public class TestDataController {

    private final TestDataService testDataService;

    @PostMapping("/populate")
    public ResponseEntity<Map<String, Object>> populateTestDataPost(
            @RequestParam(defaultValue = "true") boolean resetExisting) {
        log.info("REST trigger: populating test data (resetExisting: {})", resetExisting);
        Map<String, Object> result = testDataService.populateTestData(resetExisting);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/populate")
    public ResponseEntity<Map<String, Object>> populateTestDataGet(
            @RequestParam(defaultValue = "true") boolean resetExisting) {
        log.info("GET trigger: populating test data (resetExisting: {})", resetExisting);
        Map<String, Object> result = testDataService.populateTestData(resetExisting);
        return ResponseEntity.ok(result);
    }
}
