package com.wipro.medtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String username;
    private String fullName;
    private String role;
    private String phoneNumber;
    private String address;
    private Integer age;
    private String familyLinkCode;
    private Long caretakerId;
    private String caretakerName;
    private Long chemistId;
    private String chemistName;
    private String status;
    private String licenseNumber;
    private String designation;
}
