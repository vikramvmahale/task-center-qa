@echo off
echo Starting Playwright Tests...
echo.

if "%1"=="smoke" (
    echo Running Smoke Tests (TypeScript)...
    "C:\Program Files\nodejs\npm.cmd" run smoketest
) else if "%1"=="full" (
    echo Running Full Test Suite (TypeScript)...
    "C:\Program Files\nodejs\npm.cmd" run fullTest
) else if "%1"=="regression" (
    echo Running Regression Tests (TypeScript)...
    "C:\Program Files\nodejs\npm.cmd" run regression
) else (
    echo Usage: run-tests.bat [smoke|full|regression]
    echo.
    echo Examples:
    echo   run-tests.bat smoke      - Run smoke tests
    echo   run-tests.bat full       - Run full test suite
    echo   run-tests.bat regression - Run regression tests
)

pause
