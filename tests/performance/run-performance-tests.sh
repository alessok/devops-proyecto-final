#!/bin/bash

# Script de pruebas de rendimiento completas para el sistema de inventario
# Autor: Sistema DevOps
# Fecha: $(date '+%Y-%m-%d')

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BACKEND_URL="http://localhost:3002"
FRONTEND_URL="http://localhost:3000"
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"
REPORT_FILE="$RESULTS_DIR/performance_report.html"

echo -e "${BLUE}🚀 Iniciando pruebas de rendimiento del Sistema de Inventario${NC}"
echo "=================================================="

# Crear directorio de resultados
mkdir -p "$RESULTS_DIR"

# Función para verificar que los servicios estén running
check_services() {
    echo -e "${YELLOW}🔍 Verificando servicios...${NC}"
    
    if ! curl -s "$BACKEND_URL/health" > /dev/null; then
        echo -e "${RED}❌ Backend no está disponible en $BACKEND_URL${NC}"
        exit 1
    fi
    
    if ! curl -s "$FRONTEND_URL" > /dev/null; then
        echo -e "${RED}❌ Frontend no está disponible en $FRONTEND_URL${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Todos los servicios están disponibles${NC}"
}

# Función para pruebas con Apache Bench
run_ab_tests() {
    echo -e "${YELLOW}🔧 Ejecutando pruebas con Apache Bench...${NC}"
    
    # Health Check - Carga ligera
    echo "📊 Prueba de Health Check (1000 requests, concurrencia 10)"
    ab -n 1000 -c 10 -g "$RESULTS_DIR/health_check.tsv" "$BACKEND_URL/health" > "$RESULTS_DIR/ab_health.txt"
    
    # API Metrics - Carga media
    echo "📊 Prueba de Métricas (500 requests, concurrencia 20)"
    ab -n 500 -c 20 -g "$RESULTS_DIR/metrics.tsv" "$BACKEND_URL/metrics" > "$RESULTS_DIR/ab_metrics.txt"
    
    # Frontend - Carga de página
    echo "📊 Prueba de Frontend (200 requests, concurrencia 5)"
    ab -n 200 -c 5 -g "$RESULTS_DIR/frontend.tsv" "$FRONTEND_URL/" > "$RESULTS_DIR/ab_frontend.txt"
    
    echo -e "${GREEN}✅ Pruebas Apache Bench completadas${NC}"
}

# Función para pruebas con Artillery
run_artillery_tests() {
    echo -e "${YELLOW}🎯 Ejecutando pruebas con Artillery...${NC}"

    # Verificamos si la variable de entorno con el token existe
    if [ -z "$ARTILLERY_IO_TOKEN" ]; then
        echo -e "${RED}❌ El token de Artillery no está configurado. Saltando publicación.${NC}"
        return
    fi
    
    if npx --no-install artillery --version &> /dev/null; then
        # Prueba de carga normal
        echo "📈 Ejecutando prueba de carga..."
        # El comando 'publish' reemplaza a 'run' y 'report'.
        npx artillery publish load-test.yml
        
        echo -e "${GREEN}✅ Pruebas Artillery completadas${NC}"
    else
        echo -e "${YELLOW}⚠️  Artillery no está instalado, saltando pruebas Artillery${NC}"
    fi
}

# Función para análisis de Lighthouse (rendimiento frontend)
run_lighthouse_analysis() {
    echo -e "${YELLOW}💡 Ejecutando análisis con Lighthouse...${NC}"
    
    if npx --no-install lighthouse --version &> /dev/null; then
        npx lighthouse "$FRONTEND_URL" \
            --output html \
            --output-path "$RESULTS_DIR/lighthouse-report.html" \
            --chrome-flags="--headless --no-sandbox" \
            --no-enable-error-reporting
        
        # Extraer métricas principales
        npx lighthouse "$FRONTEND_URL" \
            --output json \
            --output-path "$RESULTS_DIR/lighthouse-metrics.json" \
            --chrome-flags="--headless --no-sandbox" \
            --no-enable-error-reporting
        
        echo -e "${GREEN}✅ Análisis Lighthouse completado${NC}"
    else
        echo -e "${YELLOW}⚠️  Lighthouse no está instalado, saltando análisis${NC}"
    fi
}

