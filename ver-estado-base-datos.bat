@echo off
title OmniStore - Estado de Base de Datos PostgreSQL en Supabase
color 0A
cls
echo ==============================================================================
echo        OMNISTORE - ESTADO DE BASE DE DATOS POSTGRESQL (SUPABASE)
echo ==============================================================================
echo.

node scripts/db-status.mjs

echo.
echo ==============================================================================
echo Presiona cualquier tecla para salir.
echo ==============================================================================
pause >nul
