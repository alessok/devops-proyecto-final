#!/bin/bash

# Test End-to-End del Sistema de Inventario
echo "🚀 PRUEBA END-TO-END DEL SISTEMA DE INVENTARIO"
echo "=============================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SUCCESS=0
TOTAL=0

test_result() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ Test $TOTAL: $2${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌ Test $TOTAL: $2${NC}"
    fi
}

echo -e "${BLUE}📊 1. Probando endpoints públicos de la API...${NC}"

# Test 1: Dashboard Stats
response=$(curl -s http://localhost:3002/api/v1/dashboard/stats)
total_products=$(echo "$response" | grep -o '"totalProducts":[0-9]*' | cut -d: -f2)
test_result $([ "$total_products" -gt "0" ] && echo 0 || echo 1) "Dashboard devuelve estadísticas ($total_products productos)"

# Test 2: Public Products
products_response=$(curl -s http://localhost:3002/api/v1/public/products)
products_count=$(echo "$products_response" | grep -o '"total":[0-9]*' | cut -d: -f2)
test_result $([ "$products_count" -gt "0" ] && echo 0 || echo 1) "Productos públicos ($products_count productos encontrados)"

# Test 3: Public Categories
categories_response=$(curl -s http://localhost:3002/api/v1/public/categories)
categories_count=$(echo "$categories_response" | grep -o '"total":[0-9]*' | cut -d: -f2)
test_result $([ "$categories_count" -gt "0" ] && echo 0 || echo 1) "Categorías públicas ($categories_count categorías encontradas)"

echo -e "${BLUE}🔒 2. Probando seguridad de endpoints protegidos...${NC}"

# Test 4: Protected endpoints return 401
protected_response=$(curl -s -w "%{http_code}" http://localhost:3002/api/v1/products -o /dev/null)
test_result $([ "$protected_response" = "401" ] && echo 0 || echo 1) "Endpoints protegidos requieren autenticación"

echo -e "${BLUE}🌐 3. Probando frontend...${NC}"

# Test 5: Frontend is accessible
frontend_response=$(curl -s -w "%{http_code}" http://localhost:3000/ -o /dev/null)
test_result $([ "$frontend_response" = "200" ] && echo 0 || echo 1) "Frontend React accesible"

# Test 6: Frontend serves static assets
frontend_html=$(curl -s http://localhost:3000/)
has_react=$(echo "$frontend_html" | grep -c "root\|React\|main.*js")
test_result $([ "$has_react" -gt "0" ] && echo 0 || echo 1) "Frontend contiene aplicación React"

echo -e "${BLUE}📈 4. Probando monitoreo...${NC}"

# Test 7: Prometheus metrics
metrics_response=$(curl -s http://localhost:3002/metrics | head -5)
has_metrics=$(echo "$metrics_response" | grep -c "# HELP\|# TYPE")
test_result $([ "$has_metrics" -gt "0" ] && echo 0 || echo 1) "Métricas de Prometheus disponibles"

# Test 8: Grafana is accessible
grafana_response=$(curl -s -w "%{http_code}" http://localhost:3003/ -o /dev/null)
test_result $([ "$grafana_response" = "302" ] && echo 0 || echo 1) "Grafana accesible (redirección a login)"

echo -e "${BLUE}💾 5. Probando base de datos...${NC}"

# Test 9: Database connection
db_products=$(docker-compose exec -T postgres psql -U inventory_user -d inventory_db -t -c "SELECT COUNT(*) FROM products WHERE is_active = true;" 2>/dev/null | tr -d ' ')
test_result $([ "$db_products" -gt "0" ] && echo 0 || echo 1) "Base de datos contiene productos ($db_products)"

# Test 10: Data consistency between API and DB
api_products_count=$(echo "$products_response" | grep -o '"total":[0-9]*' | cut -d: -f2)
test_result $([ "$api_products_count" = "$db_products" ] && echo 0 || echo 1) "Consistencia entre API y base de datos"

echo ""
echo -e "${BLUE}📊 RESUMEN DE PRUEBAS END-TO-END${NC}"
echo "================================="
echo -e "Pruebas exitosas: ${GREEN}$SUCCESS/$TOTAL${NC}"

if [ "$SUCCESS" -eq "$TOTAL" ]; then
    echo -e "${GREEN}🎉 TODAS LAS PRUEBAS PASARON - Sistema totalmente funcional${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Algunas pruebas fallaron - Revisar configuración${NC}"
    exit 1
fi
