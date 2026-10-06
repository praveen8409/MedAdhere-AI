# ==============================================================================
# MedAdhere AI - Database Test Data Population Script
# ==============================================================================
param (
    [string]$BackendUrl = "http://localhost:8080",
    [switch]$ResetExisting = $true
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         MEDADHERE AI - MULTI-USER DATABASE SEEDER                   " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Connecting to: $BackendUrl/api/test-data/populate ..." -ForegroundColor Gray

$targetUrl = "$BackendUrl/api/test-data/populate?resetExisting=$($ResetExisting.ToString().ToLower())"

try {
    $response = Invoke-RestMethod -Uri $targetUrl -Method Post -TimeoutSec 30
} catch {
    # Fallback to GET if POST was blocked or proxied
    try {
        $response = Invoke-RestMethod -Uri $targetUrl -Method Get -TimeoutSec 30
    } catch {
        Write-Host ""
        Write-Host " [ERROR] Failed to reach MedAdhere Backend server!" -ForegroundColor Red
        Write-Host " Details: $($_.Exception.Message)" -ForegroundColor DarkRed
        Write-Host ""
        Write-Host " Please make sure your backend is running:" -ForegroundColor Yellow
        Write-Host "   cd backend && .\mvnw.cmd spring-boot:run" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host " SUCCESS! Test Data Seeded Successfully into Database." -ForegroundColor Green
Write-Host ""
Write-Host "--- Database Summary Counts ---" -ForegroundColor Cyan
Write-Host ("  Total Users in DB       : " + $response.totalUsers) -ForegroundColor White
Write-Host ("  Active Medicines        : " + $response.totalMedicines) -ForegroundColor White
Write-Host ("  Dose Schedules Today    : " + $response.totalSchedules) -ForegroundColor White
Write-Host ("  Active Refill Orders    : " + $response.totalRefills) -ForegroundColor White
Write-Host ("  Caretaker Alerts        : " + $response.totalAlerts) -ForegroundColor White
Write-Host ("  Assignment Requests     : " + $response.totalAssignmentRequests) -ForegroundColor White

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                TEST CREDENTIALS DIRECTORY (ALL ROLES)                " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Universal Password for ALL accounts: Password@123" -ForegroundColor Green
Write-Host ""

Write-Host "[1] CARETAKERS:" -ForegroundColor Magenta
Write-Host "  * Username: ananya_caretaker    | Name: Dr. Ananya Sharma   | Caring for: Ramesh Sharma, Kanta Sharma" -ForegroundColor White
Write-Host "  * Username: priya_caretaker     | Name: Nurse Priya Menon   | Caring for: Vikram Malhotra, Meena Iyer" -ForegroundColor White
Write-Host "  * Username: rajesh_caretaker    | Name: Rajesh Verma        | Pending Request: Suresh Patil" -ForegroundColor White

Write-Host ""
Write-Host "[2] CHEMISTS (PHARMACIES):" -ForegroundColor Blue
Write-Host "  * Username: apollo_chemist      | Store: Apollo 24/7 Pharmacy (MG Road)  | Orders: 2 Active" -ForegroundColor White
Write-Host "  * Username: sanjeevani_chemist  | Store: Sanjeevani Medicos             | Orders: 1 Active" -ForegroundColor White
Write-Host "  * Username: medplus_chemist     | Store: MedPlus Super Health            | Orders: 1 Delivered" -ForegroundColor White

Write-Host ""
Write-Host "[3] PATIENTS:" -ForegroundColor Green
Write-Host "  * Username: ramesh_patient      | Name: Ramesh Sharma (72y, Dadaji)     | Caretaker: Ananya | Chemist: Apollo" -ForegroundColor White
Write-Host "  * Username: kanta_patient       | Name: Kanta Sharma (68y, Mother)      | Caretaker: Ananya | Chemist: Apollo" -ForegroundColor White
Write-Host "  * Username: vikram_patient      | Name: Vikram Malhotra (55y, Cardiac)  | Caretaker: Priya  | Chemist: Sanjeevani" -ForegroundColor White
Write-Host "  * Username: meena_patient       | Name: Meena Iyer (62y, Diabetic)      | Caretaker: Priya  | Chemist: MedPlus" -ForegroundColor White
Write-Host "  * Username: suresh_patient      | Name: Suresh Patil (70y, Senior)      | Pending Assignment to Rajesh" -ForegroundColor White

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Open browser at: http://localhost:5173" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
