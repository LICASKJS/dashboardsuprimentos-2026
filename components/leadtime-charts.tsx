"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { LeadTimeSummary } from "@/lib/types/export-suprimentos"
import { Clock, DollarSign, FileText, Package, GitCommit } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function monthLabel(m: number) {
  return MONTHS[m - 1] ?? String(m)
}

export function LeadTimeCharts({ summary }: { summary: LeadTimeSummary }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Lead Time de Compra */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Lead Time de Compra por Comprador ({summary.year})</h3>
        </div>
        <ChartContainer
          config={{ leadTimeMedioDias: { label: "Dias", color: "#f97316" } }}
          className="h-[300px] w-full"
        >
          <BarChart data={summary.leadTimePorComprador} margin={{ left: 8, right: 8, bottom: 40 }}>
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
            <Bar dataKey="leadTimeMedioDias" fill="var(--color-leadTimeMedioDias)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Valor Total Gasto */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-500/10">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">
            Valor Total Gasto por Comprador (Mês {monthLabel(summary.month)}/{summary.year})
          </h3>
        </div>
        <ChartContainer config={{ valor: { label: "Valor", color: "#22c55e" } }} className="h-[300px] w-full">
          <BarChart data={summary.gastoPorCompradorMes} margin={{ left: 8, right: 8, bottom: 40 }}>
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
            <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Número de PC Emitido */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold">
              PCs Emitidos (Mês {monthLabel(summary.month)}/{summary.year})
            </h3>
          </div>
          <div className="h-[280px] flex items-center justify-center bg-secondary/30 rounded-lg">
            <div className="text-center">
              <div className="text-5xl font-bold">{summary.pcsEmitidosMes.toLocaleString("pt-BR")}</div>
              <p className="text-sm text-muted-foreground mt-2">Pedidos de compra emitidos</p>
            </div>
          </div>
        </Card>

        {/* Quantidade de Itens */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold">Quantidade de Itens por Comprador ({summary.year})</h3>
          </div>
          <ChartContainer config={{ itens: { label: "Itens", color: "#a855f7" } }} className="h-[280px] w-full">
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
        </Card>
      </div>

      {/* Aprovações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <GitCommit className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold">Mapas em Aprovação ({summary.year})</h3>
          </div>
          <ChartContainer config={{ mapas: { label: "Mapas", color: "#eab308" } }} className="h-[280px] w-full">
            <BarChart data={summary.mapasEmAprovacao} margin={{ left: 8, right: 8, bottom: 40 }}>
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
              <Bar dataKey="mapas" fill="var(--color-mapas)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold">PCs em Aprovação ({summary.year})</h3>
          </div>
          <ChartContainer config={{ pcs: { label: "PCs", color: "#ef4444" } }} className="h-[280px] w-full">
            <BarChart data={summary.pcsEmAprovacao} margin={{ left: 8, right: 8, bottom: 40 }}>
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
              <Bar dataKey="pcs" fill="var(--color-pcs)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>
    </div>
  )
}

