"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { BuyerYearSummary } from "@/lib/types/solicitacoes"
import { BarChart3, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function monthLabel(m: number) {
  return MONTHS[m - 1] ?? String(m)
}

export function BuyerCharts({ summary }: { summary: BuyerYearSummary }) {
  const itensPorMes = summary.volumeItensPorMes.map((it) => ({ mes: monthLabel(it.mes), itens: it.itens }))
  const solicitacoesPorMes = summary.volumeSolicitacoesPorMes.map((it) => ({
    mes: monthLabel(it.mes),
    solicitacoes: it.solicitacoes,
  }))
  const periodLabel = summary.month ? `${monthLabel(summary.month)}/${summary.year}` : String(summary.year)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Itens por Filial */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Itens por Filial ({periodLabel})</h3>
        </div>
        {summary.itensPorFilial.length ? (
          <ChartContainer config={{ itens: { label: "Itens", color: "#3b82f6" } }} className="h-[300px] w-full">
            <BarChart data={summary.itensPorFilial} margin={{ left: 8, right: 8, bottom: 40 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="filial"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="itens" fill="var(--color-itens)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">Sem dados para o período</p>
          </div>
        )}
      </Card>

      {/* Itens por Comprador */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold">Itens por Comprador ({periodLabel})</h3>
        </div>
        {summary.itensPorComprador.length ? (
          <ChartContainer config={{ itens: { label: "Itens", color: "#f97316" } }} className="h-[300px] w-full">
            <BarChart data={summary.itensPorComprador} margin={{ left: 8, right: 8, bottom: 40 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="comprador"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="itens" fill="var(--color-itens)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">Sem dados para o período</p>
          </div>
        )}
      </Card>

      {/* Solicitações por Comprador */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Solicitações por Comprador ({periodLabel})</h3>
        </div>
        {summary.solicitacoesPorComprador.length ? (
          <ChartContainer
            config={{ solicitacoes: { label: "Solicitações", color: "#3b82f6" } }}
            className="h-[300px] w-full"
          >
            <BarChart data={summary.solicitacoesPorComprador} margin={{ left: 8, right: 8, bottom: 40 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="comprador"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="solicitacoes" fill="var(--color-solicitacoes)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">Sem dados para o período</p>
          </div>
        )}
      </Card>

      {/* Volume de Solicitações */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Volume de Solicitações por Mês ({summary.year})</h3>
        </div>
        <ChartContainer
          config={{ solicitacoes: { label: "Solicitações", color: "#3b82f6" } }}
          className="h-[300px] w-full"
        >
          <BarChart data={solicitacoesPorMes} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="solicitacoes" fill="var(--color-solicitacoes)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Volume de Itens */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Volume de Itens por Mês ({summary.year})</h3>
        </div>
        <ChartContainer config={{ itens: { label: "Itens", color: "#f97316" } }} className="h-[320px] w-full">
          <BarChart data={itensPorMes} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="itens" fill="var(--color-itens)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  )
}
