import ChatInterface from "./components/ChatInterface"
import { Suspense } from "react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#239BA7] via-[#239BA7] to-[#7ADAA5]">
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading DTS Assistant...
            </div>
          }
        >
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  )
}
