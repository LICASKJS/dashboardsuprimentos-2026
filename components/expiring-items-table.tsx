"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SolicitacaoItemWithSla } from "@/lib/types/solicitacoes"

function formatDate(iso?: string) {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return "-"
  return d.toLocaleDateString("pt-BR")
}

function includesSearch(item: SolicitacaoItemWithSla, search: string) {
  if (!search) return true
  const haystack = [
    item.codigoSolicitacao,
    item.codigoItem,
    item.codigoCotacao,
    item.descricaoItem,
    item.nomeFilial,
    item.filial,
    item.usuarioSolicitante,
    item.nomeComprador,
    item.statusNecessidade,
    item.situacaoItem,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(search)
}

export function ExpiringItemsTable({ items, search }: { items: SolicitacaoItemWithSla[]; search: string }) {
  const q = search.trim().toLowerCase()
  const [page, setPage] = useState(1)
  const pageSize = 50

  useEffect(() => {
    setPage(1)
  }, [q])

  const filtered = useMemo(() => {
    return q ? items.filter((item) => includesSearch(item, q)) : items
  }, [items, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const pageItems = filtered.slice(pageStart, pageStart + pageSize)

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Data Emissão</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Data Necessidade</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Dias Restantes</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Solicitação</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Cotação</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Descrição</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Filial</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Solicitante</th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider">Comprador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageItems.map((item) => (
              <tr
                key={`${item.codigoSolicitacao ?? "sol"}-${item.sequencialItem ?? "item"}-${item.codigoItem ?? "cod"}`}
                className="hover:bg-secondary/50 transition-colors"
              >
                <td className="p-4 text-sm">{formatDate(item.dataEmissao)}</td>
                <td className="p-4 text-sm">{formatDate(item.dataNecessidade)}</td>
                <td className="p-4">
                  <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                    {item.dias} dias
                  </Badge>
                </td>
                <td className="p-4 text-sm">{item.statusNecessidade ?? "-"}</td>
                <td className="p-4 text-sm font-medium">{item.codigoSolicitacao ?? "-"}</td>
                <td className="p-4 text-sm">{item.codigoCotacao ?? "-"}</td>
                <td className="p-4 text-sm">{item.descricaoItem ?? "-"}</td>
                <td className="p-4 text-sm">{item.nomeFilial ?? item.filial ?? "-"}</td>
                <td className="p-4 text-sm">{item.usuarioSolicitante ?? "-"}</td>
                <td className="p-4 text-sm">{item.nomeComprador ?? "-"}</td>
              </tr>
            ))}
            {!pageItems.length && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!!filtered.length && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-border bg-secondary/10">
          <div className="text-sm text-muted-foreground">
            {filtered.length.toLocaleString("pt-BR")} itens • Página {safePage.toLocaleString("pt-BR")} de{" "}
            {totalPages.toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
