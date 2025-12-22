"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, Settings, Clock, AlertTriangle, KanbanSquare } from "lucide-react"
import { ExcelDataUploadButton } from "@/components/excel-data-upload-button"

const navLinks = [
  { href: "/", label: "Início", icon: Home },
  { href: "/compradores", label: "Compradores", icon: Users },
  { href: "/processos", label: "Processos", icon: Settings },
  { href: "/desempenho", label: "Desempenho", icon: Clock },
  { href: "/itens-atrasados", label: "Itens Atrasados", icon: AlertTriangle },
  { href: "/planner", label: "Planner", icon: KanbanSquare },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-4 mt-4">
        <div className="relative rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-lg shadow-gray-200/20">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-t-2xl" />

          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-white rounded-xl p-1.5 shadow-sm">
                  <Image src="/images/image.png" alt="Logo" width={32} height={32} className="object-contain" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Suprimentos
                </span>
                <span className="block text-[10px] text-gray-500 font-medium -mt-1">Dashboard 2026</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 group",
                        isActive ? "text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                      )}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-md shadow-orange-500/25" />
                      )}
                      <Icon
                        className={cn(
                          "w-4 h-4 relative z-10",
                          isActive ? "text-white" : "text-gray-500 group-hover:text-orange-500",
                        )}
                      />
                      <span className="relative z-10 hidden md:inline">{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
              <ExcelDataUploadButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
