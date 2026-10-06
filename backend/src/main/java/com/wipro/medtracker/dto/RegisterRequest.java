package com.wipro.medtracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String fullName;

    @NotBlank
    private String role; // ROLE_PATIENT, ROLE_CARETAKER, ROLE_CHEMIST

    private String phoneNumber;
    private String address;
    private Integer age;
    private String familyLinkCode;
    private Long caretakerId;
    private Long chemistId;
    private String status;
    private String licenseNumber;
    private String designation;
    private String emergencyContact;
    private String chronicConditions;
}
