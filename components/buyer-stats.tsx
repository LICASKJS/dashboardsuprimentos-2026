import { Card } from "@/components/ui/card"
import { Users, Package, FileText, Building2 } from "lucide-react"
import type { BuyerYearSummary } from "@/lib/types/solicitacoes"

function formatInt(value: number) {
  return value.toLocaleString("pt-BR")
}

export function BuyerStats({ summary }: { summary: BuyerYearSummary }) {
  const period = summary.month ? `${String(summary.month).padStart(2, "0")}/${summary.year}` : String(summary.year)
  const stats = [
    { label: "Solicitações", value: formatInt(summary.totalSolicitacoes), icon: FileText },
    { label: "Itens", value: formatInt(summary.totalItens), icon: Package },
    { label: "Compradores", value: formatInt(summary.totalCompradores), icon: Users },
    { label: "Filiais", value: formatInt(summary.totalFiliais), icon: Building2 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <stat.icon className="w-8 h-8 text-primary" />
            <span className="text-xs text-muted-foreground">{period}</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </Card>
      ))}
    </div>
  )
}
