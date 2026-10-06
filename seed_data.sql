-- ==============================================================================
-- MedAdhere AI - Multi-Role Clinical Seed Data SQL Script
-- Database: H2 / PostgreSQL compatible
-- Note: Universal Password for all seeded users is: Password@123
-- BCrypt Hash: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a
-- ==============================================================================

-- 1. Reset existing tables (Clean state)
DELETE FROM dose_schedules;
DELETE FROM refill_orders;
DELETE FROM caretaker_alerts;
DELETE FROM care_assignment_requests;
DELETE FROM medicines;
DELETE FROM audit_logs;
UPDATE users SET caretaker_id = NULL, chemist_id = NULL;
DELETE FROM users;

-- 2. Insert Admin (System Supervisory Authority)
INSERT INTO users (id, username, password, full_name, role, phone_number, address, family_link_code, age, status, license_number, designation, caretaker_id, chemist_id) VALUES
(100, 'admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Dr. Rajesh Nair (Medical Director & Head Admin)', 'ROLE_ADMIN', '+91 99000-00001', 'MedAdhere Central Board, Prestige Meridian, MG Road, Bangalore', NULL, NULL, 'ACTIVE', 'MED-DIR-IND-2021', 'Medical Director & Chief Compliance Officer', NULL, NULL);

