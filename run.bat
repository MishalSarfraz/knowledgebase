@echo off
title Internal Knowledge Base
echo ==========================================================
echo           INTERNAL KNOWLEDGE BASE BOOTSTRAPPER
echo ==========================================================
echo.

cd /d "%~dp0"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found.
    echo Please install Node.js ^(v18 or higher^) from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed.
    echo.
)

:: 3. Run Prisma migrations
echo [INFO] Applying database migrations...
call npx prisma migrate deploy 2>nul
if %errorlevel% neq 0 (
    echo [INFO] No existing migrations found. Running db push instead...
    call npx prisma db push
    if %errorlevel% neq 0 (
        echo [ERROR] Database setup failed. Check your DATABASE_URL in .env
        pause
        exit /b 1
    )
)
echo [SUCCESS] Database ready.
echo.

:: 4. Start development server
echo ==========================================================
echo   Starting development server...
echo   URL: http://localhost:3000
echo   Press Ctrl+C to stop.
echo ==========================================================
echo.
call npm run dev
pause
