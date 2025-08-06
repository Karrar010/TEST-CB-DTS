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

// Cache durations for different content types
const CACHE_DURATIONS = {
  // Dynamic content (news, events) - update more frequently
  DYNAMIC: 30 * 60 * 1000,      // 30 minutes
  // Static content (regulations, licensing) - update less frequently  
  STATIC: 4 * 60 * 60 * 1000,   // 4 hours
  // Default fallback
  DEFAULT: 60 * 60 * 1000       // 1 hour
}

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
    // Load existing knowledge base with timeout protection
    console.log("Attempting to load knowledge base...")
    let knowledgeBase = await loadKnowledgeBase()

    if (!knowledgeBase) {
      console.log("No knowledge base found, using fallback")
      return getFallbackKnowledgeBase()
    }

    // Skip update logic during high-traffic periods to prevent timeouts
    // Only check for updates if the knowledge base is very old (24+ hours)
    const now = Date.now()
    const lastUpdated = new Date(knowledgeBase.lastUpdated).getTime()
    const timeSinceUpdate = now - lastUpdated
    const FORCE_UPDATE_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours

    if (timeSinceUpdate > FORCE_UPDATE_THRESHOLD) {
      console.log("Knowledge base is very old, scheduling background update")
      // Don't await this - let it update in background
      updateKnowledgeBaseInBackground().catch(err => 
        console.error("Background update failed:", err)
      )
    } else {
      console.log("Using cached knowledge base (less than 24h old)")
    }

    // Format knowledge base for AI
    const formattedKB = formatKnowledgeBaseForAI(knowledgeBase)
    return formattedKB
  } catch (error) {
    console.error("Error getting knowledge base:", error)
    return getFallbackKnowledgeBase()
  }
}

// Background update function that doesn't block the main response
async function updateKnowledgeBaseInBackground(): Promise<void> {
  try {
    console.log("Starting background knowledge base update...")
    await updateKnowledgeBase()
    console.log("Background update completed")
  } catch (error) {
    console.error("Background update failed:", error)
  }
}

function formatKnowledgeBaseForAI(kb: any): string {
  let formatted = `DTS GILGIT-BALTISTAN COMPREHENSIVE KNOWLEDGE BASE
Last Updated: ${kb.lastUpdated}
Base URL: ${kb.baseUrl}
Sources: ${kb.sources.length} websites

`

  // Add scraped content with comprehensive details
  kb.sources.forEach((source: any) => {
    formatted += `=== ${source.title} ===
URL: ${source.url}
Section: ${source.section || 'General'}
Content Type: ${source.content.type || 'general'}

`

    // Handle different content types with specialized formatting
    if (source.content.type === 'services') {
      formatted += formatServicesContent(source.content)
    } else if (source.content.type === 'fees') {
      formatted += formatFeesContent(source.content)
    } else if (source.content.type === 'mountaineering') {
      formatted += formatMountaineeringContent(source.content)
    } else if (source.content.type === 'visa') {
      formatted += formatVisaContent(source.content)
    } else if (source.content.type === 'authentication') {
      formatted += formatAuthContent(source.content)
    } else if (source.content.type === 'news') {
      formatted += formatNewsContent(source.content)
    } else if (source.content.type === 'events') {
      formatted += formatEventsContent(source.content)
    } else if (source.content.type === 'adventures') {
      formatted += formatAdventuresContent(source.content)
    } else if (source.content.type === 'contact') {
      formatted += formatContactContent(source.content)
    } else if (source.content.type === 'destinations') {
      formatted += formatDestinationsContent(source.content)
    } else if (source.content.type === 'regulations') {
      formatted += formatRegulationsContent(source.content)
    } else {
      formatted += formatGeneralContent(source.content)
    }

    formatted += `\n`
  })

  // Add FAQ with comprehensive details
  formatted += `FREQUENTLY ASKED QUESTIONS:
${kb.faq
  .map(
    (faq: any) => `Q: ${faq.question}
A: ${faq.answer}`,
  )
  .join("\n\n")}

`

  return formatted
}

