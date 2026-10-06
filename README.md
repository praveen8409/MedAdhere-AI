# MedAdhere AI: Enterprise Multi-Tenant Geriatric Adherence, Clinical Governance & Real-Time Pharmacy Refill Mesh

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![SSE](https://img.shields.io/badge/Streaming-Server--Sent%20Events-red.svg)]()
[![License](https://img.shields.io/badge/Architecture-Closed--Loop%20Mesh-teal.svg)]()

---

## 1. System Overview & Real-Life Clinical Story

To understand how the entire system functions as a connected loop, consider the clinical journey of **Ramesh Sharma** (72-year-old Diabetic & Hypertension Patient), his daughter **Dr. Ananya Sharma** (Primary Caretaker), and **Apollo Pharmacy Main Market** (Local Chemist).

```
+----------------------------------------------------------------------------------------------------+
|                                    COMPLETE SYSTEM LIFECYCLE                                       |
+----------------------------------------------------------------------------------------------------+
  [Day 1: Onboarding]
    Ramesh registers ---> Generates Link Code "CARE01" ---> Ananya registers using "CARE01"
    (Bi-directional pairing established in database; Ananya selects Apollo Pharmacy)
                                         |
                                         v
  [Day 1: Caretaker Setup]
    Ananya adds "Metformin 500mg" (2 tabs/day, 6 tabs in box, 90-day course)
    (Prescription locked; Ramesh gets read-only access on his phone)
                                         |
                                         v
  [Day 2, 8:00 AM: Dose Scheduled]
    Dose due ---> Ramesh's phone chimes + Voice reads alert aloud
                                         |
            +----------------------------+----------------------------+
            | Scenario A: Action Taken                                | Scenario B: Dose Missed
            v                                                         v
    Ramesh clicks "Dose Taken"                               No click for 90 minutes (9:30 AM)
    - Stock decrements: 6 -> 5 tabs                          - State flips: PENDING -> MISSED
    - Burn-Rate Engine triggers:                             - Dead-Man's Timer fires SSE alert
      (5 tabs / 2 per day = 2.5 days <= 5)                   - Ananya's phone rings with RED alert:
    - Auto-Refill Order dispatched to Apollo Chemist           "Dadaji missed morning BP medication!"
            |
            v
  [Day 2, 10:00 AM: Supply Fulfillment]
    Apollo Chemist opens dashboard ---> Sees Ramesh's low-stock alert
    Chemist clicks "Pack & Dispatch 30-Day Strip"
    - Database updates Ramesh's inventory: 5 + 30 = 35 tablets
    - Status cleared; both Ramesh and Ananya receive confirmation alerts
                                         |
                                         v
  [Anytime: AI Consultation]
    Ramesh asks chatbot: "How many days left for my Metformin?"
    AI reads database -> "42 days completed out of 90. 48 days remaining. Current stock: 35 tabs."
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Comprehensive Directory of Pages & Features (7 Core Views)

```
                                  +-----------------------+
                                  |      App Router       |
                                  +-----------+-----------+
                                              |
      +-------------------+-------------------+-------------------+-------------------+
      |                   |                   |                   |                   |
      v                   v                   v                   v                   v
[Auth & Onboarding] [Patient Portal]    [Caretaker Desk]   [Chemist Terminal]   [Audit Ledger]
- Login & Demo Chips - Daily Schedule   - Patient Switcher - Refill Queue       - Tamper Log
- Link Code Register - "Mark Taken"     - Add Prescription - 1-Click Dispatch   - Stress Simulators
- OTP Reset Modal    - AI Pharmacist    - Missed Dose Radar- Privacy Masking
```

### Page 1: Authentication & Dynamic Link-Code Onboarding
- **1-Click Evaluation Personas**: Instant login buttons for Dadaji (`ramesh@patient.com`), Dr. Ananya (`ananya@caretaker.com`), and Apollo Chemist (`apollo@chemist.com`).
- **Family Link Code Engine**: Patients generate unique 6-character link codes (`CARE01`, `CARE02`). Caretakers bind them at registration (`Ramesh.caretaker_id = Ananya.id`).
- **2-Step OTP Password Reset Simulation**: Code `482910` generated with 15-minute expiration window to test identity verification.

### Page 2: Patient Senior-Friendly Dashboard
- **Elder Accessibility Layout**: High-contrast theme, large tactile buttons ($\ge 48\text{px}$ touch targets), high legibility font sizes.
- **Visual Audio Reminder Banner**: Animated bell banner with Web Audio chime and Web Speech synthesis read-aloud.
- **"✓ DOSE TAKEN (DOSE LIYA)" Button**: Atomic row-level lock decrementing stock, celebratory confetti burst, and status flip (`PENDING` &rarr; `TAKEN`).
- **Locked Prescription Safety**: Prescription cards show lock icons with Caretaker attribution (`Prescription locked by Ananya Sharma`).
- **One-Touch Emergency Calling**: Direct phone dialer link (`tel:+919876543210`) to primary caretaker.

### Page 3: Context-Aware "AI Pharmacist" Chatbot
- **Live In-Memory Prescription Analysis**: Reads database records directly (`totalCourseDays: 90`, `daysCompleted: 42`, `remaining: 48`, `currentStock: 6`).
- **Pre-Built Suggestion Chips**:
  - `[💊 Metformin Duration?]` &rarr; Returns course progress and box exhaustion forecast.
  - `[⏰ Telma 40 Timing?]` &rarr; Returns dinner timing and hydration rules.
  - `[⚠️ Skipped Dose Protocol?]` &rarr; Returns clinical guidance on what to do when a dose is missed.
- **Ready-To-Action Item Execution**: 1-click execution for reminders, refill courier expediting, and tele-consults.

### Page 4: Caretaker Supervision & Governance Desk
- **Multi-Patient Switcher**: Toggle seamlessly between `Ramesh Sharma (Dadaji)` and `Kanta Sharma (Mother)` with zero reload.
- **Adherence Compliance Gauge**: Real-time adherence scorecard (`86% Adherence`, `3 Scheduled`, `2 Taken`, `1 Missed/Late`).
- **Full Clinical Prescription CRUD**: Caretakers can prescribe new drugs, set duration (e.g., 60 days), daily frequencies, and instructions.
- **Bound Chemist Selector**: Dropdown to select and update the pharmacy fulfilling the patient's refills (`Apollo Pharmacy Main Market`).
- **Missed-Dose Radar (Dead-Man's Timer)**: Pulsing alert card for doses unacknowledged past 90 minutes.

### Page 5: Chemist Auto-Refill Fulfillment Terminal
- **Autonomous Low-Stock Queue**: Triggered automatically when remaining days supply drops $\le 5\text{ days}$.
- **Privacy-Safe Data Minimization**: Shows only operational delivery details (Patient Name, Flat 402, Drug, Strip Size, Caretaker Contact) without diagnostic histories.
- **1-Click Refill Dispatch**: Clicking `"Pack & Dispatch 30-Day Strip"` fulfills the order and automatically adds 30 tablets to the patient's database inventory ($5 + 30 = 35$ tablets).

### Page 6: System-Wide Real-Time Notification Drawer
- **Server-Sent Events (SSE)**: Live streaming push connection (`/api/notifications/stream`) pushes alerts instantly without polling.
- **Persistent Navbar Bell**: Unread badge counter with slide-over drawer and severity levels (`INFO`, `WARNING`, `CRITICAL`).
- **Web Audio & Synthetic Voice**: Alerts trigger a synthesized audio chime and speak aloud when emergency events fire.

### Page 7: In-Memory H2 Audit Trail & Chaos Simulator
- **Live 50-Record Transaction Ledger**: Millisecond-accurate audit trail of every database write (`DOSE_TAKEN`, `INVENTORY_DEDUCTED`, `REFILL_REQUESTED`, `AI_QUERY`).
- **4 Chaos Stress Simulators**:
  1. `Simulate 90-Min Missed Dose` &rarr; Forces dose to `MISSED` and fires dead-man's timer SSE escalation.
  2. `Simulate Low Stock Spike` &rarr; Drops Metformin to 3 tabs and triggers auto-refill order.
  3. `Simulate Emergency SOS` &rarr; Fires critical panic alert with sirens and audio broadcast.
  4. `Reset Scenario to Baseline` &rarr; Restores demo initial state.
- **H2 Embedded Database Console**: Direct access at `http://localhost:8080/h2-console` (`jdbc:h2:mem:medtrackerdb`, User: `sa`).

---

## 3. Technology Stack

- **Backend**:
  - Java 21 (JDK 21)
  - Spring Boot 3.3.4
  - Spring Security with Stateless JWT Tokens
  - Spring Data JPA with Hibernate ORM
  - In-Memory H2 Database Engine
  - SseEmitter for Real-Time Server-Sent Events Push
- **Frontend**:
  - Vite 5.4.21 & React 18.3.1
  - Lucide React Iconography
  - Canvas Confetti
  - Web Speech Synthesis API & Web Audio API
  - Pure Vanilla CSS Design System with High-Contrast Tokens

---

## 4. Pre-Seeded Evaluation Personas

| Persona | Role | Username | Password | Key Role & Link Code |
| :--- | :--- | :--- | :--- | :--- |
| **Ramesh Sharma (Dadaji)** | `ROLE_PATIENT` | `ramesh_patient` | `password123` | Patient, 72 yrs, Link Code: `CARE01` |
| **Dr. Ananya Sharma** | `ROLE_CARETAKER` | `ananya_caretaker` | `password123` | Caretaker Daughter, linked to `CARE01` & `CARE02` |
| **Apollo Pharmacy** | `ROLE_CHEMIST` | `apollo_chemist` | `password123` | Local Chemist, Main Market |
| **Kanta Sharma (Mother)** | `ROLE_PATIENT` | `kanta_patient` | `password123` | Patient, 68 yrs, Link Code: `CARE02` |

---

## 5. Running the Platform Locally

### 1. Launch Spring Boot Backend
```powershell
cd D:\M.Tech\medadhere-platform\backend
.\mvnw.cmd spring-boot:run
```
- Server: `http://localhost:8080`
- H2 Console: `http://localhost:8080/h2-console` (`jdbc:h2:mem:medtrackerdb`, User: `sa`, Password: empty)

### 2. Launch Vite React Frontend
```powershell
cd D:\M.Tech\medadhere-platform\frontend
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 6. End-to-End Evaluation Verification Script

To verify all 7 views and API contracts synchronously:
```powershell
powershell -ExecutionPolicy Bypass -File scratch\test_flow.ps1
```
All endpoints return HTTP 200/OK with verified state transitions.