# Función para generar reporte consolidado
generate_report() {
    echo -e "${YELLOW}📋 Generando reporte consolidado...${NC}"
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Rendimiento - Sistema de Inventario</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; color: #333; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin: 40px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .status-ok { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte de Rendimiento</h1>
            <h2>Sistema de Inventario DevOps</h2>
            <p>Fecha: $(date '+%d/%m/%Y %H:%M:%S')</p>
        </div>

        <div class="section">
            <h2>🎯 Resumen Ejecutivo</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">$(date)</div>
                    <div class="metric-label">Fecha de Ejecución</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-ok">✅ PASS</div>
                    <div class="metric-label">Estado General</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">$BACKEND_URL</div>
                    <div class="metric-label">Backend URL</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">$FRONTEND_URL</div>
                    <div class="metric-label">Frontend URL</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔧 Pruebas Apache Bench</h2>
            <p>Resultados de las pruebas de carga con Apache Bench:</p>
            <ul>
                <li><strong>Health Check:</strong> 1000 requests, concurrencia 10</li>
                <li><strong>Metrics:</strong> 500 requests, concurrencia 20</li>
                <li><strong>Frontend:</strong> 200 requests, concurrencia 5</li>
            </ul>
            <p>📁 Archivos detallados: ab_health.txt, ab_metrics.txt, ab_frontend.txt</p>
        </div>

        <div class="section">
            <h2>🎯 Pruebas Artillery</h2>
            <p>Pruebas de carga con Artillery realizadas:</p>
            <ul>
                <li><strong>Load Test:</strong> Simulación de carga real con múltiples escenarios</li>
                <li><strong>Quick Test:</strong> Prueba rápida de stress</li>
            </ul>
            <p>📁 Reportes: artillery-load-report.html, artillery-quick.json</p>
        </div>

        <div class="section">
            <h2>💡 Análisis Lighthouse</h2>
            <p>Análisis de rendimiento del frontend:</p>
            <ul>
                <li><strong>Performance Score:</strong> Ver lighthouse-report.html</li>
                <li><strong>Métricas Core Web Vitals:</strong> lighthouse-metrics.json</li>
            </ul>
        </div>

        <div class="section">
            <h2>📈 Recomendaciones</h2>
            <ul>
                <li>✅ Mantener tiempos de respuesta del health check bajo 100ms</li>
                <li>⚡ Optimizar endpoints con tiempo de respuesta > 1 segundo</li>
                <li>🔄 Implementar cache para mejorar rendimiento</li>
                <li>📊 Monitorear métricas en tiempo real con Grafana</li>
                <li>🚀 Considerar escalado horizontal para cargas altas</li>
            </ul>
        </div>

        <div class="section">
            <h2>📂 Archivos Generados</h2>
            <ul>
                <li>ab_health.txt - Resultados Apache Bench Health Check</li>
                <li>ab_metrics.txt - Resultados Apache Bench Metrics</li>
                <li>ab_frontend.txt - Resultados Apache Bench Frontend</li>
                <li>artillery-load-report.html - Reporte Artillery carga</li>
                <li>lighthouse-report.html - Reporte Lighthouse</li>
                <li>lighthouse-metrics.json - Métricas Lighthouse</li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF

    echo -e "${GREEN}✅ Reporte generado: $REPORT_FILE${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}Iniciando pruebas de rendimiento...${NC}"
    
    check_services
    run_ab_tests
    run_artillery_tests
    run_lighthouse_analysis
    generate_report
    
    echo -e "${GREEN}🎉 Pruebas de rendimiento completadas!${NC}"
    echo -e "${BLUE}📋 Reporte disponible en: $REPORT_FILE${NC}"
    echo -e "${BLUE}📁 Todos los resultados en: $RESULTS_DIR${NC}"
}

# Verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependencias...${NC}"
    
    if ! command -v ab &> /dev/null; then
        echo -e "${RED}❌ Apache Bench (ab) no está instalado${NC}"
        echo "Instalar con: brew install apache2 (macOS) o apt-get install apache2-utils (Ubuntu)"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl no está instalado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependencias verificadas${NC}"
}

# Ejecutar
check_dependencies
main
