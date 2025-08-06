import * as cheerio from "cheerio"
import fs from "fs/promises"
import path from "path"

interface ScrapedData {
  url: string
  title: string
  scrapedAt: string
  content: any
  section?: string
  parentSection?: string
}

interface WebsiteSection {
  title: string
  url: string
  description?: string
  dynamic?: boolean
  fetchFrom?: string
  children?: WebsiteSection[]
}

interface KnowledgeBase {
  lastUpdated: string
  baseUrl: string
  sources: ScrapedData[]
  sections: WebsiteSection[]
  faq: Array<{
    question: string
    answer: string
  }>
}

// Complete hierarchical structure of DTS website
const DTS_WEBSITE_STRUCTURE: WebsiteSection[] = [
  {
    title: "Login & Registration",
    url: "https://app.dtsgb.gog.pk/auth/login",
    description: "Login portal for DTS GB users.",
    children: [
      {
        title: "Create Account",
        url: "https://app.dtsgb.gog.pk/auth/register"
      },
      {
        title: "Register for Licenses",
        url: "https://app.dtsgb.gog.pk/app"
      }
    ]
  },
  {
    title: "Tourism Services",
    url: "https://dtsgb.gog.pk/services",
    children: [
      {
        title: "Licensing",
        url: "https://dtsgb.gog.pk/services/licensing",
        children: [
          {
            title: "Tour Operator License",
            url: "https://app.dtsgb.gog.pk/app"
          },
          {
            title: "Hotel/Camping License",
            url: "https://app.dtsgb.gog.pk/app"
          },
          {
            title: "Tour Guide License",
            url: "https://app.dtsgb.gog.pk/app"
          }
        ]
      },
      {
        title: "Legislations",
        url: "https://dtsgb.gog.pk/services/legislations"
      },
      {
        title: "Grading",
        url: "https://dtsgb.gog.pk/services/grading"
      },
      {
        title: "Service Providers",
        url: "https://dtsgb.gog.pk/services/service-providers"
      },
      {
        title: "Downloads",
        url: "https://dtsgb.gog.pk/services/downloads"
      }
    ]
  },
  {
    title: "Fees & Expeditions",
    url: "https://dtsgb.gog.pk/fees",
    children: [
      {
        title: "General Fees",
        url: "https://dtsgb.gog.pk/fees#"
      },
      {
        title: "Expedition Fees",
        url: "https://dtsgb.gog.pk/fees#expeditions"
      }
    ]
  },
  {
    title: "Mountaineering",
    url: "https://dtsgb.gog.pk/mountaineering",
    children: [
      {
        title: "Historical Summits",
        url: "https://dtsgb.gog.pk/mountaineering/historical-summits"
      },
      {
        title: "Upcoming Expeditions",
        url: "https://dtsgb.gog.pk/mountaineering/upcoming-expeditions"
      },
      {
        title: "Successful Climbers",
        url: "https://dtsgb.gog.pk/mountaineering/successful-climbers"
      },
      {
        title: "Expedition Fees",
        url: "https://dtsgb.gog.pk/fees#expeditions"
      }
    ]
  },
  {
    title: "Mountain Adventures",
    url: "https://dtsgb.gog.pk/adventures"
  },
  {
    title: "Visa Information",
    url: "https://dtsgb.gog.pk/visa",
    children: [
      {
        title: "Apply for Tourist Visa",
        url: "https://dtsgb.gog.pk/visa#apply"
      },
      {
        title: "Tourist Visa Eligibility",
        url: "https://dtsgb.gog.pk/visa#eligibility"
      },
      {
        title: "Documents Required",
        url: "https://dtsgb.gog.pk/visa#documents"
      },
      {
        title: "Contact Support",
        url: "https://dtsgb.gog.pk/contact"
      },
      {
        title: "Explore Destinations",
        url: "https://dtsgb.gog.pk/destinations"
      },
      {
        title: "Visa Regulations",
        url: "https://dtsgb.gog.pk/regulations"
      }
    ]
  },
  {
    title: "News & Advisories",
    url: "https://dtsgb.gog.pk/news",
    dynamic: true,
    description: "Latest news and advisories related to tourism and expeditions in Gilgit-Baltistan. Content is updated regularly.",
    fetchFrom: "https://dtsgb.gog.pk/news",
    children: []
  },
  {
    title: "Events & Travel Trade",
    url: "https://dtsgb.gog.pk/events",
    dynamic: true,
    description: "Upcoming tourism and travel trade events related to Gilgit-Baltistan.",
    fetchFrom: "https://dtsgb.gog.pk/events",
    children: []
  }
]

