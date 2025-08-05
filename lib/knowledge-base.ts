import { loadKnowledgeBase, updateKnowledgeBase } from "./scraper"

interface KnowledgeBase {
  lastUpdated: string
  sources: Array<{
    url: string
    title: string
    scrapedAt: string
    content: any
  }>
  faq: Array<{
    question: string
    answer: string
  }>
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000

// Enhanced fallback knowledge base
const FALLBACK_KNOWLEDGE = `
DTS GILGIT-BALTISTAN FALLBACK KNOWLEDGE BASE

WHAT IS DTS?
DTS (Directorate of Tourism Services) Gilgit-Baltistan is the official government department responsible for tourism in the region.

LOGIN INFORMATION:
- Login URL: https://app.dtsgb.gog.pk/auth/login
- Only authorized personnel can access
- For account issues, contact: +92-5811-920001

SERVICES:
• Tourist Information and Guidance
• Travel Permits and Documentation
• Tourism Infrastructure Development
• Tourist Safety and Security
• Adventure Tourism Facilitation

POPULAR DESTINATIONS:
• Skardu - Gateway to K2 and Baltoro Glacier
• Hunza Valley - Beautiful valley with stunning views
• Fairy Meadows - Base camp for Nanga Parbat
• Deosai National Park - High altitude plateau

CONTACT:
Phone: +92-5811-920001
Email: info@dtsgb.gog.pk
Helpline: 1422
Website: https://dtsgb.gog.pk/
`

export async function getKnowledgeBaseFromJSON(): Promise<string> {
  try {
    // Load existing knowledge base
    let knowledgeBase = await loadKnowledgeBase()

    // Check if we need to update (if older than 1 hour or doesn't exist)
    const shouldUpdate = !knowledgeBase || Date.now() - new Date(knowledgeBase.lastUpdated).getTime() > CACHE_DURATION

    if (shouldUpdate) {
      console.log("Updating knowledge base from websites...")
      await updateKnowledgeBase()
      knowledgeBase = await loadKnowledgeBase()
    } else {
      console.log("Using cached knowledge base")
    }

    if (!knowledgeBase) {
      throw new Error("Failed to load knowledge base")
    }

    // Format knowledge base for AI
    const formattedKB = formatKnowledgeBaseForAI(knowledgeBase)
    return formattedKB
  } catch (error) {
    console.error("Error getting knowledge base:", error)
    return getFallbackKnowledgeBase()
  }
}

function formatKnowledgeBaseForAI(kb: KnowledgeBase): string {
  let formatted = `DTS GILGIT-BALTISTAN KNOWLEDGE BASE
Last Updated: ${kb.lastUpdated}
Sources: ${kb.sources.length} websites

`

  // Add scraped content
  kb.sources.forEach((source) => {
    formatted += `=== ${source.title} (${source.url}) ===
Scraped: ${source.scrapedAt}

`

    if (source.content.about) {
      formatted += `ABOUT: ${source.content.about}

`
    }

    if (source.content.services && source.content.services.length > 0) {
      formatted += `SERVICES:
${source.content.services.map((s) => `• ${s}`).join("\n")}

`
    }

    if (source.content.destinations && source.content.destinations.length > 0) {
      formatted += `DESTINATIONS:
${source.content.destinations.map((d) => `• ${d.name}: ${d.description}`).join("\n")}

`
    }

    if (source.content.loginSteps) {
      formatted += `LOGIN PROCESS:
${source.content.loginSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

`
    }

    if (source.content.commonIssues) {
      formatted += `COMMON LOGIN ISSUES:
${source.content.commonIssues.map((issue) => `• ${issue.issue}: ${issue.solution}`).join("\n")}

`
    }

    if (source.content.contact) {
      formatted += `CONTACT INFO:
Phone: ${source.content.contact.phone}
Email: ${source.content.contact.email}
Helpline: ${source.content.contact.helpline}
Address: ${source.content.contact.address}

`
    }

    formatted += `\n`
  })

  // Add FAQ
  formatted += `FREQUENTLY ASKED QUESTIONS:
${kb.faq
  .map(
    (faq) => `Q: ${faq.question}
A: ${faq.answer}`,
  )
  .join("\n\n")}

`

  return formatted
}

function getFallbackKnowledgeBase(): string {
  return FALLBACK_KNOWLEDGE
}

// Function to manually refresh knowledge base
export async function refreshKnowledgeBase(): Promise<void> {
  console.log("Manually refreshing knowledge base...")
  await updateKnowledgeBase()
}