function formatServicesContent(content: any): string {
  let formatted = ''
  
  if (content.section === 'Licensing' || content.licensing) {
    formatted += `TOURISM BUSINESS LICENSING INFORMATION:

`
    if (content.headings) {
      formatted += `Key Sections: ${content.headings.join(', ')}

`
    }
    
    if (content.licensing) {
      if (content.licensing.overview) {
        formatted += `OVERVIEW:
${content.licensing.overview}

`
      }
      
      if (content.licensing.types && content.licensing.types.length > 0) {
        formatted += `LICENSE TYPES:
${content.licensing.types.map((type: string) => `• ${type}`).join('\n')}

`
      }
      
      if (content.licensing.requirements && content.licensing.requirements.length > 0) {
        formatted += `REQUIREMENTS:
${content.licensing.requirements.map((req: any) => {
          if (typeof req === 'object' && req.items) {
            return `${req.category}:\n${req.items.map((item: string) => `  • ${item}`).join('\n')}`
          }
          return `• ${req}`
        }).join('\n')}

`
      }
      
      if (content.licensing.processes && content.licensing.processes.length > 0) {
        formatted += `APPLICATION PROCESS:
${content.licensing.processes.map((process: any) => {
          if (typeof process === 'object' && process.steps) {
            return `${process.title}:\n${process.steps.map((step: string, i: number) => `  ${i + 1}. ${step}`).join('\n')}`
          }
          return `• ${process}`
        }).join('\n')}

`
      }
    }
  }
  
  // Format structured lists
  if (content.structuredLists && content.structuredLists.length > 0) {
    content.structuredLists.forEach((list: any) => {
      if (list.items && list.items.length > 0) {
        formatted += `${list.context.toUpperCase()}:
${list.items.map((item: string) => `• ${item}`).join('\n')}

`
      }
    })
  }
  
  // Format requirements
  if (content.requirements && content.requirements.length > 0) {
    formatted += `REQUIREMENTS:
${content.requirements.map((req: any) => {
      if (typeof req === 'object' && req.items) {
        return `${req.category}:\n${req.items.map((item: string) => `  • ${item}`).join('\n')}`
      }
      return `• ${req}`
    }).join('\n')}

`
  }
  
  // Format processes
  if (content.processes && content.processes.length > 0) {
    formatted += `PROCESSES:
${content.processes.map((process: any) => {
      if (typeof process === 'object' && process.steps) {
        return `${process.title}:\n${process.steps.map((step: string, i: number) => `  ${i + 1}. ${step}`).join('\n')}`
      }
      return `• ${process}`
    }).join('\n')}

`
  }
  
  // Format contact information
  if (content.contactInfo) {
    formatted += `CONTACT INFORMATION:
`
    if (content.contactInfo.phones) {
      formatted += `Phone: ${content.contactInfo.phones.join(', ')}
`
    }
    if (content.contactInfo.emails) {
      formatted += `Email: ${content.contactInfo.emails.join(', ')}
`
    }
    if (content.contactInfo.addresses) {
      formatted += `Address: ${content.contactInfo.addresses.join('; ')}
`
    }
    formatted += `

`
  }
  
  if (content.paragraphs && content.paragraphs.length > 0) {
    formatted += `DETAILED INFORMATION:
${content.paragraphs.join('\n')}

`
  }
  
  return formatted
}

