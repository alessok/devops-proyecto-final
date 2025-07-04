# Script para verificar que todos los servicios estén funcionando

Write-Host "===== Verificando servicios DevOps =====" -ForegroundColor Green

# Verificar contenedores
Write-Host "1. Verificando contenedores..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar Jenkins
Write-Host "`n2. Verificando Jenkins..." -ForegroundColor Yellow
try {
    $jenkins = Invoke-WebRequest -Uri "http://localhost:8080/login" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Jenkins está funcionando (Status: $($jenkins.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Jenkins no responde" -ForegroundColor Red
}

# Verificar SonarQube
Write-Host "`n3. Verificando SonarQube..." -ForegroundColor Yellow
try {
    $sonar = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ SonarQube está funcionando (Status: $($sonar.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ SonarQube no responde" -ForegroundColor Red
}

# Verificar Frontend
Write-Host "`n4. Verificando Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Frontend está funcionando (Status: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend no responde" -ForegroundColor Red
}

# Verificar Backend
Write-Host "`n5. Verificando Backend..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Backend está funcionando (Status: $($backend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend no responde" -ForegroundColor Red
}

# Verificar Database
Write-Host "`n6. Verificando Database..." -ForegroundColor Yellow
try {
    $dbStatus = docker exec inventory-db pg_isready -U inventory_user -d inventory_db
    if ($dbStatus -match "accepting connections") {
        Write-Host "✓ Database está funcionando" -ForegroundColor Green
    } else {
        Write-Host "✗ Database no responde" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error verificando Database" -ForegroundColor Red
}

# Verificar Prometheus
Write-Host "`n7. Verificando Prometheus..." -ForegroundColor Yellow
try {
    $prometheus = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Prometheus está funcionando (Status: $($prometheus.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Prometheus no responde" -ForegroundColor Red
}

# Verificar Grafana
Write-Host "`n8. Verificando Grafana..." -ForegroundColor Yellow
try {
    $grafana = Invoke-WebRequest -Uri "http://localhost:3003/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Grafana está funcionando (Status: $($grafana.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Grafana no responde" -ForegroundColor Red
}

# Verificar Selenium Hub
Write-Host "`n9. Verificando Selenium Hub..." -ForegroundColor Yellow
try {
    $selenium = Invoke-WebRequest -Uri "http://localhost:4444/wd/hub/status" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Selenium Hub está funcionando (Status: $($selenium.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Selenium Hub no responde" -ForegroundColor Red
}

# Verificar que Jenkins puede acceder a Docker
Write-Host "`n10. Verificando acceso de Jenkins a Docker..." -ForegroundColor Yellow
try {
    $dockerTest = docker exec jenkins docker --version
    if ($dockerTest -match "Docker version") {
        Write-Host "✓ Jenkins puede acceder a Docker" -ForegroundColor Green
    } else {
        Write-Host "✗ Jenkins no puede acceder a Docker" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error verificando acceso a Docker desde Jenkins" -ForegroundColor Red
}

# Verificar que Jenkins puede acceder a Node.js
Write-Host "`n11. Verificando acceso de Jenkins a Node.js..." -ForegroundColor Yellow
try {
    $nodeTest = docker exec jenkins node --version
    if ($nodeTest -match "v20") {
        Write-Host "✓ Jenkins puede acceder a Node.js 20" -ForegroundColor Green
    } else {
        Write-Host "✗ Jenkins no puede acceder a Node.js 20" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error verificando acceso a Node.js desde Jenkins" -ForegroundColor Red
}

Write-Host "`n===== Verificación completada =====" -ForegroundColor Green
Write-Host "Servicios disponibles en:" -ForegroundColor Cyan
Write-Host "- Jenkins: http://localhost:8080" -ForegroundColor White
Write-Host "- SonarQube: http://localhost:9000" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend: http://localhost:3002" -ForegroundColor White
Write-Host "- Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "- Grafana: http://localhost:3003 (admin/admin)" -ForegroundColor White
Write-Host "- Selenium Hub: http://localhost:4444" -ForegroundColor White
