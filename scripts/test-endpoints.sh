#!/bin/bash

# Script para probar todos los endpoints del sistema de inventario
# Fecha: 21 de junio de 2025

echo "🚀 Iniciando pruebas de endpoints del sistema de inventario..."
echo "=================================================="

BASE_URL="http://localhost:3002"
API_BASE="/api/v1"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para hacer requests y verificar respuesta
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    echo -e "\n${YELLOW}Probando:${NC} $description"
    echo "Endpoint: $method $endpoint"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$BASE_URL$endpoint")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} - Status: $http_code"
        if [ ! -z "$body" ]; then
            echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
        fi
    else
        echo -e "${RED}❌ FAILED${NC} - Expected: $expected_status, Got: $http_code"
        echo "Response: $body"
    fi
}

# Test 1: Health Check
test_endpoint "GET" "/health" 200 "Health Check"

# Test 2: Metrics
test_endpoint "GET" "/metrics" 200 "Prometheus Metrics"

# Test 3: Dashboard Stats (Público)
test_endpoint "GET" "$API_BASE/dashboard/stats" 200 "Dashboard Statistics (Public)"

# Test 4: Public Products
test_endpoint "GET" "$API_BASE/public/products" 200 "Public Products List"

# Test 5: Public Categories
test_endpoint "GET" "$API_BASE/public/categories" 200 "Public Categories List"

# Test 6: Protected endpoints (sin autenticación - deben fallar)
test_endpoint "GET" "$API_BASE/products" 401 "Protected Products (should fail without auth)"
test_endpoint "GET" "$API_BASE/users" 401 "Protected Users (should fail without auth)"
test_endpoint "GET" "$API_BASE/categories" 401 "Protected Categories (should fail without auth)"

echo -e "\n=================================================="
echo -e "${GREEN}🎉 Pruebas de endpoints completadas!${NC}"
echo "=================================================="

# Test adicional: Verificar que la base de datos está conectada
echo -e "\n${YELLOW}Verificando conexión a la base de datos...${NC}"
docker exec inventory-db pg_isready -U inventory_user -d inventory_db

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos conectada correctamente${NC}"
else
    echo -e "${RED}❌ Error de conexión con la base de datos${NC}"
fi

# Mostrar estado de contenedores
echo -e "\n${YELLOW}Estado actual de los contenedores:${NC}"
docker-compose ps
