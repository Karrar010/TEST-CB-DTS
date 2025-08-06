import { updateKnowledgeBase, loadKnowledgeBase } from "../lib/scraper"

async function runComprehensiveScraping() {
  console.log("🚀 Starting comprehensive DTS website scraping...")
  console.log("This will scrape ALL pages from the DTS website hierarchy...")

  try {
    // Run the complete knowledge base update
    console.log("\n📡 Starting comprehensive scraping process...")
    await updateKnowledgeBase()

    // Load and verify the updated knowledge base
    console.log("\n🔍 Verifying updated knowledge base...")
    const knowledgeBase = await loadKnowledgeBase()

    if (knowledgeBase) {
      console.log(`\n📊 Knowledge Base Statistics:`)
      console.log(`  • Base URL: ${knowledgeBase.baseUrl}`)
      console.log(`  • Last Updated: ${knowledgeBase.lastUpdated}`)
      console.log(`  • Total Sources: ${knowledgeBase.sources.length}`)
      console.log(`  • Total Sections: ${knowledgeBase.sections.length}`)
      console.log(`  • FAQ Entries: ${knowledgeBase.faq.length}`)

      console.log(`\n📋 Scraped Content Breakdown:`)
      const contentTypes = knowledgeBase.sources.reduce((acc, source) => {
        const type = source.content.type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      Object.entries(contentTypes).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count} page(s)`)
      })

      // Show sample of scraped content
      console.log(`\n📄 Sample Scraped Content:`)
      knowledgeBase.sources.slice(0, 3).forEach((source, index) => {
        console.log(`\n--- Sample ${index + 1} ---`)
        console.log(`URL: ${source.url}`)
        console.log(`Section: ${source.section}`)
        console.log(`Title: ${source.title}`)
        console.log(`Content Type: ${source.content.type}`)
        if (source.content.headings && source.content.headings.length > 0) {
          console.log(`Headings: ${source.content.headings.slice(0, 3).join(', ')}${source.content.headings.length > 3 ? '...' : ''}`)
        }
      })

      console.log(`\n🎉 Comprehensive scraping completed successfully!`)
      console.log(`💾 All data has been saved to data/knowledge-base.json`)
      console.log(`🤖 Your chatbot now has access to comprehensive DTS information!`)

    } else {
      console.error("❌ Failed to load updated knowledge base")
    }

  } catch (error) {
    console.error("❌ Error during comprehensive scraping:", error)
    process.exit(1)
  }
}

// Run the comprehensive scraping
runComprehensiveScraping()