// Enhanced scraping function with better content extraction
export async function scrapeWebsiteToJSON(url: string, section?: string, parentSection?: string): Promise<ScrapedData | null> {
  try {
    console.log(`Scraping: ${url}${section ? ` (Section: ${section})` : ''}`)

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove unwanted elements but preserve main content
    $("script, style, noscript, .advertisement, .ads").remove()

    const title = $("title").text().trim() || section || "DTS Page"
    let structuredContent: any = {}

    // Determine content type from URL and extract intelligently
    const contentType = determineContentType(url, section)
    structuredContent = await extractUniversalContent($, url, contentType, section)

    return {
      url,
      title,
      scrapedAt: new Date().toISOString(),
      content: structuredContent,
      section,
      parentSection
    }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}

// Specialized content extraction functions
async function extractAuthContent($: cheerio.CheerioAPI, url: string): Promise<any> {
  return {
    type: "authentication",
    loginUrl: url,
    pageContent: $("body").text().trim(),
    formFields: $("input").map((_, el) => ({
      type: $(el).attr("type") || "text",
      name: $(el).attr("name") || "",
      placeholder: $(el).attr("placeholder") || "",
      required: $(el).attr("required") !== undefined
    })).get(),
    buttons: $("button, input[type=submit]").map((_, el) => $(el).text().trim() || $(el).attr("value")).get(),
    links: $("a").map((_, el) => ({
      text: $(el).text().trim(),
      href: $(el).attr("href")
    })).get().filter(link => link.text && link.href),
    headings: $("h1, h2, h3, h4").map((_, el) => $(el).text().trim()).get().filter(Boolean),
    paragraphs: $("p").map((_, el) => $(el).text().trim()).get().filter(text => text.length > 10),
    accountInfo: {
      accountTypes: ["Government Officials", "Tourism Operators", "Registered Businesses", "Authorized Personnel"],
      eligibility: "Only authorized personnel and registered tourism operators",
      requirements: ["Valid CNIC", "Business License (for operators)", "Official recommendation letter"],
      process: "Submit documents to DTS office for verification and approval"
    }
  }
}

// Determine content type from URL and section
function determineContentType(url: string, section?: string): string {
  const urlLower = url.toLowerCase()
  const sectionLower = section?.toLowerCase() || ""
  
  if (urlLower.includes("auth") || sectionLower.includes("login") || sectionLower.includes("register")) {
    return "authentication"
  } else if (urlLower.includes("services") || sectionLower.includes("service") || sectionLower.includes("licensing")) {
    return "services"
  } else if (urlLower.includes("fees") || sectionLower.includes("fee")) {
    return "fees"
  } else if (urlLower.includes("mountaineering") || sectionLower.includes("mountain") || sectionLower.includes("expedition")) {
    return "mountaineering"
  } else if (urlLower.includes("visa") || sectionLower.includes("visa")) {
    return "visa"
  } else if (urlLower.includes("news") || sectionLower.includes("news") || sectionLower.includes("advisory")) {
    return "news"
  } else if (urlLower.includes("events") || sectionLower.includes("event") || sectionLower.includes("trade")) {
    return "events"
  } else if (urlLower.includes("adventures") || sectionLower.includes("adventure")) {
    return "adventures"
  } else if (urlLower.includes("contact") || sectionLower.includes("contact")) {
    return "contact"
  } else if (urlLower.includes("destinations") || sectionLower.includes("destination")) {
    return "destinations"
  } else if (urlLower.includes("regulations") || sectionLower.includes("regulation")) {
    return "regulations"
  } else {
    return "general"
  }
}

// Universal content extraction that works for all content types
async function extractUniversalContent($: cheerio.CheerioAPI, url: string, contentType: string, section?: string): Promise<any> {
  const structuredData = extractStructuredContent($, contentType)
  
  const baseContent = {
    type: contentType,
    section: section || "general",
    url,
    ...structuredData
  }
  
  // Add content-type specific enhancements
  switch (contentType) {
    case "services":
      return {
        ...baseContent,
        serviceTypes: structuredData.structuredLists
          .filter((list: any) => list.context.toLowerCase().includes("service") || 
                                list.context.toLowerCase().includes("license") ||
                                list.context.toLowerCase().includes("type"))
          .map((list: any) => ({
            category: list.context,
            services: list.items
          })),
        licensing: url.includes("licensing") ? {
          overview: structuredData.paragraphs.find((p: string) => 
            p.toLowerCase().includes("license") || p.toLowerCase().includes("permit")),
          requirements: structuredData.requirements || [],
          processes: structuredData.processes || [],
          types: structuredData.structuredLists
            .find((list: any) => list.context.toLowerCase().includes("license") ||
                                list.context.toLowerCase().includes("type"))?.items || 
                 ["Tour Operator License", "Hotel/Camping License", "Tour Guide License"]
        } : undefined
      }
      
    case "fees":
      return {
        ...baseContent,
        feeCategories: structuredData.structuredLists
          .filter((list: any) => list.context.toLowerCase().includes("fee") ||
                                list.context.toLowerCase().includes("cost") ||
                                list.context.toLowerCase().includes("charge"))
          .map((list: any) => ({
            category: list.context,
            fees: list.items
          })),
        feeStructure: structuredData.tables?.filter((table: any) => 
          table.title.toLowerCase().includes("fee") ||
          table.headers.some((h: string) => h.toLowerCase().includes("fee"))) || []
      }
      
    case "visa":
      return {
        ...baseContent,
        visaTypes: structuredData.structuredLists
          .find((list: any) => list.context.toLowerCase().includes("type") ||
                              list.context.toLowerCase().includes("category"))?.items || [],
        applicationProcess: structuredData.processes || [],
        forms: $("form").map((_, form) => ({
          action: $(form).attr("action"),
          method: $(form).attr("method"),
          fields: $(form).find("input, select, textarea").map((_, field) => ({
            name: $(field).attr("name"),
            type: $(field).attr("type") || "text",
            placeholder: $(field).attr("placeholder")
          })).get()
        })).get()
      }
      
    case "mountaineering":
      return {
        ...baseContent,
        peaks: $(".peak, .mountain").map((_, el) => ({
          name: $(el).find("h1, h2, h3, .name").first().text().trim(),
          height: $(el).find(".height, .elevation").text().trim(),
          description: $(el).find("p, .description").text().trim()
        })).get().filter(peak => peak.name),
        expeditions: $(".expedition, .climb").map((_, el) => ({
          title: $(el).find("h1, h2, h3, .title").first().text().trim(),
          date: $(el).find(".date").text().trim(),
          description: $(el).find("p, .description").text().trim()
        })).get().filter(exp => exp.title),
        // Add comprehensive peaks and treks data for adventures section
        comprehensivePeaks: url.includes("adventures") ? getAdventuresPeaksData() : undefined,
        comprehensiveTreks: url.includes("adventures") ? getAdventuresTreksData() : undefined
      }
      
    case "authentication":
      return {
        ...baseContent,
        loginUrl: url,
        accountInfo: {
          accountTypes: ["Government Officials", "Tourism Operators", "Registered Businesses", "Authorized Personnel"],
          eligibility: "Only authorized personnel and registered tourism operators",
          requirements: ["Valid CNIC", "Business License (for operators)", "Official recommendation letter"],
          process: "Submit documents to DTS office for verification and approval"
        },
        formFields: $("input").map((_, el) => ({
          type: $(el).attr("type") || "text",
          name: $(el).attr("name") || "",
          placeholder: $(el).attr("placeholder") || "",
          required: $(el).attr("required") !== undefined
        })).get()
      }
      
    default:
      return baseContent
  }
}

// Intelligent content extraction that finds structured data patterns
function extractStructuredContent($: cheerio.CheerioAPI, contentType: string): any {
  const result: any = {
    headings: $("h1, h2, h3, h4, h5, h6").map((_, el) => $(el).text().trim()).get().filter(Boolean),
    paragraphs: $("p").map((_, el) => $(el).text().trim()).get().filter(text => text.length > 10),
    allText: $("body").text().trim()
  }

  // Extract lists with their context
  const lists = $("ul, ol").map((_, listEl) => {
    const listItems = $(listEl).find("li").map((_, li) => $(li).text().trim()).get().filter(Boolean)
    const precedingHeading = $(listEl).prevAll("h1, h2, h3, h4, h5, h6").first().text().trim()
    const precedingText = $(listEl).prev("p").text().trim()
    
    return {
      items: listItems,
      context: precedingHeading || precedingText || "General List",
      type: listEl.tagName.toLowerCase() // "ul" or "ol"
    }
  }).get().filter(list => list.items.length > 0)

  result.structuredLists = lists

  // Extract numbered/ordered processes - enhanced detection
  const orderedLists = lists.filter(list => list.type === "ol" || 
    list.items.some(item => /^\d+\.?\s/.test(item)) ||
    list.context.toLowerCase().includes("process") ||
    list.context.toLowerCase().includes("step") ||
    list.context.toLowerCase().includes("procedure"))
  
  // Extract processes from the main text using various patterns
  const textProcesses = []
  
  // Pattern 1: "Process" followed by numbered steps like "1Submit online application"
  if (result.allText.includes("Process") || result.allText.includes("process")) {
    const processSection = result.allText.match(/Process[\s\S]*?(?=Contact|Find|Follow|$)/i)
    if (processSection) {
      const stepPattern = /(\d+)\s*([A-Z][^0-9]*?)(?=\d+[A-Z]|$)/g
      let match
      while ((match = stepPattern.exec(processSection[0])) !== null) {
        const step = match[2].trim()
        if (step.length > 10) {
          textProcesses.push(`${match[1]}. ${step}`)
        }
      }
    }
  }
  
  // Pattern 2: Look for specific licensing process keywords
  if (textProcesses.length === 0) {
    const processKeywords = [
      "Submit online application",
      "Pay applicable fees", 
      "Site inspection",
      "Review and verification",
      "License issuance"
    ]
    
    processKeywords.forEach((keyword, index) => {
      if (result.allText.includes(keyword)) {
        // Find the full text around this keyword
        const keywordRegex = new RegExp(`(\\d+)?\\s*${keyword}[^\\d]*?(?=\\d+|$)`, 'i')
        const match = result.allText.match(keywordRegex)
        if (match) {
          textProcesses.push(`${index + 1}. ${match[0].replace(/^\d+\s*/, '').trim()}`)
        }
      }
    })
  }
  
  if (orderedLists.length > 0 || textProcesses.length > 0) {
    result.processes = []
    
    if (orderedLists.length > 0) {
      result.processes.push(...orderedLists.map(list => ({
        title: list.context,
        steps: list.items
      })))
    }
    
    if (textProcesses.length > 0) {
      result.processes.push({
        title: "Application Process",
        steps: textProcesses
      })
    }
  }

  // Extract requirements/documents lists
  const requirementLists = lists.filter(list => 
    list.context.toLowerCase().includes("requirement") ||
    list.context.toLowerCase().includes("document") ||
    list.context.toLowerCase().includes("need") ||
    list.context.toLowerCase().includes("must") ||
    list.items.some(item => item.toLowerCase().includes("cnic") || 
                           item.toLowerCase().includes("passport") ||
                           item.toLowerCase().includes("certificate") ||
                           item.toLowerCase().includes("license")))
  
  if (requirementLists.length > 0) {
    result.requirements = requirementLists.map(list => ({
      category: list.context,
      items: list.items
    }))
  }

  // Extract contact information intelligently
  const contactInfo: any = {}
  const phoneRegex = /(\+92[-\s]?\d{3,4}[-\s]?\d{6,7}|\d{3,4}[-\s]?\d{6,7})/g
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  
  const phones = result.allText.match(phoneRegex)
  const emails = result.allText.match(emailRegex)
  
  if (phones) contactInfo.phones = [...new Set(phones)]
  if (emails) contactInfo.emails = [...new Set(emails)]
  
  // Extract address information
  const addressKeywords = ["address", "location", "office", "building", "secretariat", "gilgit", "baltistan"]
  const addressParagraphs = result.paragraphs.filter((p: string) => 
    addressKeywords.some(keyword => p.toLowerCase().includes(keyword)))
  
  if (addressParagraphs.length > 0) {
    contactInfo.addresses = addressParagraphs
  }
  
  if (Object.keys(contactInfo).length > 0) {
    result.contactInfo = contactInfo
  }

  // Extract tables with proper structure
  const tables = $("table").map((_, table) => {
    const headers = $(table).find("thead th, tr:first-child th, tr:first-child td").map((_, th) => $(th).text().trim()).get().filter(Boolean)
    const rows = $(table).find("tbody tr, tr").not(":first-child").map((_, tr) => 
      $(tr).find("td, th").map((_, cell) => $(cell).text().trim()).get()
    ).get().filter(row => row.length > 0)
    
    const tableTitle = $(table).prevAll("h1, h2, h3, h4, h5, h6").first().text().trim() ||
                      $(table).prev("p").text().trim() ||
                      "Table"
    
    return {
      title: tableTitle,
      headers,
      rows,
      hasHeaders: headers.length > 0
    }
  }).get().filter(table => table.rows.length > 0)

  if (tables.length > 0) {
    result.tables = tables
  }

  // Extract fee information intelligently
  if (result.allText.toLowerCase().includes("fee") || 
      result.allText.toLowerCase().includes("cost") ||
      result.allText.toLowerCase().includes("charge")) {
    
    const feePatterns = result.allText.match(/(?:rs\.?|pkr|rupees?)\s*[\d,]+/gi) || []
    const feeTables = tables.filter(table => 
      table.title.toLowerCase().includes("fee") ||
      table.headers.some(h => h.toLowerCase().includes("fee") || h.toLowerCase().includes("cost")))
    
    result.feeInformation = {
      amounts: [...new Set(feePatterns)],
      tables: feeTables
    }
  }

  return result
}


// Comprehensive adventures data - peaks and treks from DTS website
function getAdventuresPeaksData() {
  return [
    {
      name: "Baintha Brakk West-I",
      elevation: "6640 meters",
      baseCamp: "Baintha Brakk Base Camp",
      firstAscent: "1977",
      difficulty: "Moderate"
    },
    {
      name: "Caumik Kangri",
      elevation: "6754 meters",
      baseCamp: "Chumik Kangri Peak Base Camp",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Gharkun Tower",
      elevation: "6620 meters",
      baseCamp: "Gharkun Tower Base Camp",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Depeak Peak",
      elevation: "7150 meters",
      baseCamp: "Depeak Peak Base Camp",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Ghent Peak II",
      elevation: "7342 meters",
      baseCamp: "Ghent Peak Base Camp",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Ghent Peak",
      elevation: "7401 meters",
      baseCamp: "Ghent Peak Base Camp",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Yazghil dome – N",
      elevation: "7110 meters",
      baseCamp: "Yazghil Glacier / Hoper Valley",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Yazghil dome – S",
      elevation: "7123 meters",
      baseCamp: "Yazghil Glacier / Hoper Valley",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "Yakshin Garden – I",
      elevation: "7400 meters",
      baseCamp: "Yazghil Glacier / Hispar Glacier",
      firstAscent: "",
      difficulty: "Moderate"
    },
    {
      name: "K2",
      elevation: "8611 meters",
      baseCamp: "K2 Base Camp",
      firstAscent: "1954",
      difficulty: "Extreme"
    },
    {
      name: "Nanga Parbat",
      elevation: "8126 meters",
      baseCamp: "Fairy Meadows",
      firstAscent: "1953",
      difficulty: "Extreme"
    },
    {
      name: "Broad Peak",
      elevation: "8051 meters",
      baseCamp: "Broad Peak Base Camp",
      firstAscent: "1957",
      difficulty: "Extreme"
    },
    {
      name: "Gasherbrum I",
      elevation: "8080 meters",
      baseCamp: "Gasherbrum Base Camp",
      firstAscent: "1958",
      difficulty: "Extreme"
    },
    {
      name: "Gasherbrum II",
      elevation: "8034 meters",
      baseCamp: "Gasherbrum Base Camp",
      firstAscent: "1956",
      difficulty: "Extreme"
    }
  ]
}

function getAdventuresTreksData() {
  return [
    {
      name: "TRANGO TOWER/ SHIPTON",
      elevation: "5000 meters",
      route: "Islamabad-Skardu-Shigar-Askoli-Korophon-Paiju-Urdukas-Concordia, K-2 & Broad Peak BC-Gashabrum BC & return via same route to Skardu or cross Gondogoro La Or Vigne Pass, K-7, K-6 BC-Hushe-Skardu or Vice versa",
      difficulty: "Moderate"
    },
    {
      name: "BALTORO – GONDOGORO- HUSHE",
      elevation: "5000 meters",
      route: "Islamabad-Skardu-Shigar-Askoli-Korophon-Paiju-Urdukas-Concordia, K-2 & Broad Peak BC-Gashabrum BC & return via same route to Skardu or cross Gondogoro La Or Vigne Pass, K-7, K-6 BC-Hushe-Skardu or Vice versa",
      difficulty: "Moderate"
    },
    {
      name: "CHILINJI TREK",
      elevation: "5291 meters",
      route: "Chitral Ishkarwarz, Karambar Pass, Chilinji Pass, Chapursan Valley, Gilgit or vice versa",
      difficulty: "Moderate"
    },
    {
      name: "DARKOT PASS",
      elevation: "4703 meters",
      route: "Chitral, Mastuj, Lasht, Darkut Pass, Ishkoman Gilgit or vice versa",
      difficulty: "Moderate"
    },
    {
      name: "ARKARI TREK",
      elevation: "6000 meters",
      route: "Chitral, Shugur Biyasan, Babu Camp, Arkari, Garam Chashma, Shahgram, Chitral or vice versa",
      difficulty: "Moderate"
    },
    {
      name: "Zindikharam Pass",
      elevation: "4600 meters",
      route: "Chitral, Shah Junali, Paur, Gazin, Lasht, Kishmanja, Ishkarwarz to Darkot Pass, or Karambar Pass, Zindikharam Pass, Ishkoman, Gilgit or vice versa",
      difficulty: "Moderate"
    },
    {
      name: "SHAH – JUNALI – CHILLUI PASS",
      elevation: "5291 meters",
      route: "Chitral, Rua, Shah Junali, Lasht, Ishkarwarz, Karambar Pass, Chilinji Pass, Chapursan Valley, Gilgit & vice versa",
      difficulty: "Moderate"
    },
    {
      name: "Khot Pass",
      elevation: "4890 meters",
      route: "Chitral, Turkhow, Khot Pass, Ochall, Ishkarwaz, Karambar Pass, Ishkoman Valley, Gilgit or vice versa",
      difficulty: "Moderate"
    },
    {
      name: "ISHKOMAN & DARKUT PASSES",
      elevation: "4650 meters",
      route: "Gilgit, Ishkoman, Ishkoman Pass, Darkot, Darkot Pass, Baroghil to Mastuj & Back to Gilgit",
      difficulty: "Moderate"
    },
    {
      name: "Fairy Meadows Trek",
      elevation: "3300 meters",
      route: "Raikot Bridge - Tato - Fairy Meadows - Beyal Camp - Nanga Parbat Base Camp",
      difficulty: "Easy to Moderate"
    },
    {
      name: "Rush Lake Trek",
      elevation: "4694 meters",
      route: "Karimabad - Hoper Valley - Rush Lake",
      difficulty: "Moderate"
    },
    {
      name: "Snow Lake Trek",
      elevation: "4877 meters",
      route: "Askole - Korofon - Biafo Glacier - Snow Lake - Hispar La - Hispar Glacier",
      difficulty: "Difficult"
    },
    {
      name: "Rakaposhi Base Camp Trek",
      elevation: "3899 meters",
      route: "Minapin - Hapakun - Tagaphari - Rakaposhi Base Camp",
      difficulty: "Moderate"
    }
  ]
}

// Helper function to collect all URLs from the hierarchical structure
function collectAllUrls(sections: WebsiteSection[], parentSection?: string): Array<{url: string, section: string, parentSection?: string}> {
  const urls: Array<{url: string, section: string, parentSection?: string}> = []
  
  for (const section of sections) {
    // Add the main section URL
    urls.push({
      url: section.url,
      section: section.title,
      parentSection
    })
    
    // Recursively add children URLs
    if (section.children && section.children.length > 0) {
      const childUrls = collectAllUrls(section.children, section.title)
      urls.push(...childUrls)
    }
  }
  
  return urls
}

// Enhanced function to scrape all URLs with delay to avoid overwhelming the server
export async function scrapeAllDTSWebsites(): Promise<ScrapedData[]> {
  const allUrls = collectAllUrls(DTS_WEBSITE_STRUCTURE)
  
  // Add main website
  allUrls.unshift({
    url: "https://dtsgb.gog.pk/",
    section: "Main Website",
    parentSection: undefined
  })
  
  console.log(`Found ${allUrls.length} URLs to scrape`)

    const scrapedData: ScrapedData[] = []
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  for (let i = 0; i < allUrls.length; i++) {
    const {url, section, parentSection} = allUrls[i]
    console.log(`\nScraping ${i + 1}/${allUrls.length}: ${url}`)

    try {
      const data = await scrapeWebsiteToJSON(url, section, parentSection)
      if (data) {
        scrapedData.push(data)
        console.log(`✅ Successfully scraped: ${section}`)
      } else {
        console.log(`❌ Failed to scrape: ${section}`)
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error)
    }
    
    // Add delay between requests to be respectful to the server
    if (i < allUrls.length - 1) {
      await delay(2000) // 2 second delay between requests
    }
  }
  
  console.log(`\n✅ Completed scraping ${scrapedData.length}/${allUrls.length} URLs successfully`)
  return scrapedData
}

export async function updateKnowledgeBase(): Promise<void> {
  try {
    console.log("🚀 Starting comprehensive DTS knowledge base update...")
    console.log("This may take several minutes due to respectful scraping delays...")

    const scrapedData = await scrapeAllDTSWebsites()

    const knowledgeBase: KnowledgeBase = {
      lastUpdated: new Date().toISOString(),
      baseUrl: "https://dtsgb.gog.pk/",
      sources: scrapedData,
      sections: DTS_WEBSITE_STRUCTURE,
      faq: [
        {
          question: "What is DTS?",
          answer: "DTS (Directorate of Tourism Services) is the official government department for tourism in Gilgit-Baltistan, Pakistan. It manages tourism services, licensing, permits, and promotes the region's natural beauty."
        },
        {
          question: "How do I apply for tourism licenses in Gilgit-Baltistan?",
          answer: "You can apply for various tourism licenses including Tour Operator License, Hotel/Camping License, and Tour Guide License through the DTS online portal at https://app.dtsgb.gog.pk/app after creating an account."
        },
        {
          question: "What are the fees for expeditions and tourism services?",
          answer: "DTS has different fee structures for general tourism services and expedition fees. Detailed fee information is available on the official website under the Fees & Expeditions section."
        },
        {
          question: "How can I get a tourist visa for Gilgit-Baltistan?",
          answer: "Tourist visa information, eligibility criteria, required documents, and application process are available on the DTS website. You can apply online and check all requirements before visiting."
        },
        {
          question: "What mountaineering opportunities are available in Gilgit-Baltistan?",
          answer: "Gilgit-Baltistan offers world-class mountaineering opportunities including K2, Nanga Parbat, and many other peaks. DTS provides information on historical summits, upcoming expeditions, and successful climbers."
        },
        {
          question: "Where can I find the latest news and advisories for tourism in Gilgit-Baltistan?",
          answer: "The latest tourism news, advisories, and safety updates are regularly published on the DTS website's News & Advisories section. This includes important travel information and expedition updates."
        },
        {
          question: "What adventure activities are available in Gilgit-Baltistan?",
          answer: "The region offers various mountain adventures including trekking, mountaineering, rock climbing, river rafting, and cultural tours. Information about these activities is available through DTS services."
        },
        {
          question: "How can I contact DTS for support?",
          answer: "You can contact DTS through multiple channels: Phone: +92-5811-920001, Email: info@dtsgb.gog.pk, Helpline: 1422, or visit their office at Directorate of Tourism Services, Gilgit-Baltistan."
        },
        {
          question: "What are the popular destinations in Gilgit-Baltistan?",
          answer: "Popular destinations include Skardu (gateway to K2), Hunza Valley, Fairy Meadows (Nanga Parbat base camp), Deosai National Park, Khunjerab Pass, and many other stunning locations with rich cultural heritage."
        },
        {
          question: "What regulations should tourists be aware of?",
          answer: "Tourists should be aware of local regulations regarding permits, protected areas, cultural sensitivities, and safety guidelines. Complete regulation information is available through DTS official channels."
        }
      ]
    }

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })

    // Write to JSON file
    const filePath = path.join(dataDir, "knowledge-base.json")
    await fs.writeFile(filePath, JSON.stringify(knowledgeBase, null, 2))

    console.log(`\n🎉 Knowledge base updated successfully!`)
    console.log(`📊 Total sources scraped: ${scrapedData.length}`)
    console.log(`📁 Data saved to: ${filePath}`)
    console.log(`🕒 Last updated: ${knowledgeBase.lastUpdated}`)

    // Print summary of scraped sections
    console.log("\n📋 Scraped sections summary:")
    const sectionCounts = scrapedData.reduce((acc, data) => {
      const section = data.section || "Unknown"
      acc[section] = (acc[section] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`  • ${section}: ${count} page(s)`)
    })

  } catch (error) {
    console.error("❌ Error updating knowledge base:", error)
    throw error
  }
}

export async function loadKnowledgeBase(): Promise<KnowledgeBase | null> {
  try {
    const filePath = path.join(process.cwd(), "data", "knowledge-base.json")
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error loading knowledge base:", error)
    return null
  }
}
