// Jenkinsfile Final, Consolidado y con todas las etapas originales restauradas.
pipeline {
    agent any
    tools {
        nodejs 'NodeJS-20'
    }

    // Variables de entorno globales para todo el pipeline.
    environment {
        // Variables de entorno para el pipeline
        POSTGRES_DB             = 'inventory_db'
        POSTGRES_USER           = 'inventory_user'
        POSTGRES_PASSWORD       = 'inventory_pass'
        JWT_SECRET              = 'test-jwt-secret-for-ci'

        // Carga de secretos desde el gestor de credenciales de Jenkins
        SONARQUBE_TOKEN         = credentials('SONAR_TOKEN')
        DOCKER_HUB_CREDENTIALS  = credentials('docker-hub-credentials')
        ARTILLERY_TOKEN = credentials('artillery-token')
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                echo 'Cleaning up the workspace to ensure a fresh build...'
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('src/backend') {
                            echo 'Installing backend dependencies with npm ci...'
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('src/frontend') {
                            echo 'Installing frontend dependencies with npm ci...'
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Lint and Format Check') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('src/backend') {
                            echo 'Running backend linting...'
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('src/frontend') {
                            echo 'Running frontend linting...'
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('src/backend') {
                            echo 'Building backend...'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('src/frontend') {
                            echo 'Building frontend...'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Unit & Integration Tests') {
            agent {
                // Usamos un agente temporal de Docker. Esto evita los problemas de permisos del host.
                docker {
                    image 'docker:26.1.4' // Usamos una imagen oficial de Docker con Alpine
                    // Montamos el socket de Docker y conectamos este agente a la red principal del proyecto
                    args '-v /var/run/docker.sock:/var/run/docker.sock --network=devops-proyecto-final_inventory-network'
                }


            }
            steps {
                script {
                    // --- Preparación del Entorno ---
                    // El contenedor 'docker' no tiene Node.js, así que lo instalamos.
                    echo 'Installing Node.js and npm...'
                    sh 'apk add --update nodejs npm'

                    // --- Limpieza y Creación de la Base de Datos de Prueba ---
                    sh 'docker rm -f test-postgres || true'

                    echo 'Starting PostgreSQL container for testing...'
                    // Lanzamos la BD de prueba en la misma red que todo lo demás
                    sh '''
                        docker run -d --name test-postgres \\
                        --network=devops-proyecto-final_inventory-network \\
                        -e POSTGRES_DB=${POSTGRES_DB} \\
                        -e POSTGRES_USER=${POSTGRES_USER} \\
                        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \\
                        postgres:15-alpine
                    '''

                    echo 'Waiting for PostgreSQL to be ready...'
                    // Este bucle de espera es más robusto
                    sh '''
                        i=0
                        while [ $i -lt 20 ]; do
                            i=$((i + 1))
                            if docker exec test-postgres pg_isready -U ${POSTGRES_USER} -q; then
                                echo "PostgreSQL is ready!"
                                exit 0
                            fi
                            echo "Waiting for PostgreSQL... attempt $i"
                            sleep 2
                        done
                        echo "PostgreSQL failed to start in time."
                        exit 1
                    '''

                    echo 'Running database migrations...'
                    // El workspace se monta automáticamente, por lo que Jenkins encuentra los archivos.
                    sh '''
                        docker exec -i test-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < database/migrations/V3__create_backend_compatible_tables.sql
                        docker exec -i test-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < database/migrations/V4__insert_initial_data.sql
                    '''
                }

                // --- Ejecución de las Pruebas ---
                dir('src/backend') {
                    echo 'Installing backend dependencies...'
                    sh 'npm install'

                    echo 'Running backend tests and generating coverage report...'
                    // Todas las variables de entorno se definen para el comando de prueba
                    sh '''
                        export NODE_ENV=test
                        export DB_HOST=test-postgres
                        export DB_PORT=5432
                        export DB_NAME=${POSTGRES_DB}
                        export DB_USER=${POSTGRES_USER}
                        export DB_PASS=${POSTGRES_PASSWORD}
                        export JWT_SECRET=${JWT_SECRET}
                        npm test -- --coverage --watchAll=false
                    '''
                }
            }
            post {
                // El bloque 'post' también se ejecuta dentro del agente de Docker
                always {
                    echo 'Cleaning up test database container...'
                    sh 'docker rm -f test-postgres || true'

                    echo 'Publishing HTML coverage report...'
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'src/backend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        // VERSIÓN DEFINITIVA, CORRECTA Y ROBUSTA
        stage('SonarQube Static Analysis') {
            steps {
                // Mantenemos withSonarQubeEnv para que waitForQualityGate funcione
                // y para que nos dé las variables SONAR_HOST_URL y SONAR_AUTH_TOKEN.
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerContainer = "sonar-scanner-container-${env.BUILD_NUMBER}"
                        try {
                            sh "docker run -d --name ${scannerContainer} --network devops-proyecto-final_inventory-network sonarsource/sonar-scanner-cli:5.0 sleep 300"

                            sh "docker cp . ${scannerContainer}:/usr/src"

                            echo "Ejecutando el análisis de SonarScanner pasando el entorno de Jenkins..."

                            // La clave es que pasamos explícitamente las variables que prepara 'withSonarQubeEnv'
                            // al entorno del comando 'docker exec'.
                            // Jenkins reemplazará ${SONAR_HOST_URL} y ${SONAR_AUTH_TOKEN} con los valores correctos.
                            sh """
                                docker exec \\
                                -e SONAR_HOST_URL=\${SONAR_HOST_URL} \\
                                -e SONAR_TOKEN=\${SONAR_AUTH_TOKEN} \\
                                ${scannerContainer} \\
                                /opt/sonar-scanner/bin/sonar-scanner
                            """

                            // ---- PASO CLAVE Y FINAL ----
                            // Copiamos el directorio de resultados (.scannerwork) de vuelta al workspace de Jenkins.
                            // El punto final "." significa "al directorio actual".
                            echo "Copiando los resultados del análisis desde el contenedor..."
                            sh "docker cp ${scannerContainer}:/usr/src/.scannerwork ."

                        } finally {
                            echo "Limpiando el contenedor de SonarScanner..."
                            sh "docker rm -f ${scannerContainer}"
                        }
                    }
                }
            }
        }

        stage('Quality Gate Check') {
            steps {
                echo 'Waiting for SonarQube analysis to be processed and checking the Quality Gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build & Push Docker Images') {
            parallel {
                stage('Backend Docker Image') {
                    steps {
                        dir('src/backend') {
                            script {
                                def imageName = "alessok/inventory-backend"
                                echo "Building Docker image: ${imageName}:${env.BUILD_NUMBER}"
                                def dockerImage = docker.build(imageName, "--build-arg BUILD_NUMBER=${env.BUILD_NUMBER} .")
                                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                    dockerImage.push("${env.BUILD_NUMBER}")
                                    dockerImage.push('latest')
                                }
                            }
                        }
                    }
                }
                stage('Frontend Docker Image') {
                    steps {
                        dir('src/frontend') {
                            script {
                                def imageName = "alessok/inventory-frontend"
                                echo "Building Docker image: ${imageName}:${env.BUILD_NUMBER}"
                                def dockerImage = docker.build(imageName, "--build-arg BUILD_NUMBER=${env.BUILD_NUMBER} .")
                                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                    dockerImage.push("${env.BUILD_NUMBER}")
                                    dockerImage.push('latest')
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            // Aquí definimos un agente específico solo para esta etapa
            agent {
                docker {
                    image 'bitnami/kubectl:1.29' // Una imagen pública popular que solo contiene kubectl
                    args '-u root --entrypoint="" --network host'
                    reuseNode true // Le dice a Jenkins que reutilice el workspace de las etapas anteriores
                }
            }
            steps {
                withKubeConfig([credentialsId: 'kubeconfig-staging']) {
                    echo 'Deploying to staging environment...'
                    // Comandos kubectl corregidos y separados por '&& \'
                    sh '''
                        kubectl apply -f infrastructure/kubernetes/ --namespace=staging && \\
                        kubectl rollout status deployment/backend-deployment --namespace=staging && \\
                        kubectl rollout status deployment/frontend-deployment --namespace=staging
                    '''
                }
            }
        }

        stage('Integration Tests') {
            // La condición 'when' se elimina para que se ejecute siempre
            agent {
                docker {
                    image 'node:18-alpine' // Una imagen ligera con Node.js y npm
                    reuseNode true
                }
            }
            steps {
                echo 'Running integration tests...'
                dir('tests/integration') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('Deploy to Production') {
            agent {
                docker {
                    image 'bitnami/kubectl:1.29'
                    args '-u root --entrypoint="" --network host'
                    reuseNode true
                }
            }
            steps {
                // Para un despliegue real a producción, aquí usarías una credencial
                // diferente, ej. 'kubeconfig-production'
                withKubeConfig([credentialsId: 'kubeconfig-staging']) {
                    echo 'Deploying to PRODUCTION environment...'
                    sh '''
                        # ---- LA SOLUCIÓN ESTÁ AQUÍ ----
                        # Forzamos a kubectl a que apunte al servidor correcto de K8s,
                        # ignorando cualquier configuración por defecto o variable de entorno conflictiva.

                        K8S_SERVER="https://localhost:6443"

                        kubectl --server=${K8S_SERVER} --insecure-skip-tls-verify=true apply -f infrastructure/kubernetes/ --namespace=production && \\
                        kubectl --server=${K8S_SERVER} --insecure-skip-tls-verify=true rollout status deployment/backend-deployment --namespace=production && \\
                        kubectl --server=${K8S_SERVER} --insecure-skip-tls-verify=true rollout status deployment/frontend-deployment --namespace=production
                    '''
                }
            }
        }

        stage('Performance Tests') {
            agent {
                docker {
                    // Usamos una imagen oficial de Node con Debian (Bullseye), que es muy estable y compatible.
                    image 'node:18-bullseye'
                    // Mantenemos los argumentos que sabemos que funcionan
                    args '-u root --entrypoint="" --network host'
                    reuseNode true
                }
            }
            steps {
                dir('tests/performance') {
                    echo 'Preparing environment and running performance tests...'
                    sh(script: '''
                        set -ex  # Hacemos que el script falle en cualquier error y muestre los comandos

                        echo "--- Paso 1: Actualizando lista de paquetes ---"
                        apt-get update

                        # --- CORRECCIÓN: Instalamos todo en un solo paso y usamos 'chromium' ---
                        echo "--- Paso 2: Instalando dependencias del sistema (curl, ab y chromium) ---"
                        apt-get install -y curl apache2-utils chromium

                        echo "--- Paso 3: Instalando herramientas de prueba de Node.js ---"
                        npm install

                        echo "--- Paso 4: Ejecutando el script de pruebas de rendimiento ---"
                        chmod +x ./run-performance-tests.sh
                        ./run-performance-tests.sh
                    ''')
                }

                // La lógica para publicar el reporte se mantiene exactamente igual
                script {
                    echo "Finding and publishing the HTML report..."
                    def latestReportDir = sh(returnStdout: true, script: 'ls -td tests/performance/results/*/ | head -n 1').trim()
                    if (latestReportDir) {
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: latestReportDir,
                            reportFiles: 'performance_report.html',
                            reportName: 'Performance Test Report'
                        ])
                    } else {
                        echo "Warning: No performance test result directory was found."
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        unstable {
            echo 'Pipeline is unstable.'
        }
    }
}