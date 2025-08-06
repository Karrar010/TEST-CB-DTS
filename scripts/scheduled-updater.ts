#!/usr/bin/env tsx

/**
 * Scheduled Knowledge Base Updater
 * 
 * This script can be run periodically (via cron job or task scheduler) to keep
 * the knowledge base updated with the latest information from the DTS website.
 * 
 * Usage:
 * - Run manually: npx tsx scripts/scheduled-updater.ts
 * - Schedule with cron: 0,30 * * * * npx tsx scripts/scheduled-updater.ts
 */

import { updateKnowledgeBase, loadKnowledgeBase } from "../lib/scraper"

async function runScheduledUpdate() {
  console.log("🕒 Starting scheduled knowledge base update...")
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`)

  try {
    // Check current knowledge base status
    const currentKB = await loadKnowledgeBase()
    
    if (currentKB) {
      const lastUpdated = new Date(currentKB.lastUpdated)
      const timeSinceUpdate = Date.now() - lastUpdated.getTime()
      const hoursSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60 * 60))
      
      console.log(`📊 Current knowledge base status:`)
      console.log(`  • Last updated: ${lastUpdated.toLocaleString()}`)
      console.log(`  • Hours since update: ${hoursSinceUpdate}`)
      console.log(`  • Total sources: ${currentKB.sources?.length || 0}`)
      
      // Only update if it's been more than 30 minutes for dynamic content
      if (timeSinceUpdate < (30 * 60 * 1000)) {
        console.log("✅ Knowledge base is current, no update needed")
        return
      }
    }

    // Perform the update
    console.log("🔄 Updating knowledge base...")
    await updateKnowledgeBase()
    
    // Verify the update
    const updatedKB = await loadKnowledgeBase()
    if (updatedKB) {
      console.log("✅ Scheduled update completed successfully!")
      console.log(`📊 Updated statistics:`)
      console.log(`  • New timestamp: ${updatedKB.lastUpdated}`)
      console.log(`  • Total sources: ${updatedKB.sources?.length || 0}`)
      
      // Log which sections were updated
      const dynamicSections = updatedKB.sources?.filter((s: any) => 
        ["News & Advisories", "Events & Travel Trade", "Upcoming Expeditions"].includes(s.section)
      )
      
      if (dynamicSections && dynamicSections.length > 0) {
        console.log(`🔄 Dynamic sections updated:`)
        dynamicSections.forEach((section: any) => {
          console.log(`  • ${section.section}: ${section.title}`)
        })
      }
    }

  } catch (error) {
    console.error("❌ Scheduled update failed:", error)
    
    // Log the error for monitoring
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    process.exit(1) // Exit with error code for monitoring systems
  }
}

// Handle script termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, gracefully shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, gracefully shutting down...')
  process.exit(0)
})

// Check if script is being run directly
if (require.main === module) {
  runScheduledUpdate().catch(error => {
    console.error("❌ Fatal error in scheduled updater:", error)
    process.exit(1)
  })
}

export { runScheduledUpdate }