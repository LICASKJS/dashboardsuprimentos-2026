export type DashboardFilters = {
  date?: string
  month?: number
  year?: number
  comprador?: string
  filial?: string
}

export type DashboardFilterOptions = {
  compradores: string[]
  filiais: string[]
}

export type SearchParams = Record<string, string | string[] | undefined>

export type DefaultGranularity = "none" | "year" | "month"

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

function asInt(value: string | undefined) {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function asDateKey(value: string | undefined) {
  if (!value) return undefined
  const v = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
  return v
}

export function parseDashboardFilters(
  searchParams: SearchParams,
  {
    now = new Date(),
    granularity = "none",
  }: {
    now?: Date
    granularity?: DefaultGranularity
  } = {},
): DashboardFilters {
  const rawDate = asDateKey(first(searchParams.date))
  const month = asInt(first(searchParams.month))
  const year = asInt(first(searchParams.year))

  const comprador = first(searchParams.comprador)?.trim() || undefined
  const filial = first(searchParams.filial)?.trim() || undefined

  const normalized: DashboardFilters = {
    date: rawDate,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    year: year && year >= 2000 && year <= 2100 ? year : undefined,
    comprador,
    filial,
  }

  if (!normalized.date) {
    if (granularity === "month" && (!normalized.month || !normalized.year)) {
      normalized.month = normalized.month ?? now.getMonth() + 1
      normalized.year = normalized.year ?? now.getFullYear()
    }
    if (granularity === "year" && !normalized.year) {
      normalized.year = now.getFullYear()
    }
  }

  if (normalized.date) {
    const y = asInt(normalized.date.slice(0, 4))
    const m = asInt(normalized.date.slice(5, 7))
    if (y && !normalized.year) normalized.year = y
    if (m && !normalized.month) normalized.month = m
  }

  return normalized
}

export function toDateKeyUTC(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function matchesPeriod(date: Date | undefined, filters: DashboardFilters) {
  if (!date) return false
  if (filters.date) return toDateKeyUTC(date) === filters.date
  if (filters.year && filters.month) return date.getUTCFullYear() === filters.year && date.getUTCMonth() + 1 === filters.month
  if (filters.year) return date.getUTCFullYear() === filters.year
  return true
}

export function matchesText(value: string | undefined, filter: string | undefined) {
  if (!filter) return true
  const f = filter.trim().toLowerCase()
  if (!f) return true
  const v = (value ?? "").trim().toLowerCase()
  return v.includes(f)
}

