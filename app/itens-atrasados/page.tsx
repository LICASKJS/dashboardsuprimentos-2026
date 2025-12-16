import Link from "next/link"
import { Clock } from "lucide-react"
import { DelayedItemsView } from "@/components/delayed-items-view"
import { DashboardFiltersBar } from "@/components/dashboard-filters-bar"
import { parseDashboardFilters, type SearchParams } from "@/lib/filters"
import { getDelayedItemsPageData } from "@/lib/server/solicitacoes"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ItensAtrasadosPage({ searchParams }: { searchParams: SearchParams | Promise<SearchParams> }) {
  const filters = parseDashboardFilters(await Promise.resolve(searchParams), { granularity: "month" })
  const data = getDelayedItemsPageData({ filters })

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Itens Atrasados</h1>
            <p className="text-muted-foreground">Itens com data de necessidade vencida ({data.items.length})</p>
          </div>

          <Link
            href="/itens-vencimento"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <Clock className="w-4 h-4" />
            Próximos do Vencimento
          </Link>
        </div>

        <DashboardFiltersBar initialFilters={filters} options={data.options} />
        <DelayedItemsView items={data.items} />
      </div>
    </main>
  )
}