function formatFeesContent(content: any): string {
  let formatted = ''
  
  if (content.headings) {
    formatted += `Fee Structure Sections: ${content.headings.join(', ')}

`
  }
  
  if (content.feeStructure && content.feeStructure.length > 0) {
    formatted += `FEE TABLES:
${content.feeStructure.map((table: any) => {
      if (table.headers && table.rows) {
        return `Headers: ${table.headers.join(' | ')}\nData: ${table.rows.map((row: any) => row.join(' | ')).join('\n')}`
      }
      return ''
    }).join('\n\n')}

`
  }
  
  if (content.generalFees && content.generalFees.length > 0) {
    formatted += `GENERAL FEES:
${content.generalFees.map((fee: string) => `• ${fee}`).join('\n')}

`
  }
  
  if (content.expeditionFees && content.expeditionFees.length > 0) {
    formatted += `EXPEDITION FEES:
${content.expeditionFees.map((fee: string) => `• ${fee}`).join('\n')}

`
  }
  
  return formatted
}

function formatMountaineeringContent(content: any): string {
  let formatted = ''
  
  if (content.peaks && content.peaks.length > 0) {
    formatted += `MOUNTAIN PEAKS:
${content.peaks.map((peak: any) => `• ${peak.name} ${peak.height ? `(${peak.height})` : ''}: ${peak.description}`).join('\n')}

`
  }
  
  if (content.expeditions && content.expeditions.length > 0) {
    formatted += `EXPEDITIONS:
${content.expeditions.map((exp: any) => `• ${exp.title} ${exp.date ? `(${exp.date})` : ''}: ${exp.description}`).join('\n')}

`
  }
  
  if (content.historicalSummits && content.historicalSummits.length > 0) {
    formatted += `HISTORICAL SUMMITS:
${content.historicalSummits.map((summit: string) => `• ${summit}`).join('\n')}

`
  }
  
  return formatted
}

function formatVisaContent(content: any): string {
  let formatted = ''
  
  if (content.requirements && content.requirements.length > 0) {
    formatted += `VISA REQUIREMENTS:
${content.requirements.map((req: string) => `• ${req}`).join('\n')}

`
  }
  
  if (content.eligibility && content.eligibility.length > 0) {
    formatted += `ELIGIBILITY CRITERIA:
${content.eligibility.map((criteria: string) => `• ${criteria}`).join('\n')}

`
  }
  
  if (content.documents && content.documents.length > 0) {
    formatted += `REQUIRED DOCUMENTS:
${content.documents.map((doc: string) => `• ${doc}`).join('\n')}

`
  }
  
  if (content.applicationProcess && content.applicationProcess.length > 0) {
    formatted += `APPLICATION PROCESS:
${content.applicationProcess.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

`
  }
  
  return formatted
}

function formatAuthContent(content: any): string {
  let formatted = ''
  
  if (content.accountInfo) {
    formatted += `ACCOUNT INFORMATION:
Account Types: ${content.accountInfo.accountTypes.join(', ')}
Eligibility: ${content.accountInfo.eligibility}
Requirements: ${content.accountInfo.requirements.join(', ')}
Process: ${content.accountInfo.process}

`
  }
  
  return formatted
}

function formatNewsContent(content: any): string {
  let formatted = ''
  
  // Format latest news from headings and paragraphs
  if (content.headings && content.headings.length > 0) {
    const newsHeadings = content.headings.filter((h: string) => 
      !h.toLowerCase().includes('find us') && 
      !h.toLowerCase().includes('follow us') && 
      !h.toLowerCase().includes('contact') &&
      !h.toLowerCase().includes('important links') &&
      !h.toLowerCase().includes('get in touch') &&
      h.length > 10
    )
    
    if (newsHeadings.length > 0) {
      formatted += `LATEST NEWS & ADVISORIES:
${newsHeadings.map((headline: string, index: number) => {
        const date = content.paragraphs && content.paragraphs[index] ? content.paragraphs[index] : ''
        const dateMatch = date.match(/\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2}/)
        return `• ${headline}${dateMatch ? ` (${dateMatch[0]})` : ''}`
      }).join('\n')}

`
    }
  }
  
  if (content.articles && content.articles.length > 0) {
    formatted += `NEWS ARTICLES:
${content.articles.map((article: any) => `• ${article.title} ${article.date ? `(${article.date})` : ''}: ${article.content}`).join('\n')}

`
  }
  
  if (content.advisories && content.advisories.length > 0) {
    formatted += `TRAVEL ADVISORIES:
${content.advisories.map((advisory: any) => `• ${advisory.title}: ${advisory.content}`).join('\n')}

`
  }
  
  if (content.latestNews && content.latestNews.length > 0) {
    formatted += `RECENT UPDATES:
${content.latestNews.map((news: string) => `• ${news}`).join('\n')}

`
  }
  
  return formatted
}

