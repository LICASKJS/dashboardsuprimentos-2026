import { DashboardFiltersBar } from "@/components/dashboard-filters-bar"
import { DesempenhoStats } from "@/components/desempenho-stats"
import { DesempenhoCharts } from "@/components/desempenho-charts"
import { parseDashboardFilters, type SearchParams } from "@/lib/filters"
import { getDesempenhoPageData } from "@/lib/server/export-suprimentos"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function DesempenhoPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseDashboardFilters(searchParams, { granularity: "month" })
  const data = getDesempenhoPageData(filters, { top: 12 })

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Desempenho</h1>
          <p className="text-muted-foreground">
            Valor total, itens/solicitações atendidas, revisões e lead times por comprador (conforme filtros)
          </p>
        </div>

        <DashboardFiltersBar initialFilters={filters} options={data.options} />
        <DesempenhoStats kpis={data.kpis} />
        <DesempenhoCharts data={data} />
      </div>
    </main>
  )
}

