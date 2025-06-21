#!/bin/bash

# Script para ejecutar pruebas de rendimiento con JMeter
# Archivo: run-jmeter-tests.sh

set -e

echo "⚡ Iniciando pruebas de rendimiento con JMeter..."

# Variables de configuración
JMETER_VERSION="5.5"
JMETER_HOME="/opt/apache-jmeter-${JMETER_VERSION}"
RESULTS_DIR="results"
TEST_PLAN="inventory-api-performance-test.jmx"

# Función para mostrar mensajes
log() {
    echo "✅ [JMETER] $1"
}

error() {
    echo "❌ [JMETER] $1"
    exit 1
}

# Verificar si JMeter está instalado
if [ ! -d "$JMETER_HOME" ]; then
    log "JMeter no encontrado, descargando..."
    
    # Crear directorio temporal
    mkdir -p /tmp/jmeter-download
    cd /tmp/jmeter-download
    
    # Descargar JMeter
    wget "https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz"
    
    # Extraer y mover a /opt
    tar -xzf "apache-jmeter-${JMETER_VERSION}.tgz"
    sudo mv "apache-jmeter-${JMETER_VERSION}" /opt/
    
    # Limpiar archivos temporales
    cd -
    rm -rf /tmp/jmeter-download
    
    log "JMeter ${JMETER_VERSION} instalado en ${JMETER_HOME}"
fi

# Crear directorio de resultados
mkdir -p "$RESULTS_DIR"

# Verificar que el plan de pruebas existe
if [ ! -f "$TEST_PLAN" ]; then
    error "No se encontró el plan de pruebas: $TEST_PLAN"
fi

# Obtener timestamp para los archivos de resultado
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Archivos de resultado
JTL_FILE="${RESULTS_DIR}/results_${TIMESTAMP}.jtl"
LOG_FILE="${RESULTS_DIR}/jmeter_${TIMESTAMP}.log"
REPORT_DIR="${RESULTS_DIR}/html_report_${TIMESTAMP}"

log "Ejecutando plan de pruebas: $TEST_PLAN"
log "Archivo de resultados: $JTL_FILE"
log "Archivo de log: $LOG_FILE"
log "Reporte HTML: $REPORT_DIR"

# Ejecutar JMeter en modo no-GUI
"${JMETER_HOME}/bin/jmeter" \
    -n \
    -t "$TEST_PLAN" \
    -l "$JTL_FILE" \
    -j "$LOG_FILE" \
    -e \
    -o "$REPORT_DIR"

# Verificar que la ejecución fue exitosa
if [ $? -eq 0 ]; then
    log "✨ Pruebas de rendimiento completadas exitosamente"
    log "Resultados disponibles en: $RESULTS_DIR"
    
    # Mostrar resumen básico
    if command -v python3 &> /dev/null; then
        log "Generando resumen de resultados..."
        python3 - << EOF
import csv
import sys

try:
    with open('$JTL_FILE', 'r') as f:
        reader = csv.DictReader(f)
        success_count = 0
        error_count = 0
        response_times = []
        
        for row in reader:
            if row['success'] == 'true':
                success_count += 1
                response_times.append(int(row['elapsed']))
            else:
                error_count += 1
        
        total_requests = success_count + error_count
        success_rate = (success_count / total_requests * 100) if total_requests > 0 else 0
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        print(f"📊 RESUMEN DE RESULTADOS:")
        print(f"   Total de solicitudes: {total_requests}")
        print(f"   Solicitudes exitosas: {success_count}")
        print(f"   Solicitudes con error: {error_count}")
        print(f"   Tasa de éxito: {success_rate:.2f}%")
        print(f"   Tiempo de respuesta promedio: {avg_response_time:.2f}ms")
        
except Exception as e:
    print(f"No se pudo generar el resumen: {e}")
EOF
    fi
    
    log "Reporte HTML generado en: $REPORT_DIR/index.html"
else
    error "Las pruebas de rendimiento fallaron"
fi