function formatEventsContent(content: any): string {
  let formatted = ''
  
  // Format events from headings and content
  if (content.headings && content.headings.length > 0) {
    const eventHeadings = content.headings.filter((h: string) => 
      !h.toLowerCase().includes('find us') && 
      !h.toLowerCase().includes('follow us') && 
      !h.toLowerCase().includes('contact') &&
      !h.toLowerCase().includes('important links') &&
      !h.toLowerCase().includes('get in touch') &&
      !h.toLowerCase().includes('events') && // exclude generic "Events" heading
      h.length > 10
    )
    
    if (eventHeadings.length > 0) {
      formatted += `UPCOMING EVENTS & TRAVEL TRADE:
${eventHeadings.map((event: string, index: number) => {
        const description = content.paragraphs && content.paragraphs[index + 2] ? content.paragraphs[index + 2] : ''
        return `• ${event}${description ? `: ${description}` : ''}`
      }).join('\n')}

`
    }
  }
  
  // Extract event details from allText for better parsing
  if (content.allText && content.allText.includes('Summit') || content.allText.includes('Market') || content.allText.includes('Mart')) {
    const eventPattern = /(Mountain Tourism Summit|Arabian Travel Market|Pakistan Travel Mart)[^•]*?(?=Mountain Tourism Summit|Arabian Travel Market|Pakistan Travel Mart|Find Us|$)/g
    const events = content.allText.match(eventPattern)
    
    if (events && events.length > 0) {
      formatted += `DETAILED EVENT INFORMATION:
${events.map((event: string) => `• ${event.trim()}`).join('\n\n')}

`
    }
  }
  
  if (content.events && content.events.length > 0) {
    formatted += `STRUCTURED EVENTS:
${content.events.map((event: any) => `• ${event.title} ${event.date ? `(${event.date})` : ''} ${event.location ? `at ${event.location}` : ''}: ${event.description}`).join('\n')}

`
  }
  
  if (content.upcomingEvents && content.upcomingEvents.length > 0) {
    formatted += `UPCOMING EVENTS LIST:
${content.upcomingEvents.map((event: string) => `• ${event}`).join('\n')}

`
  }
  
  return formatted
}

function formatAdventuresContent(content: any): string {
  let formatted = ''
  
  // Format comprehensive peaks data
  if (content.comprehensivePeaks && content.comprehensivePeaks.length > 0) {
    formatted += `MOUNTAIN PEAKS FOR CLIMBING:
${content.comprehensivePeaks.map((peak: any) => 
  `• ${peak.name} (${peak.elevation}) - Base Camp: ${peak.baseCamp} | Difficulty: ${peak.difficulty}${peak.firstAscent ? ` | First Ascent: ${peak.firstAscent}` : ''}`
).join('\n')}

`
  }
  
  // Format comprehensive treks data
  if (content.comprehensiveTreks && content.comprehensiveTreks.length > 0) {
    formatted += `TREKKING ROUTES:
${content.comprehensiveTreks.map((trek: any) => 
  `• ${trek.name} (${trek.elevation}) - Difficulty: ${trek.difficulty}
  Route: ${trek.route}`
).join('\n\n')}

`
  }
  
  if (content.adventures && content.adventures.length > 0) {
    formatted += `ADVENTURE ACTIVITIES:
${content.adventures.map((adv: any) => `• ${adv.name} ${adv.difficulty ? `(${adv.difficulty})` : ''}: ${adv.description}`).join('\n')}

`
  }
  
  if (content.peaks && content.peaks.length > 0) {
    formatted += `ADDITIONAL PEAKS:
${content.peaks.map((peak: any) => `• ${peak.name} ${peak.height ? `(${peak.height})` : ''}: ${peak.description}`).join('\n')}

`
  }
  
  if (content.expeditions && content.expeditions.length > 0) {
    formatted += `EXPEDITIONS:
${content.expeditions.map((exp: any) => `• ${exp.title} ${exp.date ? `(${exp.date})` : ''}: ${exp.description}`).join('\n')}

`
  }
  
  return formatted
}

