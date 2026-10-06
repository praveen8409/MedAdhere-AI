@echo off
REM ============================================================================
REM MedAdhere AI Maven Wrapper
REM ============================================================================
if exist "%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd" (
    "%~dp0.tools\apache-maven-3.9.9\bin\mvn.cmd" %*
) else (
    mvn %*
)
