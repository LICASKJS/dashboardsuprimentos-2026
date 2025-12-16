import { DashboardFiltersBar } from "@/components/dashboard-filters-bar"
import { ProcessCharts } from "@/components/process-charts"
import { parseDashboardFilters, type SearchParams } from "@/lib/filters"
import { getProcessosPageData } from "@/lib/server/export-suprimentos"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function ProcessosPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseDashboardFilters(searchParams, { granularity: "month" })
  const data = getProcessosPageData(filters, { top: 10 })

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Processos</h1>
          <p className="text-muted-foreground">
            Contagem por frete, top fornecedores, valor por item, condição de pagamento e demandas (conforme filtros)
          </p>
        </div>

        <DashboardFiltersBar initialFilters={filters} options={data.options} />
        <ProcessCharts summary={data.summary} />
      </div>
    </main>
  )
}

