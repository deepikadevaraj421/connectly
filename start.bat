@echo off
echo ========================================================
echo   Starting Connectly (Social & Messaging Platform)
echo ========================================================

echo Starting Backend Server on http://127.0.0.1:8000 ...
start "Connectly Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo Starting Frontend Dev Server on http://localhost:5173 ...
start "Connectly Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul

echo.
echo ========================================================
echo   Connectly is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000/docs
echo ========================================================
start http://localhost:5173
