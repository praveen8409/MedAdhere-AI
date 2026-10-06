package com.wipro.medtracker.controller;

import com.wipro.medtracker.dto.RefillOrderRequest;
import com.wipro.medtracker.entity.RefillOrder;
import com.wipro.medtracker.service.RefillOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/refills")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class RefillOrderController {

    private final RefillOrderService refillOrderService;

    @GetMapping
    public ResponseEntity<List<RefillOrder>> getAllOrders() {
        return ResponseEntity.ok(refillOrderService.getAllOrders());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<RefillOrder>> getOrdersByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(refillOrderService.getOrdersByPatient(patientId));
    }

    @GetMapping("/chemist/{chemistId}")
    public ResponseEntity<List<RefillOrder>> getOrdersByChemist(@PathVariable Long chemistId) {
        return ResponseEntity.ok(refillOrderService.getOrdersByChemist(chemistId));
    }

    @PostMapping
    public ResponseEntity<RefillOrder> createOrder(@Valid @RequestBody RefillOrderRequest request) {
        return ResponseEntity.ok(refillOrderService.createRefillOrder(request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RefillOrder> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String notes = body.get("notes");
        return ResponseEntity.ok(refillOrderService.updateOrderStatus(id, status, notes));
    }
}
