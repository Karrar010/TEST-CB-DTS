#!/bin/sh

# Docker entrypoint script for DTS Chatbot

echo "🚀 Starting DTS Chatbot..."
echo "Environment: $NODE_ENV"

# Function to run initial knowledge base setup
setup_knowledge_base() {
    echo "📚 Setting up knowledge base..."
    
    # Check if knowledge base exists
    if [ ! -f "/app/data/knowledge-base.json" ]; then
        echo "📥 No existing knowledge base found. Running initial scrape..."
        npm run scrape:full
    else
        echo "📋 Existing knowledge base found. Running health check..."
        if ! npm run health:check; then
            echo "⚠️ Health check failed. Refreshing knowledge base..."
            npm run kb:refresh
        else
            echo "✅ Knowledge base is healthy"
        fi
    fi
}

# Function to start the main application
start_app() {
    echo "🌐 Starting Next.js application..."
    exec npm start
}

# Function to start the updater service
start_updater() {
    echo "🔄 Starting scheduled updater service..."
    while true; do
        echo "🕒 $(date): Running scheduled update..."
        npm run update:scheduled
        echo "⏰ $(date): Sleeping for ${UPDATE_INTERVAL:-30} minutes..."
        sleep $((${UPDATE_INTERVAL:-30} * 60))
    done
}

# Function to start the monitor service
start_monitor() {
    echo "🏥 Starting health monitor service..."
    while true; do
        echo "🏥 $(date): Running health check..."
        if ! npm run health:check; then
            echo "⚠️ $(date): Health check failed - triggering recovery..."
            npm run kb:refresh
        fi
        echo "😴 $(date): Sleeping for ${MONITOR_INTERVAL:-60} minutes..."
        sleep $((${MONITOR_INTERVAL:-60} * 60))
    done
}

# Main execution logic
case "${SERVICE_TYPE:-app}" in
    "app")
        setup_knowledge_base
        start_app
        ;;
    "updater")
        echo "⏳ Waiting for main app to be ready..."
        sleep 60
        start_updater
        ;;
    "monitor")
        echo "⏳ Waiting for main app to be ready..."
        sleep 90
        start_monitor
        ;;
    *)
        echo "❌ Unknown service type: ${SERVICE_TYPE}"
        echo "Valid options: app, updater, monitor"
        exit 1
        ;;
esac