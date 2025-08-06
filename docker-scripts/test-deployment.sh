#!/bin/bash

# Docker deployment test script for DTS Chatbot

echo "🐳 Testing DTS Chatbot Docker Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "success") echo -e "${GREEN}✅ $2${NC}" ;;
        "error") echo -e "${RED}❌ $2${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $2${NC}" ;;
        *) echo "ℹ️  $2" ;;
    esac
}

# Function to check if command exists
check_command() {
    if command -v $1 &> /dev/null; then
        print_status "success" "$1 is installed"
        return 0
    else
        print_status "error" "$1 is not installed"
        return 1
    fi
}

# Check prerequisites
echo "📋 Checking prerequisites..."
check_command "docker" || exit 1
check_command "docker-compose" || exit 1

# Check if .env file exists
if [ -f ".env" ]; then
    print_status "success" ".env file found"
else
    print_status "warning" ".env file not found. Using environment variables or defaults."
fi

# Build the Docker image
echo "🔨 Building Docker image..."
if docker build -t dts-chatbot-test .; then
    print_status "success" "Docker image built successfully"
else
    print_status "error" "Failed to build Docker image"
    exit 1
fi

# Test the health endpoint
echo "🏥 Testing health endpoint..."
docker run -d --name dts-test -p 3001:3000 --env OPENAI_API_KEY=${OPENAI_API_KEY:-test} dts-chatbot-test

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 30

# Check if container is running
if docker ps | grep -q dts-test; then
    print_status "success" "Container is running"
else
    print_status "error" "Container failed to start"
    docker logs dts-test
    docker rm -f dts-test
    exit 1
fi

# Test health endpoint
echo "🔍 Testing health endpoint..."
for i in {1..10}; do
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        print_status "success" "Health endpoint is responding"
        break
    else
        if [ $i -eq 10 ]; then
            print_status "error" "Health endpoint is not responding after 10 attempts"
            docker logs dts-test
            docker rm -f dts-test
            exit 1
        fi
        echo "⏳ Attempt $i/10: Waiting for health endpoint..."
        sleep 10
    fi
done

# Get health status
echo "📊 Health status:"
curl -s http://localhost:3001/api/health | python3 -m json.tool || echo "Failed to parse health response"

# Cleanup test container
echo "🧹 Cleaning up test container..."
docker rm -f dts-test
docker rmi dts-chatbot-test

print_status "success" "Docker deployment test completed successfully!"

echo ""
echo "🚀 Ready for deployment! Use one of these commands:"
echo "   Development: docker-compose up -d"
echo "   Production:  docker-compose -f docker-compose.prod.yml up -d"