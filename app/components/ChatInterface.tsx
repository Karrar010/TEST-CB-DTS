"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface Message {
  id: string
  sender: "user" | "bot"
  text: string
  timestamp: Date
  isTyping?: boolean
}

// Enhanced SVG icons with new color scheme
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

const BotIcon = () => (
  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 flex-shrink-0 min-w-[40px] min-h-[40px]">
    <img 
      src="/dts-logo.png" 
      alt="DTS Assistant" 
      className="w-8 h-8 object-contain"
      style={{ 
        width: '32px', 
        height: '32px',
        minWidth: '32px', 
        minHeight: '32px',
        maxWidth: '32px', 
        maxHeight: '32px' 
      }}
    />
  </div>
)

const UserIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-[#E1AA36] to-[#239BA7] rounded-full flex items-center justify-center shadow-lg">
    <span className="text-white text-sm">👤</span>
  </div>
)

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatBotMessage = (text: string) => {
    // Enhanced formatting for bot responses with new color scheme
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#239BA7] font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-700">$1</em>')
      .replace(/•/g, '<span class="text-[#7ADAA5]">•</span>')
      .replace(/(\d+\.)/g, '<span class="text-[#239BA7] font-medium">$1</span>')
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" class="text-[#E1AA36] hover:text-[#239BA7] underline">$1</a>',
      )
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setInput("")

    try {
      console.log("Sending message:", input)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Bot response data:", data)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.response || "I'm here to help with DTS services. What would you like to know?",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Hello! I'm your Tourism Services Assistant for DTS Gilgit-Baltistan.\n\n**About DTS:**\nDTS (Directorate of Tourism Services) is the official government department for tourism in Gilgit-Baltistan, Pakistan. We help with login assistance, account creation, tourism information, and platform navigation.\n\n📞 **Contact:**\n• Phone: +92-5811-920001\n• Email: info@dtsgb.gog.pk\n• Website: https://dtsgb.gog.pk/\n\nWhat can I help you with today?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Enhanced Header with new color scheme */}
        <div className="bg-gradient-to-r from-[#239BA7] via-[#7ADAA5] to-[#239BA7] text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Image src="/dts-logo.png" alt="DTS Logo" width={60} height={60} className="rounded-lg shadow-md" />
              <div>
                <h2 className="text-xl font-bold">Tourism Services Assistant</h2>
                <p className="text-white/80 text-sm">TSA • DTS Gilgit-Baltistan Portal Guide</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <p className="text-white/80">Status: Online</p>
                <p className="text-white/60 text-xs">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>
              <button
                onClick={clearChat}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <RefreshIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-6 bg-gradient-to-b from-[#ECECBB]/20 to-white">
          {messages.length === 0 ? (
            // Enhanced empty state with better messaging
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                <div className="mb-8">
                  <Image
                    src="/dts-logo.png"
                    alt="DTS - Directorate of Tourism Services, Government of Gilgit-Baltistan"
                    width={140}
                    height={140}
                    className="mx-auto opacity-90 drop-shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[#239BA7] mb-2">Tourism Services Assistant</h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Your intelligent guide for DTS Gilgit-Baltistan services and support
                  </p>
                  <div className="bg-gradient-to-r from-[#ECECBB]/30 to-[#7ADAA5]/20 rounded-xl p-4 mt-6">
                    <p className="text-sm text-gray-700 font-medium mb-3 text-center">I can help you with:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                        <span className="w-2 h-2 bg-[#7ADAA5] rounded-full"></span>
                        <span className="text-xs text-gray-700">Login Assistance</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                        <span className="w-2 h-2 bg-[#239BA7] rounded-full"></span>
                        <span className="text-xs text-gray-700">Account Creation</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                        <span className="w-2 h-2 bg-[#E1AA36] rounded-full"></span>
                        <span className="text-xs text-gray-700">Tourism Info</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-3 py-2">
                        <span className="w-2 h-2 bg-[#239BA7] rounded-full"></span>
                        <span className="text-xs text-gray-700">Platform Navigation</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-xs text-gray-400 italic">
                      Ask me about DTS services, login help, or tourism in Gilgit-Baltistan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex items-start space-x-3 max-w-4xl ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    {msg.sender === "user" ? <UserIcon /> : <BotIcon />}
                    <div
                      className={`p-4 rounded-2xl shadow-lg ${
                        msg.sender === "user"
                          ? "bg-gradient-to-br from-[#E1AA36] to-[#239BA7] text-white rounded-br-md"
                          : "bg-white border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <div
                        className={`text-sm leading-relaxed ${msg.sender === "user" ? "text-white" : "text-gray-800"}`}
                      >
                        {msg.sender === "bot" ? (
                          <div dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                      <div
                        className={`text-xs mt-3 flex items-center ${
                          msg.sender === "user" 
                            ? "justify-end text-white/80" 
                            : "justify-between text-gray-500"
                        }`}
                      >
                        <span>{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.sender === "bot" && (
                          <span className="bg-[#7ADAA5]/20 text-[#239BA7] px-2 py-1 rounded-full text-xs font-medium">
                            TSA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <BotIcon />
                    <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-md shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#7ADAA5] rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-[#7ADAA5] rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[#7ADAA5] rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">Consulting DTS knowledge base...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area */}
        <div className="p-6 bg-white">
          <div className="flex justify-center">
            <div className="relative w-[600px]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about login, account creation, tourism services, or navigation help..."
                className="w-full border-2 border-[#7ADAA5]/30 focus:border-[#239BA7] bg-gradient-to-r from-[#ECECBB]/10 to-[#7ADAA5]/10 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ADAA5]/40 transition-all duration-200 placeholder:text-gray-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#239BA7] to-[#7ADAA5] hover:from-[#7ADAA5] hover:to-[#239BA7] disabled:from-gray-300 disabled:to-gray-400 text-white p-2 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                <SendIcon />
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">Press Enter to Send • Press Shift + Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  )
}
