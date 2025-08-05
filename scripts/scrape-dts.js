import { scrapeAllDTSWebsites } from "../lib/scraper.js"
import { getKnowledgeBase } from "../lib/knowledge-base.js"

async function testScraping() {
  console.log("🚀 Starting DTS website scraping...")

  try {
    // Test individual scraping
    console.log("\n📄 Scraping individual websites...")
    const scrapedContent = await scrapeAllDTSWebsites()

    console.log(`✅ Successfully scraped ${scrapedContent.length} websites`)

    scrapedContent.forEach((content, index) => {
      console.log(`\n--- Website ${index + 1} ---`)
      console.log(`URL: ${content.url}`)
      console.log(`Title: ${content.title}`)
      console.log(`Content Length: ${content.content.length} characters`)
      console.log(`Last Scraped: ${content.lastScraped}`)
    })

    // Test knowledge base generation
    console.log("\n🧠 Generating knowledge base...")
    const knowledgeBase = await getKnowledgeBase()

    console.log(`✅ Knowledge base generated: ${knowledgeBase.length} characters`)
    console.log("\n--- Knowledge Base Preview ---")
    console.log(knowledgeBase.substring(0, 500) + "...")
  } catch (error) {
    console.error("❌ Error during scraping:", error)
  }
}

// Run the test
testScraping()
