"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DashboardFilterOptions, DashboardFilters } from "@/lib/filters"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const MONTHS = [
  { value: "", label: "Todos" },
  { value: "1", label: "Jan" },
  { value: "2", label: "Fev" },
  { value: "3", label: "Mar" },
  { value: "4", label: "Abr" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Ago" },
  { value: "9", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
]

function asMonth(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : undefined
}

function asYear(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : undefined
}

export function DashboardFiltersBar({
  initialFilters,
  options,
}: {
  initialFilters: DashboardFilters
  options: DashboardFilterOptions
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = new Date().getFullYear()
  const restrictPastYears = pathname === "/itens-atrasados" || pathname === "/itens-vencimento"
  const minYear = restrictPastYears ? currentYear : 2000
  const minDate = restrictPastYears ? `${currentYear}-01-01` : undefined

  const [date, setDate] = useState(initialFilters.date ?? "")
  const [month, setMonth] = useState(initialFilters.month ? String(initialFilters.month) : "")
  const [year, setYear] = useState(initialFilters.year ? String(initialFilters.year) : "")
  const [comprador, setComprador] = useState(initialFilters.comprador ?? "")
  const [filial, setFilial] = useState(initialFilters.filial ?? "")

  useEffect(() => {
    setDate(initialFilters.date ?? "")
    setMonth(initialFilters.month ? String(initialFilters.month) : "")
    setYear(initialFilters.year ? String(initialFilters.year) : "")
    setComprador(initialFilters.comprador ?? "")
    setFilial(initialFilters.filial ?? "")
  }, [
    pathname,
    initialFilters.date,
    initialFilters.month,
    initialFilters.year,
    initialFilters.comprador,
    initialFilters.filial,
  ])

  const buyersListId = useMemo(() => `buyers-${pathname.replace(/\W/g, "_")}`, [pathname])
  const filiaisListId = useMemo(() => `filiais-${pathname.replace(/\W/g, "_")}`, [pathname])

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString())

    let y = asYear(year)
    const m = asMonth(month)
    if (restrictPastYears) y = Math.max(y ?? currentYear, currentYear)

    const safeDate = minDate && date && date < minDate ? minDate : date
    if (restrictPastYears && y && year !== String(y)) setYear(String(y))
    if (safeDate && safeDate !== date) {
      setDate(safeDate)
      setMonth(String(Number.parseInt(safeDate.slice(5, 7), 10)))
      setYear(safeDate.slice(0, 4))
    }

    if (safeDate) {
      params.set("date", safeDate)
      params.set("year", safeDate.slice(0, 4))
      params.set("month", String(Number.parseInt(safeDate.slice(5, 7), 10)))
    } else {
      params.delete("date")
    }

    if (!safeDate) {
      if (y) params.set("year", String(y))
      else params.delete("year")

      if (m) params.set("month", String(m))
      else params.delete("month")
    }

    if (comprador.trim()) params.set("comprador", comprador.trim())
    else params.delete("comprador")

    if (filial.trim()) params.set("filial", filial.trim())
    else params.delete("filial")

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const clear = () => {
    setDate("")
    setMonth("")
    setYear(restrictPastYears ? String(currentYear) : "")
    setComprador("")
    setFilial("")
    router.push(pathname)
  }

  return (
    <Card className="p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div className="min-w-[180px]">
          <Label htmlFor="filter-date" className="text-xs uppercase tracking-wider mb-2">
            Data
          </Label>
          <Input
            id="filter-date"
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => {
              const v = e.target.value
              setDate(v)
              if (v) {
                setMonth(String(Number.parseInt(v.slice(5, 7), 10)))
                setYear(v.slice(0, 4))
              }
            }}
          />
        </div>

        <div className="min-w-[160px]">
          <Label htmlFor="filter-month" className="text-xs uppercase tracking-wider mb-2">
            Mês
          </Label>
          <select
            id="filter-month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value)
              if (e.target.value) setDate("")
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
          >
            {MONTHS.map((m) => (
              <option key={m.value || "all"} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <Label htmlFor="filter-year" className="text-xs uppercase tracking-wider mb-2">
            Ano
          </Label>
          <Input
            id="filter-year"
            type="number"
            placeholder={String(currentYear)}
            value={year}
            min={minYear}
            onChange={(e) => {
              setYear(e.target.value)
              if (e.target.value && month) setDate("")
            }}
          />
        </div>

        <div className="min-w-[200px]">
          <Label htmlFor="filter-comprador" className="text-xs uppercase tracking-wider mb-2">
            Comprador
          </Label>
          <Input
            id="filter-comprador"
            list={buyersListId}
            placeholder="Todos"
            value={comprador}
            onChange={(e) => setComprador(e.target.value)}
          />
          <datalist id={buyersListId}>
            {options.compradores.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="min-w-[220px]">
          <Label htmlFor="filter-filial" className="text-xs uppercase tracking-wider mb-2">
            Filial
          </Label>
          <Input
            id="filter-filial"
            list={filiaisListId}
            placeholder="Todas"
            value={filial}
            onChange={(e) => setFilial(e.target.value)}
          />
          <datalist id={filiaisListId}>
            {options.filiais.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <div className="flex gap-2">
          <Button onClick={apply}>Aplicar</Button>
          <Button variant="outline" onClick={clear}>
            Limpar
          </Button>
        </div>
      </div>
    </Card>
  )
}
