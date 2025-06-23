pipeline {
    agent any
    
    environment {
        // Define environment variables
        NODE_VERSION = '18'
        POSTGRES_DB = 'inventory_db'
        POSTGRES_USER = 'inventory_user'
        POSTGRES_PASSWORD = 'inventory_pass'
        JWT_SECRET = 'test-jwt-secret-for-ci'
        SONARQUBE_TOKEN = credentials('sonarqube-token')
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('src/backend') {
                            echo 'Installing backend dependencies...'
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('src/frontend') {
                            echo 'Installing frontend dependencies...'
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
                            sh 'npm run lint || echo "Linting completed with warnings"'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('src/frontend') {
                            echo 'Running frontend linting...'
                            sh 'npm run lint || echo "Linting completed with warnings"'
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
        
        stage('Test') {
            steps {
                script {
                    // Crear red de Docker si no existe
                    sh 'docker network inspect jenkins-test >/dev/null 2>&1 || docker network create jenkins-test'
                    // Eliminar cualquier contenedor (activo o detenido) que use el puerto 55432 antes de iniciar el contenedor de test
                    sh 'docker ps -a --filter "publish=55432" -q | xargs -r docker rm -f'
                    sh 'docker rm -f test-postgres || true'
                    sh '''
                        docker run -d --name test-postgres \
                        --network jenkins-test \
                        -e POSTGRES_DB=${POSTGRES_DB} \
                        -e POSTGRES_USER=${POSTGRES_USER} \
                        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
                        -p 55432:5432 \
                        postgres:15-alpine
                    '''

                    // Esperar a que postgres esté listo (wait-for-postgres)
                    sh '''
                        for i in {1..15}; do
                          if pg_isready -h test-postgres -p 5432 -U ${POSTGRES_USER}; then
                            echo "Postgres is ready!"
                            break
                          fi
                          echo "Waiting for postgres... ($i)"
                          sleep 2
                        done
                    '''

                    // Run database migrations
                    sh '''
                        export PGPASSWORD=${POSTGRES_PASSWORD}
                        psql -h test-postgres -p 5432 -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f database/migrations/V3__create_backend_compatible_tables.sql
                        psql -h test-postgres -p 5432 -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f database/migrations/V4__insert_initial_data.sql
                    '''
                }
                
                dir('src/backend') {
                    echo 'Running backend tests...'
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
                
                // Cleanup test database
                sh 'docker rm -f test-postgres || true'
            }
            post {
                always {
                    // Publish test results (eliminado publishTestResults, solo cobertura HTML)
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: false,
                        keepAll: true,
                        reportDir: 'src/backend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
                failure {
                    sh 'docker rm -f test-postgres || true'
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=inventory-management \
                        -Dsonar.sources=src \
                        -Dsonar.tests=src/backend/src/__tests__ \
                        -Dsonar.javascript.lcov.reportPaths=src/backend/coverage/lcov.info \
                        -Dsonar.typescript.lcov.reportPaths=src/backend/coverage/lcov.info \
                        -Dsonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**
                    '''
                }
            }
        }
        
        stage('Quality Gate') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Build Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            parallel {
                stage('Backend Docker Image') {
                    steps {
                        dir('src/backend') {
                            script {
                                def backendImage = docker.build("inventory-backend:${env.BUILD_NUMBER}")
                                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                    backendImage.push()
                                    backendImage.push('latest')
                                }
                            }
                        }
                    }
                }
                stage('Frontend Docker Image') {
                    steps {
                        dir('src/frontend') {
                            script {
                                def frontendImage = docker.build("inventory-frontend:${env.BUILD_NUMBER}")
                                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                    frontendImage.push()
                                    frontendImage.push('latest')
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to staging environment...'
                sh '''
                    kubectl apply -f infrastructure/kubernetes/ --namespace=staging
                    kubectl rollout status deployment/backend-deployment --namespace=staging
                    kubectl rollout status deployment/frontend-deployment --namespace=staging
                '''
            }
        }
        
        stage('Integration Tests') {
            when {
                branch 'develop'
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
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                echo 'Deploying to production environment...'
                sh '''
                    kubectl apply -f infrastructure/kubernetes/ --namespace=production
                    kubectl rollout status deployment/backend-deployment --namespace=production
                    kubectl rollout status deployment/frontend-deployment --namespace=production
                '''
            }
        }
        
        stage('Performance Tests') {
            when {
                branch 'main'
            }
            steps {
                echo 'Running performance tests...'
                dir('tests/performance') {
                    sh './run-jmeter-tests.sh'
                }
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: false,
                    keepAll: true,
                    reportDir: 'tests/performance/reports',
                    reportFiles: 'index.html',
                    reportName: 'Performance Test Report'
                ])
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            sh 'docker system prune -f'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        unstable {
            echo 'Pipeline is unstable!'
        }
    }
}
