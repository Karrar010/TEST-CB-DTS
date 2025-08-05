import { updateKnowledgeBase } from "../lib/scraper.js"

async function runUpdate() {
  console.log("🚀 Starting DTS Knowledge Base Update...")

  try {
    await updateKnowledgeBase()
    console.log("✅ Knowledge base updated successfully!")
    console.log("📁 Data saved to: data/knowledge-base.json")
  } catch (error) {
    console.error("❌ Error updating knowledge base:", error)
  }
}

// Run the update
runUpdate()
