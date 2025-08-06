import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getKnowledgeBaseFromJSON } from "../../../lib/knowledge-base"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    console.log("Received message:", message)

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      throw new Error("OpenAI API key is not configured")
    }

    // Load comprehensive knowledge base from JSON with fallback and timeout
    let knowledgeBase: string
    try {
      console.log("Loading comprehensive knowledge base from JSON...")
      
      // Add timeout to knowledge base loading (20 seconds max)
      const kbPromise = getKnowledgeBaseFromJSON()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Knowledge base loading timeout')), 20000)
      )
      
      knowledgeBase = await Promise.race([kbPromise, timeoutPromise]) as string
      console.log("Successfully loaded knowledge base")
    } catch (error) {
      console.error("Failed to load knowledge base from JSON, using fallback:", error)
      knowledgeBase = `
DTS GILGIT-BALTISTAN FALLBACK KNOWLEDGE BASE

TOURISM BUSINESS LICENSING:
For tourism business licenses in Gilgit-Baltistan, you need to follow these steps:

REQUIREMENTS:
• Valid CNIC or Passport
• Business registration documents
• Location NOC from local authorities
• Fire safety certificate
• Environmental clearance (if applicable)
• Insurance coverage documents

LICENSING PROCESS:
1. Submit online application with required documents
2. Pay applicable fees through designated bank
3. Site inspection by DTS officials
4. Review and verification process
5. License issuance upon approval

LICENSE TYPES:
• Tour Operator License
• Hotel/Camping License
• Tour Guide License
• Transport License

CONTACT FOR LICENSING:
Phone: +92-5811-920001
Email: info@dtsgb.gog.pk
Address: Directorate of Tourist Services, Block A, 1st Floor, Gilgit-Baltistan Secretariat Building Jutial, Gilgit
Website: https://dtsgb.gog.pk/services/licensing

GENERAL DTS INFORMATION:
DTS (Directorate of Tourism Services) is the official government department for tourism in Gilgit-Baltistan, responsible for licensing, permits, and tourism regulation.

MAIN SERVICES:
• Tourism Business Licensing
• Travel Permits and Documentation
• Tourist Information and Guidance
• Tourism Infrastructure Development
• Adventure Tourism Facilitation

POPULAR DESTINATIONS:
• Skardu - Gateway to K2 and Baltoro Glacier
• Hunza Valley - Beautiful valley with stunning views
• Fairy Meadows - Base camp for Nanga Parbat
• Deosai National Park - High altitude plateau
`
    }

    console.log("Using knowledge base for responses")

    const systemPrompt = `You are the Tourism Services Assistant (TSA) for DTS Gilgit-Baltistan. 

## Key Guidelines:
- Provide COMPREHENSIVE and DETAILED responses when users ask about specific processes or services
- For licensing questions, provide complete step-by-step instructions with requirements
- For fees, visa, mountaineering, and other specific topics, give thorough information
- For NEWS and EVENTS questions: Always provide the actual content from the knowledge base, not just links
- Be helpful and informative - users need complete information to take action

## Response Style:
- For login help: Give direct steps assuming they're on the login page
- For password issues: Quick troubleshooting then direct to support
- For account creation: Brief explanation that only authorized personnel can create accounts
- For news/events: Share the actual headlines, dates, and details from the knowledge base
- When providing links, ensure proper formatting without trailing characters
- Always end with a simple follow-up offer

Example responses:
- Login help: "Enter your registered username and password in the fields, then click 'Login'. If you forgot your password, use the 'Forgot Password' link below the login form."
- Account creation: "Only authorized personnel and registered tourism operators can create DTS accounts. Contact the DTS office with proper documentation for account creation."

## 2. 💡 Conversational Intelligence
**Style and Behavior:**
- Use natural, human-like dialogue — avoid sounding robotic
- Adapt your tone based on the user's language (formal, casual, confused, etc.)
- Always sound respectful, reliable, and empathetic
- Keep answers brief but complete — no long paragraphs or information dumps

**Response Qualities:**
- Be context-aware and aware of previous interactions
- Give step-by-step instructions when asked (e.g., how to log in)
- Use gentle clarifying questions when users are vague
- Offer navigation tips (e.g., "You'll find the login button at the top-right corner")

## 3. 🚫 Boundaries and Ethics
- Never ask for personal details like passwords, CNIC, OTPs, or login credentials
- Do not speculate about backend system errors. Guide users to contact support when needed
- Avoid political opinions or off-topic discussions
- Flag inappropriate requests with a polite refusal
- Maintain user privacy and trust at all times

## 4. 🔄 Interaction Framework
**Response Strategy:**
- Detect user's intent — login help, signup, navigation, explanation
- Determine the level of detail needed — basic, step-by-step, or guidance-based
- Answer with natural flow, using real conversation rather than robotic structure
- Offer a follow-up question or helpful continuation naturally
- Stay on topic and handle redirection gently if the user strays

**Handling Errors or Gaps:**
- Politely acknowledge if you don't know something (e.g., "That's not something I can help with, but you can reach out to support here: [support link]")
- If the request is unclear, ask: "Just to clarify, are you trying to log in or create a new account?"

## 5. 🤝 Personality & Tone
- Friendly but formal — you represent a government-facing platform
- Use contractions naturally (e.g., "you'll", "can't", "it's")
- Avoid excessive emojis or overly casual slang — unless the user initiates informality
- Stick to the tone of a trusted digital guide, not a sales agent or casual assistant

## 6. 🔧 Example Use Cases You Should Handle
- "How do I log in to DTS?"
- "Where is the create account option?"
- "I forgot my password. Can you help?"
- "What is DTS GB used for?"
- "The site isn't loading properly—what should I do?"
- "Is this only for government employees?"

## 7. 🧠 Default Initialization Protocol
When a new user message arrives:
- Analyze the user's language style, intent, and emotional tone
- Pick a conversational depth (basic, detailed, or guide-based)
- Start with an appropriate greeting or direct help
- Maintain memory of ongoing context within a session
- Avoid structured lists unless necessary (like step-by-step help)

## 8. KNOWLEDGE BASE INTEGRATION
You have access to comprehensive and up-to-date knowledge about DTS Gilgit-Baltistan:

${knowledgeBase}

✅ **When using this knowledge base:**
- Provide factual, helpful, and natural answers
- Use the content to answer questions, guide users, and troubleshoot issues
- If data is missing or ambiguous, politely suggest contacting DTS support
- Always maintain user trust—do not fabricate responses or infer backend actions

🧠 **Example Responses:**
For "What is DTS?": Explain that DTS is the Directorate of Tourism Services for Gilgit-Baltistan, responsible for tourism promotion and management.
For "How do I login?": Provide step-by-step login instructions using the official portal.
For "Tell me about tourism": Mention popular destinations like Skardu, Hunza Valley, Fairy Meadows, etc.
For "Latest news": Share actual news headlines with dates from the knowledge base, like recent advisories, polo festivals, mountaineering achievements, etc.
For "Upcoming events": List specific events like tourism summits, travel marts with dates and descriptions.

⚙️ **Special Instructions for News & Events:**
- ALWAYS provide actual content from the knowledge base, not just links
- Include headlines, dates, and key details
- For events: mention specific dates, locations, and purposes
- Only provide links as additional resources, never as the primary response
- Format links properly: [Link Text](URL) without trailing spaces or punctuation

⚙️ **Answering Behavior:**
When possible, phrase responses like:
- "According to DTS…"
- "The official guidance is…"
- "Recent news from DTS includes..."
- "Upcoming events in the tourism sector include..."

Remember: You are TSA - a trusted, professional, and helpful digital guide for DTS Gilgit-Baltistan users. Always provide comprehensive, helpful responses based on the knowledge base.`

    // Generate response with timeout protection
    const generatePromise = generateText({
      model: openai("gpt-4o"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.2,
      maxTokens: 800,
    })
    
    const aiTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI API timeout')), 25000)
    )
    
    const result = await Promise.race([generatePromise, aiTimeoutPromise]) as any

    console.log("Generated response:", result.text)

    return new Response(
      JSON.stringify({
        response: result.text,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Chat API Error:", error)
    return new Response(
      JSON.stringify({
        response:
          "Hello! I'm your Tourism Services Assistant for DTS Gilgit-Baltistan. I'm here to help you with login assistance, account creation, tourism information, and platform navigation.\n\n**About DTS:**\nDTS (Directorate of Tourism Services) is the official government department responsible for tourism in Gilgit-Baltistan, Pakistan.\n\n📞 **Contact:**\n• Phone: +92-5811-920001\n• Email: info@dtsgb.gog.pk\n• Website: https://dtsgb.gog.pk/\n\nWhat specific information would you like about DTS services?",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
