@echo off
title OmniStore - Migrar y Configurar Base de Datos PostgreSQL en Supabase
color 0B
cls
echo ==============================================================================
echo     OMNISTORE - MIGRACION Y CONFIGURACION DE BASE DE DATOS SUPABASE
echo ==============================================================================
echo.
echo Conectando a Supabase PostgreSQL y creando tablas...
echo.

node scripts/init-db.mjs

echo.
echo ==============================================================================
echo Proceso finalizado. Presiona cualquier tecla para salir.
echo ==============================================================================
pause >nul
