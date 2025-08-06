import { NextResponse } from "next/server"
import { loadKnowledgeBase } from "../../../lib/scraper"

export async function GET() {
  try {
    // Check if knowledge base is accessible
    const knowledgeBase = await loadKnowledgeBase()
    
    if (!knowledgeBase) {
      return NextResponse.json(
        { 
          status: "unhealthy", 
          message: "Knowledge base not found",
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Check if knowledge base is reasonably fresh (less than 24 hours old)
    const lastUpdated = new Date(knowledgeBase.lastUpdated)
    const hoursOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)
    
    if (hoursOld > 24) {
      return NextResponse.json(
        { 
          status: "degraded", 
          message: `Knowledge base is ${Math.floor(hoursOld)} hours old`,
          lastUpdated: knowledgeBase.lastUpdated,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      status: "healthy",
      message: "Service is running normally",
      knowledgeBase: {
        lastUpdated: knowledgeBase.lastUpdated,
        totalSources: knowledgeBase.sources?.length || 0,
        hoursOld: Math.floor(hoursOld * 10) / 10
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      { 
        status: "unhealthy", 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}