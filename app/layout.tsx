 import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Header } from "@/components/header"
import { AnimatedBackground } from "@/components/animated-background"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dashboard de Suprimentos 2026",
  description: "Sistema Integrado de Gestão de Compras e Suprimentos",
  icons: {
    icon: "/ico.png",
    apple: "/ico.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        <AnimatedBackground />
        <Header />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
