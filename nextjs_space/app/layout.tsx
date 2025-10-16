
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Footer } from "@/components/footer"
import { CorexChatWidget } from "@/components/corex/corex-chat-widget"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flow - Revenue Intelligence Platform",
  description: "AI-powered revenue intelligence for beauty and health clinics",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <div className="flex-1">{children}</div>
          <Footer />
          <CorexChatWidget />
        </Providers>
      </body>
    </html>
  )
}
