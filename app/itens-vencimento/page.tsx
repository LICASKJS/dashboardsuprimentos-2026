import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { ExpiringItemsView } from "@/components/expiring-items-view"
import { DashboardFiltersBar } from "@/components/dashboard-filters-bar"
import { parseDashboardFilters, type SearchParams } from "@/lib/filters"
import { getExpiringItemsPageData } from "@/lib/server/solicitacoes"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ItensVencimentoPage({ searchParams }: { searchParams: SearchParams | Promise<SearchParams> }) {
  const filters = parseDashboardFilters(await Promise.resolve(searchParams), { granularity: "month" })
  const data = getExpiringItemsPageData({ filters })

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Itens Próximos do Vencimento</h1>
            <p className="text-muted-foreground">Itens com necessidade nos próximos 7 dias ({data.items.length})</p>
          </div>

          <Link
            href="/itens-atrasados"
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4" />
            Ver Atrasados
          </Link>
        </div>

        <DashboardFiltersBar initialFilters={filters} options={data.options} />
        <ExpiringItemsView items={data.items} />
      </div>
    </main>
  )
}
