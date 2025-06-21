#!/bin/bash

# 🚀 Script para subir el proyecto a GitHub
# =====================================

echo "🔗 CONFIGURANDO CONEXIÓN CON GITHUB"
echo "===================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Instrucciones:${NC}"
echo "1. Ve a https://github.com y crea un nuevo repositorio"
echo "2. Nómbralo 'devops-proyecto-final' (o el nombre que prefieras)"
echo "3. NO inicialices con README (ya tienes archivos)"
echo "4. Copia la URL HTTPS del repositorio"
echo ""

echo -e "${YELLOW}💡 La URL debe verse así:${NC}"
echo "https://github.com/TU_USUARIO/devops-proyecto-final.git"
echo ""

read -p "🔗 Pega aquí la URL de tu repositorio de GitHub: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Debes proporcionar la URL del repositorio"
    exit 1
fi

echo ""
echo -e "${BLUE}🔗 Configurando remote origin...${NC}"
git remote add origin $REPO_URL

echo -e "${BLUE}📤 Subiendo archivos a GitHub...${NC}"
git push -u origin main

echo ""
echo -e "${GREEN}✅ ¡Proyecto subido exitosamente a GitHub!${NC}"
echo ""
echo -e "${BLUE}🌐 Tu repositorio está disponible en:${NC}"
echo "$REPO_URL"
echo ""
echo -e "${YELLOW}📋 Contenido subido:${NC}"
echo "✅ Código fuente completo (frontend + backend)"
echo "✅ Configuración Docker Compose"
echo "✅ Base de datos y migraciones"
echo "✅ Scripts de testing y demostración"
echo "✅ Documentación completa"
echo "✅ Configuración de monitoreo"
echo "✅ Archivos de calidad de código"
echo ""
echo -e "${GREEN}🎉 ¡Tu proyecto DevOps está ahora en GitHub!${NC}"
