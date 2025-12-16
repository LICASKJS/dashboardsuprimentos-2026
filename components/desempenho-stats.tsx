"use client"

import { Card } from "@/components/ui/card"
import { DollarSign, PackageCheck, BadgeCheck, Repeat2, Clock, FileSpreadsheet, FileText } from "lucide-react"
import type { DesempenhoKpis } from "@/lib/types/desempenho"

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 2 }).format(
    value,
  )
}

function formatCompactBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDays(value: number) {
  return value ? `${value.toFixed(0)} d` : "0 d"
}

export function DesempenhoStats({ kpis }: { kpis: DesempenhoKpis }) {
  const cards = [
    { label: "Valor Total", value: formatCompactBRL(kpis.valorTotal), icon: DollarSign },
    { label: "Itens Atendidos", value: formatCompactNumber(kpis.itensAtendidos), icon: PackageCheck },
    { label: "Solic. Atendidas", value: formatCompactNumber(kpis.solicitacoesAtendidas), icon: BadgeCheck },
    { label: "Revisões", value: formatCompactNumber(kpis.revisoes), icon: Repeat2 },
    { label: "L.T Compras", value: formatDays(kpis.ltComprasDias), icon: Clock },
    { label: "L.T Mapa", value: formatDays(kpis.ltMapaDias), icon: FileSpreadsheet },
    { label: "L.T AP PC", value: formatDays(kpis.ltAprovPcDias), icon: FileText },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-start justify-between">
            <c.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-3">{c.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
        </Card>
      ))}
    </div>
  )
}

