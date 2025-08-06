# 🐳 Docker Deployment Guide for DTS Chatbot

This guide explains how to deploy the DTS Tourism Chatbot using Docker with full automation features.

## 🎯 **What's Included**

### **Multi-Service Architecture:**
- **Main App**: Next.js chatbot application
- **Auto-Updater**: Background service for knowledge base updates
- **Health Monitor**: Automatic health checks and recovery
- **Load Balancer**: Optional Traefik reverse proxy with SSL

### **Features:**
- ✅ **Persistent Data**: Knowledge base survives container restarts
- ✅ **Health Monitoring**: Built-in health checks and auto-recovery
- ✅ **Automatic Updates**: Background knowledge base refresh
- ✅ **Production Ready**: SSL, logging, and monitoring
- ✅ **Scalable**: Easy to scale horizontally

## 🚀 **Quick Start**

### **1. Prerequisites**
```bash
# Install Docker and Docker Compose
# Windows: Docker Desktop
# Linux: 
sudo apt update
sudo apt install docker.io docker-compose

# Verify installation
docker --version
docker-compose --version
```

### **2. Environment Setup**
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

### **3. Development Deployment**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### **4. Production Deployment**
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# Monitor services
docker-compose -f docker-compose.prod.yml logs -f
```

## 📋 **Service Details**

### **Main Application (dts-chatbot)**
- **Port**: 3000 (development) / 80 (production)
- **Health Check**: `/api/health`
- **Purpose**: Serves the chatbot interface and API

### **Auto-Updater (dts-updater)**
- **Schedule**: Every 30 minutes (configurable)
- **Purpose**: Keeps knowledge base current
- **Dependencies**: Waits for main app to be healthy

### **Health Monitor (dts-monitor)**
- **Schedule**: Every 60 minutes (configurable)
- **Purpose**: Monitors system health and triggers recovery
- **Auto-Recovery**: Refreshes knowledge base on failures

## 🔧 **Configuration Options**

### **Environment Variables**
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Required | OpenAI API key for chat functionality |
| `NODE_ENV` | production | Runtime environment |
| `UPDATE_INTERVAL` | 30 | Update interval in minutes |
| `MONITOR_INTERVAL` | 60 | Health check interval in minutes |
| `PORT` | 3000 | Application port |

### **Volume Mounts**
| Path | Purpose |
|------|---------|
| `knowledge_data:/app/data` | Persistent knowledge base storage |
| `./logs:/app/logs` | Application logs |

## 🏥 **Health Monitoring**

### **Health Check Endpoint**
```bash
# Check application health
curl http://localhost:3000/api/health

# Example healthy response:
{
  "status": "healthy",
  "message": "Service is running normally",
  "knowledgeBase": {
    "lastUpdated": "2025-01-06T12:30:00.000Z",
    "totalSources": 31,
    "hoursOld": 0.5
  },
  "timestamp": "2025-01-06T13:00:00.000Z"
}
```

### **Docker Health Checks**
```bash
# View container health status
docker ps

# Check health check logs
docker inspect dts-chatbot | grep -A 10 Health
```

## 🛠️ **Management Commands**

### **Basic Operations**
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart dts-chatbot

# View logs
docker-compose logs -f dts-chatbot
docker-compose logs -f dts-updater
docker-compose logs -f dts-monitor
```

### **Manual Operations**
```bash
# Force knowledge base refresh
docker-compose exec dts-chatbot npm run kb:refresh

# Run health check manually
docker-compose exec dts-chatbot npm run health:check

# Access container shell
docker-compose exec dts-chatbot sh
```

### **Data Management**
```bash
# Backup knowledge base
docker cp dts-chatbot:/app/data ./backup-data

# Restore knowledge base
docker cp ./backup-data/. dts-chatbot:/app/data

# View data volume
docker volume inspect dts-chat-widget_knowledge_data
```

## 🔒 **Production Deployment**

### **SSL Configuration**
Edit `docker-compose.prod.yml`:
```yaml
# Update domain and email
- "traefik.http.routers.dts-chatbot.rule=Host(`your-domain.com`)"
- "--certificatesresolvers.letsencrypt.acme.email=your-email@domain.com"
```

### **Firewall Setup**
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Optional: Allow Traefik dashboard
sudo ufw allow 8080
```

### **System Service (Optional)**
Create `/etc/systemd/system/dts-chatbot.service`:
```ini
[Unit]
Description=DTS Chatbot Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/your/project
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable auto-start
sudo systemctl enable dts-chatbot
sudo systemctl start dts-chatbot
```

## 📊 **Monitoring & Logging**

### **Log Management**
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f dts-updater

# Limit log output
docker-compose logs --tail=100 dts-chatbot
```

### **Resource Monitoring**
```bash
# View resource usage
docker stats

# Monitor specific container
docker stats dts-chatbot
```

### **External Monitoring Integration**
The health endpoint (`/api/health`) can be integrated with:
- **Uptime monitoring**: Pingdom, UptimeRobot
- **Application monitoring**: New Relic, DataDog
- **Infrastructure monitoring**: Prometheus, Grafana

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check logs
docker-compose logs dts-chatbot

# Common causes:
# - Missing OPENAI_API_KEY
# - Port 3000 already in use
# - Insufficient memory
```

#### **Knowledge Base Not Updating**
```bash
# Check updater service
docker-compose logs dts-updater

# Manual refresh
docker-compose exec dts-chatbot npm run kb:refresh
```

#### **Health Check Failing**
```bash
# Check health endpoint directly
curl http://localhost:3000/api/health

# Check application logs
docker-compose logs dts-chatbot
```

### **Performance Optimization**
```yaml
# Add resource limits to docker-compose.yml
services:
  dts-chatbot:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

## 🔄 **Updates & Maintenance**

### **Updating the Application**
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### **Database Migration** (if needed)
```bash
# Backup current data
docker cp dts-chatbot:/app/data ./backup-$(date +%Y%m%d)

# Update and restart
docker-compose up -d
```

## 🎉 **Benefits of Docker Deployment**

### **For Development:**
- ✅ **Consistent Environment**: Same setup across all machines
- ✅ **Easy Setup**: One command deployment
- ✅ **Isolated Dependencies**: No conflicts with other projects

### **For Production:**
- ✅ **Scalability**: Easy horizontal scaling
- ✅ **Reliability**: Auto-restart on failures
- ✅ **Monitoring**: Built-in health checks
- ✅ **Maintenance**: Easy updates and rollbacks

### **For Operations:**
- ✅ **Automation**: Self-managing knowledge base
- ✅ **Observability**: Comprehensive logging and monitoring
- ✅ **Security**: Containerized isolation
- ✅ **Portability**: Deploy anywhere Docker runs

Your DTS chatbot is now containerized and production-ready! 🚀