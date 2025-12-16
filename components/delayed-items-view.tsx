"use client"

import { useState } from "react"
import type { SolicitacaoItemWithSla } from "@/lib/types/solicitacoes"
import { DelayedItemsFilters } from "@/components/delayed-items-filters"
import { DelayedItemsTable } from "@/components/delayed-items-table"

export function DelayedItemsView({ items }: { items: SolicitacaoItemWithSla[] }) {
  const [search, setSearch] = useState("")

  return (
    <>
      <DelayedItemsFilters value={search} onChange={setSearch} />
      <DelayedItemsTable items={items} search={search} />
    </>
  )
}

