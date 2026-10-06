@echo off
REM ==============================================================================
REM MedAdhere AI - Database Test Data Population Batch Runner
REM ==============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0populate_database.ps1"
pause
