#!/bin/bash

# 🚀 SCRIPT DE DEMOSTRACIÓN COMPLETA
# Sistema de Gestión de Inventario - Proyecto DevOps Final
# =================================================

echo "🚀 INICIANDO DEMOSTRACIÓN COMPLETA DEL SISTEMA DE INVENTARIO"
echo "============================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar pasos
show_step() {
    echo ""
    echo -e "${BLUE}🔵 PASO $1: $2${NC}"
    echo "=================================================="
}

# Función para mostrar URLs
show_url() {
    echo -e "${GREEN}🌐 URL: $1${NC}"
}

# Función para mostrar credenciales
show_credentials() {
    echo -e "${YELLOW}🔑 Usuario: $1${NC}"
    echo -e "${YELLOW}🔑 Contraseña: $2${NC}"
}

# Función para esperar input del usuario
wait_for_user() {
    echo ""
    echo -e "${GREEN}▶️  Presiona Enter para continuar con la demostración...${NC}"
    read -r
}

# Función para verificar status de contenedores
check_containers() {
    echo ""
    echo "📊 Estado de los contenedores:"
    docker-compose ps
    echo ""
}

show_step 1 "VERIFICACIÓN DEL SISTEMA"
echo "Verificando que todos los servicios estén funcionando..."
check_containers

show_step 2 "APLICACIÓN FRONTEND PRINCIPAL"
echo "🎯 La aplicación principal está disponible en:"
show_url "http://localhost:3000"
echo ""
echo "📋 USUARIOS DISPONIBLES PARA TESTING:"
echo ""
echo "🔴 ADMINISTRADOR (Acceso completo):"
show_credentials "admin@inventory.com" "password"
echo ""
echo "🟡 MANAGER (Gestión de inventario):"
show_credentials "manager@inventory.com" "password"
echo ""
echo "🟢 EMPLEADO (Solo lectura):"
show_credentials "employee@inventory.com" "password"

wait_for_user

show_step 3 "ENDPOINTS PÚBLICOS DE LA API (Sin autenticación)"
echo "🌍 Estos endpoints están disponibles sin autenticación:"
echo ""

echo "📊 Dashboard Stats:"
show_url "http://localhost:3002/api/v1/dashboard/stats"
echo "Probando endpoint..."
curl -s http://localhost:3002/api/v1/dashboard/stats | jq .
echo ""

echo "📦 Productos Públicos:"
show_url "http://localhost:3002/api/v1/public/products"
echo "Probando endpoint..."
curl -s http://localhost:3002/api/v1/public/products | jq '.data | length' | xargs echo "Total de productos disponibles:"
echo ""

echo "🏷️ Categorías Públicas:"
show_url "http://localhost:3002/api/v1/public/categories"
echo "Probando endpoint..."
curl -s http://localhost:3002/api/v1/public/categories | jq '.data | length' | xargs echo "Total de categorías disponibles:"

wait_for_user

show_step 4 "SERVICIOS DE MONITOREO Y CALIDAD"
echo ""
echo "📊 Grafana (Dashboards y Monitoreo):"
show_url "http://localhost:3003"
show_credentials "admin" "admin123"
echo ""

echo "🔍 Prometheus (Métricas del Sistema):"
show_url "http://localhost:9090"
echo "No requiere autenticación"
echo ""

echo "🧪 SonarQube (Calidad de Código):"
show_url "http://localhost:9000"
show_credentials "admin" "admin123"
echo ""

echo "🎯 Selenium Hub (Testing Automatizado):"
show_url "http://localhost:4444"
echo "No requiere autenticación"

wait_for_user

show_step 5 "FUNCIONALIDADES CLAVE PARA DEMOSTRAR"
echo ""
echo "🎭 ESCENARIOS DE DEMOSTRACIÓN RECOMENDADOS:"
echo ""
echo "1️⃣ LOGIN COMO ADMINISTRADOR:"
echo "   - Acceder al dashboard completo"
echo "   - Gestionar usuarios (crear/editar/eliminar)"
echo "   - Ver todos los reportes"
echo "   - Gestión completa de productos y categorías"
echo ""

echo "2️⃣ LOGIN COMO MANAGER:"
echo "   - Dashboard sin gestión de usuarios"
echo "   - CRUD completo de productos"
echo "   - CRUD completo de categorías"
echo "   - Reportes de inventario"
echo ""

echo "3️⃣ LOGIN COMO EMPLEADO:"
echo "   - Dashboard solo lectura"
echo "   - Consulta de productos (sin edición)"
echo "   - Consulta de categorías (sin edición)"
echo "   - Sin acceso a usuarios ni reportes"
echo ""

echo "4️⃣ DATOS PRE-CARGADOS:"
echo "   - 🏷️ 6 categorías (Electrónicos, Ropa, Hogar, Deportes, Libros, Alimentación)"
echo "   - 📦 12 productos de ejemplo con stock y precios"
echo "   - 👥 3 usuarios con diferentes roles"

wait_for_user

show_step 6 "VERIFICACIÓN TÉCNICA FINAL"
echo ""
echo "🔧 Verificando conectividad de la base de datos..."
docker-compose exec -T postgres pg_isready -U postgres -d inventory_db
echo ""

echo "📡 Verificando endpoint de salud del backend..."
curl -s http://localhost:3002/health | jq .
echo ""

echo "🌐 Verificando frontend..."
curl -s -o /dev/null -w "Frontend HTTP Status: %{http_code}\\n" http://localhost:3000
echo ""

echo "📊 Métricas de Prometheus disponibles en:"
show_url "http://localhost:3002/metrics"

wait_for_user

show_step 7 "DATOS DE ACCESO COMPLETOS"
echo ""
echo "📋 RESUMEN DE CREDENCIALES:"
echo ""
echo "🎯 APLICACIÓN PRINCIPAL:"
show_url "http://localhost:3000"
echo ""
echo "🔐 USUARIOS DE LA APLICACIÓN:"
echo "   👑 admin@inventory.com / password (Administrador)"
echo "   👔 manager@inventory.com / password (Manager)"  
echo "   👤 employee@inventory.com / password (Empleado)"
echo ""
echo "🛠️ SERVICIOS AUXILIARES:"
echo "   📊 Grafana: http://localhost:3003 (admin/admin123)"
echo "   🔍 Prometheus: http://localhost:9090"
echo "   🧪 SonarQube: http://localhost:9000 (admin/admin123)"
echo "   🎯 Selenium: http://localhost:4444"
echo ""
echo "🗄️ BASE DE DATOS:"
echo "   🐘 PostgreSQL: localhost:5432"
echo "   📊 DB: inventory_db"
echo "   👤 Usuario: postgres / postgres123"

echo ""
echo "✅ SISTEMA COMPLETAMENTE OPERATIVO"
echo "🎉 LISTO PARA DEMOSTRACIÓN COMPLETA"
echo ""
echo -e "${GREEN}🚀 ¡Puedes comenzar la demostración accediendo a http://localhost:3000!${NC}"
echo ""

# Verificación final
echo "🔍 Verificación final de servicios:"
echo ""
docker-compose ps

echo ""
echo "📊 Estadísticas rápidas del sistema:"
echo "======================================"
curl -s http://localhost:3002/api/v1/dashboard/stats | jq '.data'
echo ""
echo "🎯 Sistema listo para presentación!"
