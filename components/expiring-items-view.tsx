"use client"

import { useState } from "react"
import type { SolicitacaoItemWithSla } from "@/lib/types/solicitacoes"
import { ExpiringItemsFilters } from "@/components/expiring-items-filters"
import { ExpiringItemsTable } from "@/components/expiring-items-table"

export function ExpiringItemsView({ items }: { items: SolicitacaoItemWithSla[] }) {
  const [search, setSearch] = useState("")

  return (
    <>
      <ExpiringItemsFilters value={search} onChange={setSearch} />
      <ExpiringItemsTable items={items} search={search} />
    </>
  )
}

