import { DashboardFiltersBar } from "@/components/dashboard-filters-bar"
import { BuyerCharts } from "@/components/buyer-charts"
import { BuyerStats } from "@/components/buyer-stats"
import { parseDashboardFilters, type SearchParams } from "@/lib/filters"
import { getCompradoresPageData } from "@/lib/server/solicitacoes"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function CompradoresPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseDashboardFilters(searchParams, { granularity: "month" })
  const data = getCompradoresPageData(filters, { top: 30 })

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compradores</h1>
          <p className="text-muted-foreground">Itens/solicitações por comprador e filial (mês atual, em aberto/cotação)</p>
        </div>

        <DashboardFiltersBar initialFilters={filters} options={data.options} />
        <BuyerStats summary={data.summary} />
        <BuyerCharts summary={data.summary} />
      </div>
    </main>
  )
}