function formatContactContent(content: any): string {
  let formatted = ''
  
  if (content.contactInfo) {
    formatted += `CONTACT INFORMATION:
Phone: ${content.contactInfo.phone}
Email: ${content.contactInfo.email}
Address: ${content.contactInfo.address}
Helpline: ${content.contactInfo.helpline}

`
  }
  
  if (content.offices && content.offices.length > 0) {
    formatted += `OFFICE LOCATIONS:
${content.offices.map((office: any) => `• ${office.name}: ${office.address} | Phone: ${office.phone} | Email: ${office.email}`).join('\n')}

`
  }
  
  return formatted
}

function formatDestinationsContent(content: any): string {
  let formatted = ''
  
  if (content.destinations && content.destinations.length > 0) {
    formatted += `TOURIST DESTINATIONS:
${content.destinations.map((dest: any) => `• ${dest.name}: ${dest.description} ${dest.location ? `(${dest.location})` : ''}`).join('\n')}

`
  }
  
  return formatted
}

function formatRegulationsContent(content: any): string {
  let formatted = ''
  
  if (content.regulations && content.regulations.length > 0) {
    formatted += `TOURISM REGULATIONS:
${content.regulations.map((reg: any) => `• ${reg.title}: ${reg.content}`).join('\n')}

`
  }
  
  if (content.rules && content.rules.length > 0) {
    formatted += `RULES AND GUIDELINES:
${content.rules.map((rule: string) => `• ${rule}`).join('\n')}

`
  }
  
  return formatted
}

function formatGeneralContent(content: any): string {
  let formatted = ''
  
  if (content.about) {
    formatted += `ABOUT: ${content.about}

`
  }
  
  if (content.services && content.services.length > 0) {
    formatted += `SERVICES:
${content.services.map((s: string) => `• ${s}`).join('\n')}

`
  }
  
  if (content.destinations && content.destinations.length > 0) {
    formatted += `DESTINATIONS:
${content.destinations.map((d: any) => `• ${d.name}: ${d.description}`).join('\n')}

`
  }
  
  if (content.contact) {
    formatted += `CONTACT INFO:
Phone: ${content.contact.phone}
Email: ${content.contact.email}
Helpline: ${content.contact.helpline}
Address: ${content.contact.address}

`
  }
  
  return formatted
}