-- 3. Insert Caretakers (Active & Pending Approval)
INSERT INTO users (id, username, password, full_name, role, phone_number, address, family_link_code, age, status, license_number, designation, caretaker_id, chemist_id) VALUES
(1, 'ananya_caretaker', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Dr. Ananya Sharma (Daughter)', 'ROLE_CARETAKER', '+91 98765 43210', 'Flat 402, Green Glen Layout, Bellandur, Bangalore', 'CARE-ANANYA-01', 34, 'ACTIVE', 'KMC-DOC-4482', 'Daughter & Geriatric Physician', NULL, NULL),
(2, 'priya_caretaker', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Nurse Priya Menon', 'ROLE_CARETAKER', '+91 98450 11223', 'B-12, Palm Meadows, Whitefield, Bangalore', 'CARE-PRIYA-02', 29, 'ACTIVE', 'NURSE-REG-8821', 'Eldercare Specialist & Nurse', NULL, NULL),
(3, 'rajesh_caretaker', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Rajesh Verma (Son)', 'ROLE_CARETAKER', '+91 98110 99887', 'Sector 14, HSR Layout, Bangalore', 'CARE-RAJESH-03', 42, 'ACTIVE', NULL, 'Primary Family Caregiver', NULL, NULL),
(12, 'sunita_nurse', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Sister Sunita Deshmukh', 'ROLE_CARETAKER', '+91 98777 11223', 'Staff Quarters, Manipal Hospital, Bangalore', NULL, 31, 'PENDING_APPROVAL', 'NURSE-REG-KA-2024-8841', 'Registered Geriatric Nurse', NULL, NULL);

-- 4. Insert Chemists (Pharmacies - Active, Pending Approval, Blocked)
INSERT INTO users (id, username, password, full_name, role, phone_number, address, family_link_code, age, status, license_number, designation, caretaker_id, chemist_id) VALUES
(4, 'apollo_chemist', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Apollo 24/7 Pharmacy (MG Road)', 'ROLE_CHEMIST', '+91 80 2558 0001', 'Shop 12-14, Ground Floor, MG Road Metro Pillar 42, Bangalore', 'CHEM-APOLLO-01', NULL, 'ACTIVE', 'DL-KA-2019-1029', 'Licensed Pharmacy Partner', NULL, NULL),
(5, 'sanjeevani_chemist', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Sanjeevani Medicos & Wellness', 'ROLE_CHEMIST', '+91 80 4123 4567', '4th Block, 100ft Road, Koramangala, Bangalore', 'CHEM-SANJEEV-02', NULL, 'ACTIVE', 'DL-KA-2020-5541', 'Community Chemist Hub', NULL, NULL),
(6, 'medplus_chemist', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'MedPlus Super Health Hub', 'ROLE_CHEMIST', '+91 80 2845 6789', 'Hope Farm Junction, Whitefield Main Road, Bangalore', 'CHEM-MEDPLUS-03', NULL, 'ACTIVE', 'DL-KA-2022-7712', 'Super Specialty Pharmacy', NULL, NULL),
(13, 'wellness_chemist', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Wellness Forever Super Pharmacy', 'ROLE_CHEMIST', '+91 98555 44332', 'Indiranagar 100ft Road, Bangalore', NULL, NULL, 'PENDING_APPROVAL', 'DL-KA-2024-88412', 'Retail & Emergency Pharmacy', NULL, NULL),
(14, 'suspicious_trader', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'QuickDiscounts Pharma & OTC (Blacklisted)', 'ROLE_CHEMIST', '+91 99999 00112', 'Basement Shop, Sadar Bazar, Delhi', NULL, NULL, 'BLOCKED', 'REVOKED-DL-2022-99', 'Unverified Vendor', NULL, NULL);

-- 5. Insert Patients (Mapped to Caretakers and Chemists)
INSERT INTO users (id, username, password, full_name, role, phone_number, address, family_link_code, age, status, designation, emergency_contact, chronic_conditions, caretaker_id, chemist_id) VALUES
(7, 'ramesh_patient', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Ramesh Sharma (Dadaji)', 'ROLE_PATIENT', '+91 98451 23456', 'House 14, 5th Cross, Indiranagar 1st Stage, Bangalore', 'PAT-RAMESH-01', 72, 'ACTIVE', 'Retired Civil Engineer', '+91 98765-43210 (Dr. Ananya)', 'Type-2 Diabetes, Hypertension', 1, 4),
(8, 'kanta_patient', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Kanta Sharma (Mother)', 'ROLE_PATIENT', '+91 98451 78901', 'House 14, 5th Cross, Indiranagar 1st Stage, Bangalore', 'PAT-KANTA-02', 68, 'ACTIVE', 'Homemaker', '+91 98765-43210 (Dr. Ananya)', 'Osteoporosis, Hypothyroidism', 1, 4),
(9, 'vikram_patient', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Vikram Malhotra (Post-Angioplasty)', 'ROLE_PATIENT', '+91 99001 22334', 'Villa 58, Prestige Palms, Whitefield, Bangalore', 'PAT-VIKRAM-03', 55, 'ACTIVE', 'Architect', '+91 98450-11223 (Nurse Priya)', 'Post-Angioplasty, Hyperlipidemia', 2, 5),
(10, 'meena_patient', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Meena Patel (Diabetic Senior)', 'ROLE_PATIENT', '+91 98453 66778', 'Flat 201, Shanti Niketan, Malleshwaram 8th Cross, Bangalore', 'PAT-MEENA-04', 62, 'ACTIVE', 'Retired School Principal', '+91 98450-11223 (Nurse Priya)', 'Type-2 Diabetes, Neuropathy', 2, 6),
(11, 'suresh_patient', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Suresh Verma (Arthritis Patient)', 'ROLE_PATIENT', '+91 97400 55443', 'A-304, Brigade Gateway, Rajajinagar, Bangalore', 'PAT-SURESH-05', 70, 'ACTIVE', 'Retired Bank Manager', '+91 98110-99887 (Rajesh Verma)', 'Severe Osteoarthritis, Hypertension', NULL, NULL);

-- 5. Care Assignment Requests
INSERT INTO care_assignment_requests (id, patient_id, caretaker_id, status, prescription_path, notes, created_at) VALUES
(1, 7, 1, 'APPROVED', 'prescriptions/ramesh_cardiac_diabetes_rx.pdf', 'Dr. Ananya approved care plan for Ramesh Sharma.', CURRENT_TIMESTAMP()),
(2, 8, 1, 'APPROVED', 'prescriptions/kanta_ortho_rx.pdf', 'Dr. Ananya approved care plan for Kanta Sharma.', CURRENT_TIMESTAMP()),
(3, 9, 2, 'APPROVED', 'prescriptions/vikram_post_angioplasty_rx.pdf', 'Nurse Priya active caretaker for Vikram Malhotra.', CURRENT_TIMESTAMP()),
(4, 10, 2, 'APPROVED', 'prescriptions/meena_diabetic_rx.pdf', 'Nurse Priya active caretaker for Meena Patel.', CURRENT_TIMESTAMP()),
(5, 11, 3, 'PENDING', 'prescriptions/suresh_arthritis_rx.pdf', 'Request sent to Rajesh Verma for geriatric caregiving.', CURRENT_TIMESTAMP());

-- 6. Prescribed Medicines
INSERT INTO medicines (id, patient_id, name, dosage, frequency, instructions, current_stock, low_stock_threshold, course_days) VALUES
(1, 7, 'Metformin Glycomet (500mg)', '500mg', 'Twice daily', 'Take immediately after breakfast and dinner with water', 6, 10, 30),
(2, 7, 'Telma 40 (Telmisartan)', '40mg', 'Once daily at night', 'Bedtime intake with a glass of water', 22, 5, 30),
(3, 7, 'Becadexamin Zinc Multivitamin', '1 Capsule', 'Once daily', 'After lunch daily', 14, 5, 15),
(4, 8, 'Shelcal 500 (Calcium + Vit D3)', '500mg', 'Once daily', 'Post breakfast for bone density support', 5, 10, 30),
(5, 8, 'Thyronorm 50mcg (Levothyroxine)', '50mcg', 'Once daily early morning', 'Empty stomach 30 mins before morning tea', 18, 5, 30),
(6, 9, 'Ecosprin 75 (Aspirin)', '75mg', 'Once daily', 'Post lunch blood thinner', 20, 10, 60),
(7, 9, 'Atorva 20 (Atorvastatin)', '20mg', 'Once daily at bedtime', 'Cholesterol management', 15, 7, 60),
(8, 10, 'Glycomet Trio 2', '2mg/500mg/0.3mg', 'Once daily morning', 'Before breakfast for type-2 diabetes', 8, 10, 30),
(9, 11, 'Saaz 500 (Sulfasalazine)', '500mg', 'Twice daily', 'Post meals for joint inflammation', 12, 10, 30);

-- 7. Dose Schedules for Today
INSERT INTO dose_schedules (id, patient_id, medicine_id, scheduled_slot, scheduled_time, scheduled_date, status, taken_at) VALUES
(1, 7, 1, 'MORNING', '08:00:00', CURRENT_DATE(), 'TAKEN', CURRENT_TIMESTAMP()),
(2, 7, 3, 'AFTERNOON', '13:30:00', CURRENT_DATE(), 'PENDING', NULL),
(3, 7, 1, 'NIGHT', '20:30:00', CURRENT_DATE(), 'PENDING', NULL),
(4, 7, 2, 'NIGHT', '20:30:00', CURRENT_DATE(), 'PENDING', NULL),
(5, 8, 5, 'MORNING', '07:00:00', CURRENT_DATE(), 'TAKEN', CURRENT_TIMESTAMP()),
(6, 8, 4, 'MORNING', '08:30:00', CURRENT_DATE(), 'PENDING', NULL),
(7, 9, 6, 'AFTERNOON', '13:00:00', CURRENT_DATE(), 'PENDING', NULL),
(8, 9, 7, 'NIGHT', '21:00:00', CURRENT_DATE(), 'PENDING', NULL),
(9, 10, 8, 'MORNING', '08:00:00', CURRENT_DATE(), 'MISSED', NULL),
(10, 11, 9, 'MORNING', '08:30:00', CURRENT_DATE(), 'PENDING', NULL),
(11, 11, 9, 'NIGHT', '20:30:00', CURRENT_DATE(), 'PENDING', NULL);

-- 8. Refill Orders
INSERT INTO refill_orders (id, patient_id, chemist_id, medicine_id, quantity, status, ordered_date, notes) VALUES
(1, 7, 4, 1, 30, 'OUT_FOR_DELIVERY', CURRENT_DATE(), 'Automatic refill triggered by low stock alert (6 remaining). Dispatched with rider Ravi.'),
(2, 8, 4, 4, 30, 'PACKED', CURRENT_DATE(), 'Refill requested by Caretaker Dr. Ananya. Packed and awaiting courier dispatch.'),
(3, 9, 5, 6, 30, 'DELIVERED', CURRENT_DATE(), 'Delivered to Villa 58, Prestige Palms, Whitefield. Signed by Vikram.'),
(4, 10, 6, 8, 30, 'REQUESTED', CURRENT_DATE(), 'Urgent refill requested by Patient Meena Patel.');

-- 9. Caretaker Alerts
INSERT INTO caretaker_alerts (id, caretaker_id, patient_id, alert_type, message, resolved, created_at) VALUES
(1, 1, 7, 'INVENTORY_NOTICE', 'Inventory Warning: Ramesh Sharma has 6 tablets remaining of Metformin 500mg (3 days supply remaining).', FALSE, CURRENT_TIMESTAMP()),
(2, 1, 8, 'INVENTORY_NOTICE', 'Low Stock Refill: Kanta Sharma has 5 tablets of Shelcal 500 remaining. Auto-refill order dispatched to Apollo Pharmacy.', FALSE, CURRENT_TIMESTAMP()),
(3, 2, 10, 'MISSED_DOSE', 'Missed Dose Radar: Meena Patel did not take Morning Glycomet Trio within the scheduled intake window (08:00 AM - 09:30 AM).', FALSE, CURRENT_TIMESTAMP());

-- 10. Clinical Governance Audit Logs
INSERT INTO audit_logs (id, event_type, description, actor, patient_name, severity, timestamp) VALUES
(1, 'USER_REGISTERED', 'Ramesh Sharma registered geriatric patient account under Care Code PAT-RAMESH-01', 'Ramesh Sharma', 'Ramesh Sharma', 'INFO', CURRENT_TIMESTAMP()),
(2, 'CARETAKER_LINKED', 'Dr. Ananya Sharma verified and bonded as primary clinical caretaker.', 'Dr. Ananya Sharma', 'Ramesh Sharma', 'INFO', CURRENT_TIMESTAMP()),
(3, 'CHEMIST_BOUND', 'Apollo 24/7 Pharmacy (MG Road) linked as designated pharmaceutical fulfillment partner.', 'Dr. Ananya Sharma', 'Ramesh Sharma', 'INFO', CURRENT_TIMESTAMP()),
(4, 'DOSE_TAKEN', 'Ramesh Sharma completed Morning Metformin Glycomet dose at 08:00 AM.', 'Ramesh Sharma', 'Ramesh Sharma', 'INFO', CURRENT_TIMESTAMP()),
(5, 'MISSED_DOSE_ESCALATION', 'Missed dose telemetry alert dispatched for Meena Patel morning insulin regimen.', 'SYSTEM_TELEMETRY', 'Meena Patel', 'WARNING', CURRENT_TIMESTAMP());
