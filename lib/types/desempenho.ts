import type { DashboardFilterOptions, DashboardFilters } from "@/lib/filters"

export type DesempenhoKpis = {
  valorTotal: number
  itensAtendidos: number
  solicitacoesAtendidas: number
  revisoes: number
  ltComprasDias: number
  ltMapaDias: number
  ltAprovPcDias: number
}

export type LeadTimesPorComprador = {
  comprador: string
  ltComprasDias: number
  ltAprovPcDias: number
  ltMapaDias: number
  totalDias: number
}

export type DesempenhoPageData = {
  filters: DashboardFilters
  options: DashboardFilterOptions
  kpis: DesempenhoKpis
  leadTimesPorComprador: LeadTimesPorComprador[]
  valorPorComprador: { comprador: string; valor: number }[]
  pcsPorComprador: { comprador: string; pcs: number }[]
  itensPorComprador: { comprador: string; itens: number }[]
}

