import Image from "next/image"
import { DashboardStats } from "@/components/dashboard-stats"
import { QuickAccessCards } from "@/components/quick-access-cards"
import { getBuyerYearSummary, getSolicitacoesDashboardCounts } from "@/lib/server/solicitacoes"
import { getLeadTimeSummary } from "@/lib/server/export-suprimentos"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function HomePage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const buyerSummary = getBuyerYearSummary({ year })
  const solicitacoesCounts = getSolicitacoesDashboardCounts({ now })
  const leadTimeSummary = getLeadTimeSummary({ year, month })

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8 flex justify-center">
            <Image src="/images/image.png" alt="Company Logo" width={180} height={100} className="object-contain" />
          </div>

          <div className="hero-badge">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
              <path d="M3 12h6m6 0h6" />
            </svg>
            <span>Sistema Integrado de Gestão</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Dashboard <span className="gradient-text">Suprimentos 2026</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Gerencie fornecedores, monitore indicadores e tome decisões estratégicas com dados centralizados.
          </p>

          <DashboardStats
            totalCompradores={buyerSummary.totalCompradores}
            pedidosMes={leadTimeSummary.pcsEmitidosMes}
            itensEmAberto={solicitacoesCounts.itensEmAberto}
            itensAtrasados={solicitacoesCounts.itensAtrasados}
          />
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Visão Geral do Sistema</h2>
            <p className="text-muted-foreground">Acompanhe os principais indicadores e áreas do sistema</p>
          </div>

          <QuickAccessCards />
        </div>
      </section>
    </main>
  )
}
