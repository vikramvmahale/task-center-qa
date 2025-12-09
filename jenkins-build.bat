@echo off
echo Installing dependencies...
npm ci
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    exit /b 1
)

echo Running full test suite...
npm run fullTest
if %errorlevel% neq 0 (
    echo Tests failed
    exit /b 1
)

echo Build completed successfully
