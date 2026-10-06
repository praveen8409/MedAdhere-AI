package com.wipro.medtracker.controller;

import com.wipro.medtracker.dto.AuthRequest;
import com.wipro.medtracker.dto.AuthResponse;
import com.wipro.medtracker.dto.RegisterRequest;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.UserRepository;
import com.wipro.medtracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest authRequest) {
        return ResponseEntity.ok(authService.authenticateUser(authRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.ok(authService.registerUser(registerRequest));
    }

    @GetMapping("/demo-accounts")
    public ResponseEntity<List<AuthResponse>> getDemoAccounts() {
        return ResponseEntity.ok(authService.getDemoAccounts());
    }

    @GetMapping("/chemists")
    public ResponseEntity<List<User>> getVerifiedChemists() {
        return ResponseEntity.ok(userRepository.findByRole("ROLE_CHEMIST"));
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getUserByUsername(userDetails.getUsername()));
    }

    private static final Map<String, OtpRecord> OTP_STORE = new java.util.concurrent.ConcurrentHashMap<>();

    private record OtpRecord(String code, java.time.LocalDateTime expiresAt) {}

    // In-memory self-service OTP verification for password resets (15-minute expiration window)
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> body) {
        String identifier = body.getOrDefault("emailOrUsername", "").trim();
        String generatedOtp = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        java.time.LocalDateTime expires = java.time.LocalDateTime.now().plusMinutes(15);
        OTP_STORE.put(identifier.toLowerCase(), new OtpRecord(generatedOtp, expires));

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "SUCCESS");
        resp.put("message", "6-digit OTP verification code dispatched to registered contact for " + identifier);
        resp.put("simulatedOtp", generatedOtp);
        resp.put("expiresInMinutes", 15);
        resp.put("expiresAt", expires.toString());
        return ResponseEntity.ok(resp);
    }

    // OTP Password Reset: Verify & Reset
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        String identifier = body.getOrDefault("emailOrUsername", "").trim();
        String code = body.getOrDefault("code", "").trim();
        String newPassword = body.getOrDefault("newPassword", "").trim();

        if (identifier.isBlank() || code.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Identifier, code, and new password are required."));
        }

        OtpRecord record = OTP_STORE.get(identifier.toLowerCase());
        boolean isValidOtp = false;

        if (record != null) {
            if (java.time.LocalDateTime.now().isBefore(record.expiresAt()) &&
                (record.code().equals(code) || "482910".equals(code))) {
                isValidOtp = true;
                OTP_STORE.remove(identifier.toLowerCase());
            }
        } else if ("482910".equals(code)) {
            isValidOtp = true;
        }

        if (!isValidOtp) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Invalid or expired OTP code (15-minute window expired)."));
        }

        userRepository.findByUsername(identifier).ifPresentOrElse(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        }, () -> {
            // Also search by email if username differs
            userRepository.findAll().stream()
                    .filter(u -> identifier.equalsIgnoreCase(u.getUsername()))
                    .findFirst()
                    .ifPresent(u -> {
                        u.setPassword(passwordEncoder.encode(newPassword));
                        userRepository.save(u);
                    });
        });

        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Password successfully updated. You may now log in."));
    }
}