// Intelligent update detection based on content type and age
async function shouldUpdateKnowledgeBase(knowledgeBase: any): Promise<{
  needsUpdate: boolean
  reason: string
  selectiveUpdate: boolean
  outdatedSections: string[]
}> {
  if (!knowledgeBase) {
    return {
      needsUpdate: true,
      reason: "No existing knowledge base found",
      selectiveUpdate: false,
      outdatedSections: []
    }
  }

  const now = Date.now()
  const lastUpdated = new Date(knowledgeBase.lastUpdated).getTime()
  const timeSinceUpdate = now - lastUpdated

  // Define dynamic sections that need frequent updates
  const dynamicSections = [
    "News & Advisories",
    "Events & Travel Trade",
    "Upcoming Expeditions",
    "Historical Summits"
  ]

  // Check if any dynamic content is too old
  const outdatedDynamicSections = []
  
  if (knowledgeBase.sources) {
    for (const source of knowledgeBase.sources) {
      const sourceAge = now - new Date(source.scrapedAt).getTime()
      
      // Check if this is dynamic content that's outdated
      if (dynamicSections.includes(source.section) && sourceAge > CACHE_DURATIONS.DYNAMIC) {
        outdatedDynamicSections.push(source.section)
      }
    }
  }

  // Force update if dynamic content is outdated
  if (outdatedDynamicSections.length > 0) {
    return {
      needsUpdate: true,
      reason: `Dynamic content outdated: ${outdatedDynamicSections.join(', ')}`,
      selectiveUpdate: true,
      outdatedSections: outdatedDynamicSections
    }
  }

  // Full update if everything is too old
  if (timeSinceUpdate > CACHE_DURATIONS.STATIC) {
    return {
      needsUpdate: true,
      reason: "Full knowledge base is outdated",
      selectiveUpdate: false,
      outdatedSections: []
    }
  }

  // Check if critical sections are missing
  const requiredSections = ["Tourism Services", "Licensing", "Mountain Adventures", "Visa Information"]
  const existingSections = knowledgeBase.sources?.map((s: any) => s.section) || []
  const missingSections = requiredSections.filter(section => !existingSections.includes(section))

  if (missingSections.length > 0) {
    return {
      needsUpdate: true,
      reason: `Missing critical sections: ${missingSections.join(', ')}`,
      selectiveUpdate: false,
      outdatedSections: []
    }
  }

  return {
    needsUpdate: false,
    reason: "Knowledge base is current",
    selectiveUpdate: false,
    outdatedSections: []
  }
}

// Selective update function for dynamic content only
async function updateSelectiveContent(knowledgeBase: any, outdatedSections: string[]): Promise<void> {
  console.log(`🔄 Performing selective update for: ${outdatedSections.join(', ')}`)
  
  try {
    const { scrapeWebsiteToJSON } = await import("./scraper")
    
    // URLs for dynamic content
    const dynamicUrls = [
      { url: "https://dtsgb.gog.pk/news", section: "News & Advisories" },
      { url: "https://dtsgb.gog.pk/events", section: "Events & Travel Trade" },
      { url: "https://dtsgb.gog.pk/mountaineering/upcoming-expeditions", section: "Upcoming Expeditions" },
      { url: "https://dtsgb.gog.pk/mountaineering/historical-summits", section: "Historical Summits" }
    ]

    // Only update the outdated sections
    const urlsToUpdate = dynamicUrls.filter(item => outdatedSections.includes(item.section))
    
    for (const { url, section } of urlsToUpdate) {
      console.log(`📡 Updating ${section}...`)
      
      const newData = await scrapeWebsiteToJSON(url, section)
      if (newData) {
        // Replace the old data for this section
        const existingIndex = knowledgeBase.sources.findIndex((s: any) => s.section === section)
        if (existingIndex >= 0) {
          knowledgeBase.sources[existingIndex] = newData
        } else {
          knowledgeBase.sources.push(newData)
        }
        console.log(`✅ Updated ${section}`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Update the last updated timestamp
    knowledgeBase.lastUpdated = new Date().toISOString()

    // Save the updated knowledge base
    const fs = await import("fs/promises")
    const path = await import("path")
    const filePath = path.join(process.cwd(), "data", "knowledge-base.json")
    await fs.writeFile(filePath, JSON.stringify(knowledgeBase, null, 2))
    
    console.log(`✅ Selective update completed for ${outdatedSections.length} sections`)
    
  } catch (error) {
    console.error("❌ Error during selective update:", error)
    // Fall back to full update if selective update fails
    const { updateKnowledgeBase } = await import("./scraper")
    await updateKnowledgeBase()
  }
}

function getFallbackKnowledgeBase(): string {
  return FALLBACK_KNOWLEDGE
}

// Function to manually refresh knowledge base
export async function refreshKnowledgeBase(): Promise<void> {
  console.log("Manually refreshing knowledge base...")
  await updateKnowledgeBase()
}
