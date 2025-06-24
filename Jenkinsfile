// Jenkinsfile Final, Consolidado y con todas las etapas originales restauradas.
pipeline {
    agent any
    tools {
        nodejs '18'
    }
    
    environment {
        // Variables de entorno para el pipeline
        POSTGRES_DB             = 'inventory_db'
        POSTGRES_USER           = 'inventory_user'
        POSTGRES_PASSWORD       = 'inventory_pass'
        JWT_SECRET              = 'test-jwt-secret-for-ci'
        
        // Carga de secretos desde el gestor de credenciales de Jenkins
        SONARQUBE_TOKEN         = credentials('sonarqube-token')
        DOCKER_HUB_CREDENTIALS  = credentials('docker-hub-credentials')
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
            steps {
                script {
                    sh 'docker network inspect jenkins-test >/dev/null 2>&1 || docker network create jenkins-test'
                    sh 'docker rm -f test-postgres || true'
                    
                    echo 'Starting PostgreSQL container for testing...'
                    sh '''
                        docker run -d --name test-postgres \
                        --network jenkins-test \
                        -e POSTGRES_DB=${POSTGRES_DB} \
                        -e POSTGRES_USER=${POSTGRES_USER} \
                        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
                        postgres:15-alpine
                    '''
                    
                    echo 'Waiting for PostgreSQL to be ready...'
                    sh '''
                        for i in {1..15}; do
                          if docker exec test-postgres pg_isready -U ${POSTGRES_USER}; then
                            echo "PostgreSQL is ready!"
                            break
                          fi
                          echo "Waiting for PostgreSQL... attempt $i"
                          sleep 2
                        done
                    '''
                    
                    echo 'Running database migrations...'
                    sh '''
                        docker exec -i test-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < database/migrations/V3__create_backend_compatible_tables.sql
                        docker exec -i test-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < database/migrations/V4__insert_initial_data.sql
                    '''
                }
                
                dir('src/backend') {
                    echo 'Running backend tests and generating coverage report...'
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
        
        stage('SonarQube Static Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        // CORRECCIÓN: Usando una etiqueta de imagen que sí existe.
                        docker run --platform linux/amd64 --rm \
                        -v "$PWD":/usr/src \
                        -w /usr/src \
                        --network jenkins-test \
                        -e SONAR_TOKEN=${SONARQUBE_TOKEN} \
                        sonarsource/sonar-scanner-cli:5.0
                    '''
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
            when { branch 'main' }
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
            when { branch 'develop' }
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
            when { branch 'develop' }
            steps {
                echo 'Running integration tests...'
                dir('tests/integration') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }
        
        stage('Deploy to Production') {
            when { branch 'main' }
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
            when { branch 'main' }
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