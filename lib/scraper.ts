import * as cheerio from "cheerio"
import fs from "fs/promises"
import path from "path"

interface ScrapedData {
  url: string
  title: string
  scrapedAt: string
  content: any
}

interface KnowledgeBase {
  lastUpdated: string
  sources: ScrapedData[]
  faq: Array<{
    question: string
    answer: string
  }>
}

const DTS_URLS = ["https://dtsgb.gog.pk/", "https://app.dtsgb.gog.pk/auth/login"]

export async function scrapeWebsiteToJSON(url: string): Promise<ScrapedData | null> {
  try {
    console.log(`Scraping: ${url}`)

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove unwanted elements
    $("script, style, nav, footer, .advertisement, noscript").remove()

    const title = $("title").text().trim() || "DTS Page"

    let structuredContent: any = {}

    if (url.includes("dtsgb.gog.pk") && !url.includes("auth")) {
      // Main website - extract tourism info
      structuredContent = {
        about:
          $("h1, .about, .description").first().text().trim() ||
          "Directorate of Tourism Services (DTS) Gilgit-Baltistan official website",
        services: $("ul li, .service, .services li")
          .map((_, el) => $(el).text().trim())
          .get()
          .filter((text) => text.length > 10)
          .slice(0, 10),
        destinations: $("h2, h3, .destination, .place")
          .map((_, el) => {
            const name = $(el).text().trim()
            const desc = $(el).next("p").text().trim()
            return name.length > 0 ? { name, description: desc || "Popular destination in Gilgit-Baltistan" } : null
          })
          .get()
          .filter(Boolean)
          .slice(0, 8),
        contact: {
          phone: "+92-5811-920001",
          email: "info@dtsgb.gog.pk",
          helpline: "1422",
          address: "Directorate of Tourism Services, Gilgit-Baltistan",
        },
        headings: $("h1, h2, h3")
          .map((_, el) => $(el).text().trim())
          .get()
          .filter((text) => text.length > 0)
          .slice(0, 15),
        links: $("a")
          .map((_, el) => {
            const href = $(el).attr("href")
            const text = $(el).text().trim()
            return href && text ? { text, href } : null
          })
          .get()
          .filter(Boolean)
          .slice(0, 10),
      }
    } else if (url.includes("auth/login")) {
      // Login page - extract login info
      structuredContent = {
        loginUrl: url,
        accountTypes: ["Government Officials", "Tourism Operators", "Registered Businesses", "Authorized Personnel"],
        loginSteps: [
          "Visit https://app.dtsgb.gog.pk/auth/login",
          "Enter your username/email",
          "Enter your password",
          "Click Sign In button",
        ],
        formFields: $("input")
          .map((_, el) => {
            const type = $(el).attr("type") || "text"
            const name = $(el).attr("name") || ""
            const placeholder = $(el).attr("placeholder") || ""
            return { type, name, placeholder }
          })
          .get(),
        commonIssues: [
          {
            issue: "Forgot Password",
            solution: "Click 'Forgot Password' link on login page or contact IT support",
          },
          {
            issue: "Account Locked",
            solution: "Contact system administrator or call +92-5811-920001",
          },
          {
            issue: "Browser Issues",
            solution: "Clear cache, try different browser, enable JavaScript",
          },
        ],
        accountCreation: {
          eligibility: "Only authorized personnel and registered tourism operators",
          requirements: [
            "Valid CNIC",
            "Business License (for operators)",
            "Official recommendation letter",
            "Contact DTS office for approval",
          ],
          process: "Submit documents to DTS office for verification and approval",
        },
      }
    }

    return {
      url,
      title,
      scrapedAt: new Date().toISOString(),
      content: structuredContent,
    }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}

export async function updateKnowledgeBase(): Promise<void> {
  try {
    console.log("Starting knowledge base update...")

    const scrapedData: ScrapedData[] = []

    for (const url of DTS_URLS) {
      const data = await scrapeWebsiteToJSON(url)
      if (data) {
        scrapedData.push(data)
      }
    }

    const knowledgeBase: KnowledgeBase = {
      lastUpdated: new Date().toISOString(),
      sources: scrapedData,
      faq: [
        {
          question: "What is DTS?",
          answer:
            "DTS (Directorate of Tourism Services) is the official government department for tourism in Gilgit-Baltistan, Pakistan.",
        },
        {
          question: "How do I login to DTS system?",
          answer:
            "Visit https://app.dtsgb.gog.pk/auth/login, enter your credentials, and click Sign In. Only authorized personnel can access the system.",
        },
        {
          question: "Can I create a DTS account?",
          answer:
            "Account creation is restricted to authorized government personnel and registered tourism operators. Contact DTS office with required documents.",
        },
        {
          question: "What tourism services does DTS provide?",
          answer:
            "DTS provides tourist information, travel permits, safety coordination, infrastructure development, and adventure tourism facilitation.",
        },
        {
          question: "What are popular destinations in Gilgit-Baltistan?",
          answer:
            "Popular destinations include Skardu, Hunza Valley, Fairy Meadows, Deosai National Park, Khunjerab Pass, and many more beautiful locations.",
        },
      ],
    }

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), "data")
    await fs.mkdir(dataDir, { recursive: true })

    // Write to JSON file
    const filePath = path.join(dataDir, "knowledge-base.json")
    await fs.writeFile(filePath, JSON.stringify(knowledgeBase, null, 2))

    console.log(`Knowledge base updated successfully with ${scrapedData.length} sources`)
    console.log(`Data saved to: ${filePath}`)
  } catch (error) {
    console.error("Error updating knowledge base:", error)
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
