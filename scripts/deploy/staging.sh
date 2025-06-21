#!/bin/bash

# Deploy script for staging environment
# Deploys the application to the pre-production environment

set -e

echo "🚀 Starting deployment to staging environment..."

# Define variables
NAMESPACE="staging"
BACKEND_IMAGE="inventory-backend:latest"
FRONTEND_IMAGE="inventory-frontend:latest"
POSTGRES_IMAGE="postgres:15-alpine"

# Function to display messages
log() {
    echo "✅ [STAGING] $1"
}

error() {
    echo "❌ [STAGING ERROR] $1"
    exit 1
}
    echo "❌ [STAGING] $1"
    exit 1
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    error "kubectl is not installed or not in PATH"
fi

log "kubectl version: $(kubectl version --client --short)"

# Create namespace if it doesn't exist
log "Creating namespace: $NAMESPACE"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply PostgreSQL deployment
log "Deploying PostgreSQL..."
envsubst < infrastructure/kubernetes/postgres.yaml | \
sed "s/namespace: inventory-system/namespace: $NAMESPACE/g" | \
kubectl apply -f -

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s

# Apply backend deployment
log "Deploying backend..."
envsubst < infrastructure/kubernetes/backend.yaml | \
sed "s/namespace: inventory-system/namespace: $NAMESPACE/g" | \
sed "s/image: inventory-backend:latest/image: $BACKEND_IMAGE/g" | \
kubectl apply -f -

# Apply frontend deployment
log "Deploying frontend..."
envsubst < infrastructure/kubernetes/frontend.yaml | \
sed "s/namespace: inventory-system/namespace: $NAMESPACE/g" | \
sed "s/image: inventory-frontend:latest/image: $FRONTEND_IMAGE/g" | \
kubectl apply -f -

# Wait for deployments to be ready
log "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/backend-deployment -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=available deployment/frontend-deployment -n $NAMESPACE --timeout=300s

# Get service URLs
log "Getting service information..."
kubectl get services -n $NAMESPACE

# Run basic health checks
log "Running health checks..."
BACKEND_URL=$(kubectl get service backend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")
FRONTEND_URL=$(kubectl get service frontend-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")

log "Deployment to staging completed successfully!"
log "Access the application:"
log "   Frontend: http://$FRONTEND_URL"
log "   Backend API: http://$BACKEND_URL:3002"

# Show deployment status
kubectl get pods -n $NAMESPACE
log "Database: PostgreSQL en puerto 5432"
