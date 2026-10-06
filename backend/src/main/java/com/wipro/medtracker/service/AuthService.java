package com.wipro.medtracker.service;

import com.wipro.medtracker.dto.AuthRequest;
import com.wipro.medtracker.dto.AuthResponse;
import com.wipro.medtracker.dto.RegisterRequest;
import com.wipro.medtracker.entity.User;
import com.wipro.medtracker.repository.UserRepository;
import com.wipro.medtracker.security.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthResponse authenticateUser(AuthRequest authRequest) {
        User user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + authRequest.getUsername()));

        if ("BLOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Access Denied: Your account has been suspended by the platform administrator.");
        }
        if ("PENDING_APPROVAL".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Access Denied: Your account is currently pending administrative verification by the MedAdhere Medical Board.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        return buildAuthResponse(user, jwt);
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username already in use: " + registerRequest.getUsername());
        }

        String initialStatus = registerRequest.getStatus();
        if (initialStatus == null || initialStatus.isBlank()) {
            if ("ROLE_CARETAKER".equalsIgnoreCase(registerRequest.getRole()) ||
                "ROLE_CHEMIST".equalsIgnoreCase(registerRequest.getRole())) {
                initialStatus = "PENDING_APPROVAL";
            } else {
                initialStatus = "ACTIVE";
            }
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName())
                .role(registerRequest.getRole())
                .phoneNumber(registerRequest.getPhoneNumber())
                .address(registerRequest.getAddress())
                .age(registerRequest.getAge())
                .familyLinkCode(registerRequest.getFamilyLinkCode())
                .status(initialStatus)
                .licenseNumber(registerRequest.getLicenseNumber())
                .designation(registerRequest.getDesignation())
                .emergencyContact(registerRequest.getEmergencyContact())
                .chronicConditions(registerRequest.getChronicConditions())
                .registeredAt(java.time.LocalDateTime.now())
                .build();

        if (registerRequest.getCaretakerId() != null) {
            userRepository.findById(registerRequest.getCaretakerId()).ifPresent(user::setCaretaker);
        }

        if (registerRequest.getChemistId() != null) {
            userRepository.findById(registerRequest.getChemistId()).ifPresent(user::setChemist);
        }

        userRepository.save(user);

        String jwt = jwtUtils.generateTokenFromUsername(user.getUsername());
        return buildAuthResponse(user, jwt);
    }

    public List<AuthResponse> getDemoAccounts() {
        List<AuthResponse> list = new ArrayList<>();
        List<User> users = userRepository.findAll();
        for (User u : users) {
            String token = jwtUtils.generateTokenFromUsername(u.getUsername());
            list.add(buildAuthResponse(u, token));
        }
        return list;
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        AuthResponse response = AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .age(user.getAge())
                .familyLinkCode(user.getFamilyLinkCode())
                .status(user.getStatus() != null ? user.getStatus() : "ACTIVE")
                .licenseNumber(user.getLicenseNumber())
                .designation(user.getDesignation())
                .build();

        if (user.getCaretaker() != null) {
            response.setCaretakerId(user.getCaretaker().getId());
            response.setCaretakerName(user.getCaretaker().getFullName());
        }

        if (user.getChemist() != null) {
            response.setChemistId(user.getChemist().getId());
            response.setChemistName(user.getChemist().getFullName());
        }

        return response;
    }
}
