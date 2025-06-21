#!/bin/bash

# Script para verificar el estado del despliegue Docker del proyecto DevOps Inventario

echo "🔍 VERIFICACIÓN DEL DESPLIEGUE DOCKER"
echo "======================================"
echo

# Verificar que Docker esté corriendo
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose"
    exit 1
fi

echo "📊 Estado de los contenedores:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo

echo "🌐 Verificando conectividad de servicios..."

# Backend
if curl -s http://localhost:3002/health >/dev/null; then
    echo "✅ Backend API (http://localhost:3002/health)"
else
    echo "❌ Backend API no responde"
fi

# Frontend
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo "✅ Frontend (http://localhost:3000)"
else
    echo "❌ Frontend no responde"
fi

# Prometheus
if curl -s "http://localhost:9090/api/v1/query?query=up" >/dev/null; then
    echo "✅ Prometheus (http://localhost:9090)"
else
    echo "❌ Prometheus no responde"
fi

# Grafana
if curl -s -I http://localhost:3003 | grep -q "302 Found\|200 OK"; then
    echo "✅ Grafana (http://localhost:3003)"
else
    echo "❌ Grafana no responde"
fi

# SonarQube
if curl -s -I http://localhost:9000 | grep -q "200"; then
    echo "✅ SonarQube (http://localhost:9000)"
else
    echo "❌ SonarQube no responde"
fi

# Selenium Hub
if curl -s -I http://localhost:4444 >/dev/null 2>&1; then
    echo "✅ Selenium Hub (http://localhost:4444)"
else
    echo "❌ Selenium Hub no responde"
fi

# PostgreSQL
if docker exec inventory-db pg_isready -U inventory_user -d inventory_db >/dev/null 2>&1; then
    echo "✅ PostgreSQL (localhost:5432)"
else
    echo "❌ PostgreSQL no responde"
fi

echo
echo "🎯 URLs de acceso:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:3002/health"
echo "   Prometheus:  http://localhost:9090"
echo "   Grafana:     http://localhost:3003 (admin/admin)"
echo "   SonarQube:   http://localhost:9000 (admin/admin)"
echo "   Selenium:    http://localhost:4444"
echo
echo "📁 Para detener todos los servicios: docker-compose down"
echo "📁 Para ver logs: docker-compose logs [servicio]"
