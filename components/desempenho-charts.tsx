"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { DesempenhoPageData } from "@/lib/types/desempenho"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { BarChart3, Trophy } from "lucide-react"

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  }).format(value)
}

export function DesempenhoCharts({ data }: { data: DesempenhoPageData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lead times por comprador */}
      <Card className="p-6 lg:col-span-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Lead Time de Compra, Aprovação e Mapa por Comprador</h3>
        </div>
        <ChartContainer
          config={{
            ltComprasDias: { label: "L.T Compra", color: "#3b82f6" },
            ltAprovPcDias: { label: "L.T Aprovação", color: "#1d4ed8" },
            ltMapaDias: { label: "L.T Mapa", color: "#f97316" },
          }}
          className="h-[360px] w-full"
        >
          <BarChart data={data.leadTimesPorComprador} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis dataKey="comprador" type="category" tickLine={false} axisLine={false} width={120} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="ltComprasDias" stackId="a" fill="var(--color-ltComprasDias)" radius={[4, 0, 0, 4]} />
            <Bar dataKey="ltAprovPcDias" stackId="a" fill="var(--color-ltAprovPcDias)" />
            <Bar dataKey="ltMapaDias" stackId="a" fill="var(--color-ltMapaDias)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Valor total por comprador */}
      <Card className="p-6 lg:col-span-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">Valor total por Comprador</h3>
        </div>
        <ChartContainer config={{ valor: { label: "Valor", color: "#22c55e" } }} className="h-[360px] w-full">
          <BarChart data={data.valorPorComprador} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis dataKey="comprador" type="category" tickLine={false} axisLine={false} width={120} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="text-foreground font-mono font-medium tabular-nums">
                      {formatCurrencyCompact(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Número de PC por comprador */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Número de PC por Comprador</h3>
        </div>
        <ChartContainer config={{ pcs: { label: "PCs", color: "#3b82f6" } }} className="h-[300px] w-full">
          <BarChart data={data.pcsPorComprador} margin={{ left: 8, right: 8, bottom: 40 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="comprador" tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="pcs" fill="var(--color-pcs)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* QTD de itens por comprador */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">QTD de Itens Comprados por Comprador</h3>
        </div>
        <ChartContainer config={{ itens: { label: "Itens", color: "#a855f7" } }} className="h-[300px] w-full">
          <BarChart data={data.itensPorComprador} margin={{ left: 8, right: 8, bottom: 40 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="comprador" tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="itens" fill="var(--color-itens)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  )
}

