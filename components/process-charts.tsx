"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ProcessosSummary } from "@/lib/types/export-suprimentos"
import { Trophy, Package, Truck, FileText, CreditCard } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

const PIE_COLORS = ["#f97316", "#ef4444", "#3b82f6", "#a855f7", "#22c55e", "#14b8a6", "#eab308", "#f43f5e"]

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProcessCharts({ summary }: { summary: ProcessosSummary }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 10 Fornecedores */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">Top 10 Fornecedores (Valor)</h3>
        </div>
        <ChartContainer config={{ valor: { label: "Valor", color: "#eab308" } }} className="h-[280px] w-full">
          <BarChart data={summary.topFornecedoresValor} margin={{ left: 8, right: 8, bottom: 60 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="fornecedor"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={80}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="text-foreground font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                  )}
                />
              }
            />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Valores por Itens */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Valores de Compra por Itens</h3>
        </div>
        <ChartContainer config={{ valor: { label: "Valor", color: "#f97316" } }} className="h-[280px] w-full">
          <BarChart data={summary.topItensValor} margin={{ left: 8, right: 8, bottom: 60 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="item" tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={80} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="text-foreground font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                  )}
                />
              }
            />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Tipo de Frete */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Truck className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Tipo de Frete (FOB/CIF/EXW)</h3>
        </div>
        <ChartContainer config={{ quantidade: { label: "Quantidade", color: "#3b82f6" } }} className="h-[280px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={summary.tipoFrete} dataKey="quantidade" nameKey="tipo" innerRadius={55} outerRadius={90}>
              {summary.tipoFrete.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </Card>

      {/* Demandas por Item */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Top 10 Demandas por Item</h3>
        </div>
        <ChartContainer config={{ quantidade: { label: "Quantidade", color: "#f97316" } }} className="h-[280px] w-full">
          <BarChart data={summary.demandasPorItem} margin={{ left: 8, right: 8, bottom: 60 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="item" tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={80} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      {/* Condição de Pagamento */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Compras por Condição de Pagamento</h3>
        </div>
        <ChartContainer config={{ quantidade: { label: "Quantidade", color: "#f97316" } }} className="h-[280px] w-full">
          <BarChart data={summary.condicaoPagamento} margin={{ left: 8, right: 8, bottom: 60 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="condicao"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={80}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  )
}
