# 🤖 Knowledge Base Automation System

This document explains how the DTS Chatbot automatically keeps its knowledge base updated with the latest information from the DTS website.

## 🎯 **Key Features**

### ✅ **Already Working:**
- **Automatic Updates**: Every chat request checks if data needs refreshing
- **Smart Caching**: Different update intervals for static vs dynamic content
- **Fallback System**: Graceful degradation if updates fail
- **Comprehensive Scraping**: Captures all website sections including dynamic content

### 🆕 **Enhanced Features:**
- **Intelligent Update Detection**: Only updates what actually needs updating
- **Selective Updates**: Fast updates for dynamic content only
- **Health Monitoring**: Automated health checks and status reporting
- **Scheduled Updates**: Background updates independent of user requests

## ⏰ **Update Schedules**

| Content Type | Update Frequency | Examples |
|--------------|------------------|----------|
| **Dynamic Content** | 30 minutes | News & Advisories, Events & Travel Trade |
| **Static Content** | 4 hours | Licensing info, Regulations, Fees |
| **General Content** | 1 hour | Default for other sections |

## 🚀 **How It Works**

### 1. **Real-Time Updates (During Chat)**
```typescript
// Every chat request triggers this check:
const shouldUpdate = await shouldUpdateKnowledgeBase(knowledgeBase)

if (shouldUpdate.needsUpdate) {
  if (shouldUpdate.selectiveUpdate) {
    // Fast: Update only dynamic content (30 seconds)
    await updateSelectiveContent(knowledgeBase, outdatedSections)
  } else {
    // Full: Update everything (2-3 minutes)
    await updateKnowledgeBase()
  }
}
```

### 2. **Scheduled Background Updates**
```bash
# Run every 30 minutes (example cron job):
0 */30 * * * cd /path/to/your/project && npm run update:scheduled

# Or run manually:
npm run update:scheduled
```

### 3. **Health Monitoring**
```bash
# Check knowledge base health:
npm run health:check

# Example output:
📋 KNOWLEDGE BASE HEALTH REPORT
==================================================
Status: ✅ HEALTHY
Last Updated: 1/6/2025, 12:30:45 PM
Time Since Update: 0h 15m ago
Total Sources: 31
```

## 🛠️ **Available Commands**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run scrape:full` | Complete knowledge base refresh | Initial setup, major issues |
| `npm run update:scheduled` | Smart scheduled update | Automated background updates |
| `npm run health:check` | Health status and diagnostics | Monitoring, troubleshooting |
| `npm run kb:refresh` | Force full refresh | Manual maintenance |
| `npm run kb:monitor` | Alias for health check | Monitoring scripts |

## 📊 **Content Freshness Logic**

### **Dynamic Content (30-minute updates):**
- News & Advisories
- Events & Travel Trade  
- Upcoming Expeditions
- Historical Summits

### **Static Content (4-hour updates):**
- Tourism Services
- Licensing Requirements
- Visa Information
- Regulations
- Fee Structures

### **Critical Sections (Always monitored):**
- Tourism Services
- Licensing
- Mountain Adventures
- Visa Information

## 🔧 **Automation Setup Options**

### **Option 1: Windows Task Scheduler**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: "Daily" or "When computer starts"
4. Set action: Start a program
5. Program: `cmd`
6. Arguments: `/c cd /path/to/project && npm run update:scheduled`

### **Option 2: Linux/Mac Cron Job**
```bash
# Edit crontab
crontab -e

# Add this line for updates every 30 minutes:
0 */30 * * * cd /path/to/your/project && npm run update:scheduled

# Add this line for daily health checks:
0 8 * * * cd /path/to/your/project && npm run health:check
```

### **Option 3: Cloud Deployment (Recommended)**
- **Vercel**: Use Vercel Cron Jobs
- **Netlify**: Use Netlify Functions with scheduled triggers
- **Heroku**: Use Heroku Scheduler add-on
- **AWS**: Use CloudWatch Events + Lambda

## 📈 **Monitoring & Alerts**

### **Health Check Exit Codes:**
- `0`: Healthy ✅
- `1`: Warning ⚠️ (stale content, minor issues)
- `2`: Critical ❌ (missing sections, major failures)
- `3`: Unknown error 🔥

### **Example Monitoring Script:**
```bash
#!/bin/bash
npm run health:check
EXIT_CODE=$?

case $EXIT_CODE in
    0) echo "✅ Knowledge base is healthy" ;;
    1) echo "⚠️ Knowledge base needs attention" 
       # Send warning notification
       ;;
    2) echo "❌ Knowledge base has critical issues"
       # Send urgent alert
       npm run kb:refresh  # Auto-fix attempt
       ;;
    *) echo "🔥 Unknown error in health check" ;;
esac
```

## 🐛 **Troubleshooting**

### **Problem: Updates Failing**
```bash
# Check health status
npm run health:check

# Force full refresh
npm run kb:refresh

# Check logs for specific errors
```

### **Problem: Stale Content**
```bash
# Check what's stale
npm run health:check

# Run targeted update
npm run update:scheduled
```

### **Problem: Missing Sections**
```bash
# Force complete re-scrape
npm run scrape:full
```

## 🔄 **Development & Testing**

### **Test the Update System:**
```bash
# 1. Check current status
npm run health:check

# 2. Force an update
npm run update:scheduled

# 3. Verify the update worked
npm run health:check
```

### **Simulate Stale Content:**
```bash
# Manually edit data/knowledge-base.json
# Change "lastUpdated" to an old date
# Then run: npm run health:check
```

## 📝 **Configuration**

### **Adjust Update Frequencies:**
Edit `lib/knowledge-base.ts`:
```typescript
const CACHE_DURATIONS = {
  DYNAMIC: 30 * 60 * 1000,      // 30 minutes
  STATIC: 4 * 60 * 60 * 1000,   // 4 hours  
  DEFAULT: 60 * 60 * 1000       // 1 hour
}
```

### **Add New Dynamic Sections:**
```typescript
const dynamicSections = [
  "News & Advisories",
  "Events & Travel Trade", 
  "Upcoming Expeditions",
  "Your New Section"  // Add here
]
```

## 🎉 **Benefits**

✅ **Always Fresh Data**: Users get the latest information  
✅ **Performance**: Smart caching reduces unnecessary updates  
✅ **Reliability**: Fallback systems prevent service disruption  
✅ **Automation**: Minimal manual maintenance required  
✅ **Monitoring**: Early detection of issues  
✅ **Scalability**: Handles growing content efficiently  

Your chatbot now automatically stays up-to-date with the DTS website! 🚀