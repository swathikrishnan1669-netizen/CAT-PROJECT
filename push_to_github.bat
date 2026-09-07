@echo off
echo =====================================================================
echo  Pushing Dairy Cold-Chain Project to GitHub
echo  Target: https://github.com/swathikrishnan1669-netizen/CAT-PROJECT
echo =====================================================================
echo.

set "CURRENT_DIR=%~dp0"
set "PATH=%CURRENT_DIR%tools\git\cmd;%CURRENT_DIR%tools\git\mingw64\bin;%PATH%"

echo 1. Checking git status...
git status

echo.
echo 2. Ensuring remote origin is set...
git remote -v

echo.
echo 3. Pushing branch main to GitHub...
echo (If prompted, a browser window will open to authorize GitHub)
echo.
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo =====================================================================
    echo  SUCCESS! Entire project pushed to GitHub!
    echo  View it at: https://github.com/swathikrishnan1669-netizen/CAT-PROJECT
    echo =====================================================================
) else (
    echo =====================================================================
    echo  Push failed or cancelled. Check your network or GitHub permissions.
    echo =====================================================================
)

pause
