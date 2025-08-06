#!/usr/bin/env tsx

/**
 * Knowledge Base Health Check
 * 
 * This script checks the health and freshness of the knowledge base
 * and can send alerts if content is too stale or missing.
 * 
 * Usage: npx tsx scripts/health-check.ts
 */

import { loadKnowledgeBase } from "../lib/scraper"

interface HealthReport {
  status: 'healthy' | 'warning' | 'critical'
  lastUpdated: string
  timeSinceUpdate: number
  totalSources: number
  missingSections: string[]
  staleSections: string[]
  recommendations: string[]
}

async function performHealthCheck(): Promise<HealthReport> {
  console.log("🏥 Performing knowledge base health check...")
  
  const report: HealthReport = {
    status: 'healthy',
    lastUpdated: '',
    timeSinceUpdate: 0,
    totalSources: 0,
    missingSections: [],
    staleSections: [],
    recommendations: []
  }

  try {
    const knowledgeBase = await loadKnowledgeBase()
    
    if (!knowledgeBase) {
      report.status = 'critical'
      report.recommendations.push('Knowledge base file not found - run initial scraping')
      return report
    }

    // Basic metrics
    report.lastUpdated = knowledgeBase.lastUpdated
    report.timeSinceUpdate = Date.now() - new Date(knowledgeBase.lastUpdated).getTime()
    report.totalSources = knowledgeBase.sources?.length || 0

    // Check for required sections
    const requiredSections = [
      "Tourism Services",
      "Licensing", 
      "Mountain Adventures",
      "Visa Information",
      "News & Advisories",
      "Events & Travel Trade",
      "Fees & Expeditions"
    ]

    const existingSections = knowledgeBase.sources?.map((s: any) => s.section) || []
    report.missingSections = requiredSections.filter(section => 
      !existingSections.includes(section)
    )

    // Check for stale dynamic content
    const dynamicSections = ["News & Advisories", "Events & Travel Trade", "Upcoming Expeditions"]
    const staleThreshold = 2 * 60 * 60 * 1000 // 2 hours
    
    if (knowledgeBase.sources) {
      for (const source of knowledgeBase.sources) {
        if (dynamicSections.includes(source.section)) {
          const sourceAge = Date.now() - new Date(source.scrapedAt).getTime()
          if (sourceAge > staleThreshold) {
            report.staleSections.push(source.section)
          }
        }
      }
    }

    // Determine overall health status
    if (report.missingSections.length > 0) {
      report.status = 'critical'
      report.recommendations.push(`Missing critical sections: ${report.missingSections.join(', ')}`)
    } else if (report.staleSections.length > 0) {
      report.status = 'warning'
      report.recommendations.push(`Stale dynamic content: ${report.staleSections.join(', ')}`)
    } else if (report.timeSinceUpdate > 4 * 60 * 60 * 1000) { // 4 hours
      report.status = 'warning'
      report.recommendations.push('Knowledge base is older than 4 hours')
    }

    // Add specific recommendations
    if (report.timeSinceUpdate > 24 * 60 * 60 * 1000) { // 24 hours
      report.recommendations.push('Consider running full knowledge base update')
    } else if (report.staleSections.length > 0) {
      report.recommendations.push('Run selective update for dynamic content')
    }

  } catch (error) {
    report.status = 'critical'
    report.recommendations.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return report
}

function printHealthReport(report: HealthReport) {
  console.log("\n📋 KNOWLEDGE BASE HEALTH REPORT")
  console.log("=" .repeat(50))
  
  // Status with emoji
  const statusEmoji = {
    'healthy': '✅',
    'warning': '⚠️',
    'critical': '❌'
  }
  
  console.log(`Status: ${statusEmoji[report.status]} ${report.status.toUpperCase()}`)
  
  if (report.lastUpdated) {
    const lastUpdated = new Date(report.lastUpdated)
    const hoursAgo = Math.floor(report.timeSinceUpdate / (1000 * 60 * 60))
    const minutesAgo = Math.floor((report.timeSinceUpdate % (1000 * 60 * 60)) / (1000 * 60))
    
    console.log(`Last Updated: ${lastUpdated.toLocaleString()}`)
    console.log(`Time Since Update: ${hoursAgo}h ${minutesAgo}m ago`)
    console.log(`Total Sources: ${report.totalSources}`)
  }
  
  if (report.missingSections.length > 0) {
    console.log(`\n❌ Missing Sections (${report.missingSections.length}):`)
    report.missingSections.forEach(section => console.log(`  • ${section}`))
  }
  
  if (report.staleSections.length > 0) {
    console.log(`\n⚠️ Stale Dynamic Sections (${report.staleSections.length}):`)
    report.staleSections.forEach(section => console.log(`  • ${section}`))
  }
  
  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`)
    report.recommendations.forEach(rec => console.log(`  • ${rec}`))
  }
  
  console.log("\n" + "=".repeat(50))
}

// Main execution
async function main() {
  try {
    const report = await performHealthCheck()
    printHealthReport(report)
    
    // Exit with appropriate code for monitoring systems
    if (report.status === 'critical') {
      process.exit(2) // Critical status
    } else if (report.status === 'warning') {
      process.exit(1) // Warning status
    } else {
      process.exit(0) // Healthy status
    }
    
  } catch (error) {
    console.error("❌ Health check failed:", error)
    process.exit(3) // Unknown error
  }
}

// Check if script is being run directly
if (require.main === module) {
  main()
}

export { performHealthCheck, printHealthReport }