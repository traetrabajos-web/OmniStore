@echo off
echo =========================================================
echo    Compilando Proyecto Metis (Generando dist-modern)
echo =========================================================
echo.
call npm.cmd run build
echo.
echo =========================================================
echo    Compilacion completada con exito!
echo =========================================================
pause
