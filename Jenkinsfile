// Jenkinsfile Declarativo - Creado desde Cero para el entorno existente
pipeline {
    // Definimos `agent none` a nivel global para que cada etapa especifique su propio entorno.
    // Esto nos da máximo control y aislamiento.
    agent none

    // Herramientas necesarias para el pipeline, configuradas en "Global Tool Configuration" de Jenkins.
    tools {
        nodejs 'NodeJS-20'
    }

    // Variables de entorno globales para todo el pipeline.
    environment {
        // Carga las credenciales de Jenkins de forma segura
        POSTGRES_DB        = credentials('POSTGRES_DB')
        POSTGRES_USER      = credentials('POSTGRES_USER')
        POSTGRES_PASSWORD  = credentials('POSTGRES_PASSWORD')
        JWT_SECRET         = credentials('JWT_SECRET')
        SONAR_AUTH_TOKEN   = credentials('SONAR_TOKEN')

        // Endpoints y configuración
        SONAR_HOST_URL     = 'http://sonarqube:9000'
        DOCKER_NETWORK     = 'devops-proyecto-final_inventory-network' // La red de tu docker-compose
        TEST_DB_CONTAINER  = 'test-postgres-db'
    }

    stages {
        // Etapa 1: Análisis Estático de Código con SonarQube
        stage('Static Analysis (SAST)') {
            agent {
                // Usamos un agente de Docker temporal para ejecutar el scanner
                docker {
                    image 'sonarsource/sonar-scanner-cli:5.0'
                    args '--network=${DOCKER_NETWORK}'
                }
            }
            steps {
                echo 'Running SonarQube analysis...'
                // Las propiedades se pasan directamente al comando del scanner
                sh """
                    sonar-scanner \\
                        -Dsonar.projectKey=devops-proyecto-final \\
                        -Dsonar.sources=. \\
                        -Dsonar.host.url=${SONAR_HOST_URL} \\
                        -Dsonar.token=${SONAR_AUTH_TOKEN}
                """
            }
        }

        // Etapa 2: Pruebas Unitarias y de Integración del Backend
        stage('Backend Unit & Integration Tests') {
            agent {
                // Usamos un agente 'docker' que trae las herramientas de Docker.
                // Esto bypassa los problemas de permisos del agente principal de Jenkins.
                docker {
                    image 'docker:26.1.4' // Imagen oficial con Alpine
                    args '-v /var/run/docker.sock:/var/run/docker.sock --network=${DOCKER_NETWORK}'
                }
            }
            post {
                always {
                    echo "Cleaning up test database container..."
                    // Este comando se ejecuta dentro del agente 'docker'
                    sh "docker rm -f ${TEST_DB_CONTAINER} || true"
                }
            }
            steps {
                script {
                    // Como el agente 'docker' no tiene Node.js, lo instalamos al vuelo.
                    echo 'Installing Node.js for tests...'
                    sh 'apk add --update nodejs npm'

                    echo 'Starting temporary PostgreSQL container for tests...'
                    // Levanta una BD de prueba en la red principal para que sea accesible
                    sh """
                        docker run -d --name ${TEST_DB_CONTAINER} \\
                        --network ${DOCKER_NETWORK} \\
                        -e POSTGRES_DB=${POSTGRES_DB} \\
                        -e POSTGRES_USER=${POSTGRES_USER} \\
                        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \\
                        postgres:15-alpine
                    """

                    echo 'Waiting for test database to be ready...'
                    sh '''
                        for i in {1..20}; do
                          if docker exec '''+env.TEST_DB_CONTAINER+''' pg_isready -U '''+env.POSTGRES_USER+''' -q; then
                            echo "PostgreSQL is ready!"; exit 0;
                          fi
                          echo "Waiting... attempt $i"; sleep 2
                        done
                        echo "PostgreSQL failed to start."; exit 1
                    '''

                    echo 'Running database migrations on test database...'
                    sh "docker exec -i ${TEST_DB_CONTAINER} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < database/migrations/V3__create_backend_compatible_tables.sql"
                }

                dir('src/backend') {
                    echo 'Installing backend dependencies...'
                    sh 'npm install'

                    echo 'Running backend tests...'
                    sh """
                        export NODE_ENV=test
                        export DB_HOST=${TEST_DB_CONTAINER}
                        export DB_PORT=5432
                        export DB_NAME=${POSTGRES_DB}
                        export DB_USER=${POSTGRES_USER}
                        export DB_PASS=${POSTGRES_PASSWORD}
                        export JWT_SECRET=${JWT_SECRET}
                        npm test -- --coverage --watchAll=false
                    """
                }
            }
        }

        // Etapa 3: Pruebas de API con Newman (Postman)
        stage('API Tests') {
            agent {
                // Usamos un agente específico para Newman
                docker {
                    image 'postman/newman:latest'
                    args '--network=${DOCKER_NETWORK}'
                }
            }
            steps {
                echo 'Running API tests...'
                // El workspace se monta automáticamente, así que Newman encuentra el archivo.
                sh 'newman run "tests/api/collection.json" --env-var "baseUrl=http://backend:3002"'
            }
        }
    }
    
    post {
        // Bloque final que se ejecuta después de todas las etapas
        always {
            // Asignamos un agente a esta sección para que sepa dónde trabajar
            agent any
            
            steps {
                echo "Pipeline finished. Publishing reports..."
                publishHTML(
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'src/backend/coverage/lcov-report',
                    reportFiles: 'index.html',
                    reportName: 'Backend Coverage'
                )
            }
        }
    }
}