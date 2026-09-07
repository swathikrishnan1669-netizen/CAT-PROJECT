@echo off
echo =====================================================================
echo  Starting Dairy Cold-Chain in Development Mode (Vite + FastAPI)
echo =====================================================================

set "CURRENT_DIR=%~dp0"
set "PATH=%CURRENT_DIR%tools\node;%PATH%"

echo Starting backend on http://localhost:8000 ...
start "Dairy Backend" cmd /k "python backend/main.py"

echo Starting frontend dev server on http://localhost:5173 ...
cd frontend
npm run dev
pause
