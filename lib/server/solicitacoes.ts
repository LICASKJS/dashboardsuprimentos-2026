import "server-only"

import { differenceInCalendarDays, startOfDay } from "date-fns"
import { BUYER_BLANK_LABEL, normalizeBuyerLabel, shouldExcludeBuyer } from "@/lib/buyers"
import type { BuyerYearSummary, SolicitacaoItem, SolicitacaoItemWithSla } from "@/lib/types/solicitacoes"
import type { DashboardFilters } from "@/lib/filters"
import { matchesPeriod, matchesText } from "@/lib/filters"
import {
  asDate,
  asNonEmptyString,
  asNumber,
  ExcelTable,
  getCell,
  getFileMtimeMs,
  getIndex,
  isReasonableYear,
  readExcelTable,
  resolveDataPath,
} from "@/lib/server/excel"

type SolicitacoesCache = {
  mtimeMs: number
  table: ExcelTable
}

let cache: SolicitacoesCache | undefined

function loadSolicitacoesTable() {
  const filePath = resolveDataPath("dados/FW_Solicitacoes.xlsx")
  const mtimeMs = getFileMtimeMs(filePath)
  if (cache?.mtimeMs === mtimeMs) return cache.table

  const table = readExcelTable(filePath, "Gd_Edicao")
  cache = { mtimeMs, table }
  return table
}

function normalizeRow(row: unknown[], table: ExcelTable): SolicitacaoItem {
  const first = (key: string) => getCell(row, getIndex(table.index, key, "first"))
  const last = (key: string) => getCell(row, getIndex(table.index, key, "last"))

  const dataAlteracao = asDate(first("Data de alteração"))
  const dataEmissao = asDate(first("Data de emissão"))
  const dataInclusao = asDate(first("Data de inclusão"))
  const dataNecessidade = asDate(first("Data de necessidade"))

  return {
    situacaoItem: asNonEmptyString(first("Situação do Item")),
    statusNecessidade: asNonEmptyString(first("Status da necessidade")),
    codigoSolicitacao: asNonEmptyString(first("Código da solicitação")),
    sequencialItem: asNumber(first("Sequencial do item")),
    codigoItem: asNonEmptyString(first("Código do item")),
    descricaoItem: asNonEmptyString(first("Descrição do item")),
    especificacao: asNonEmptyString(first("Especificação")),
    motivo: asNonEmptyString(first("Motivo")),
    quantidadeSolicitada: asNumber(first("Quantidade solicitada")),
    codigoCotacao: asNonEmptyString(first("Código da cotação") ?? last("Código da cotação")),
    usuarioAlteracao: asNonEmptyString(first("Usuário de alteração")),
    dataAlteracao: dataAlteracao && isReasonableYear(dataAlteracao) ? dataAlteracao.toISOString() : undefined,
    dataEmissao: dataEmissao && isReasonableYear(dataEmissao) ? dataEmissao.toISOString() : undefined,
    dataInclusao: dataInclusao && isReasonableYear(dataInclusao) ? dataInclusao.toISOString() : undefined,
    dataNecessidade: dataNecessidade && isReasonableYear(dataNecessidade) ? dataNecessidade.toISOString() : undefined,
    unidade: asNonEmptyString(first("Unidade")),
    usuarioSolicitante: asNonEmptyString(first("Usuário solicitante")),
    nomeComprador: normalizeBuyerLabel(asNonEmptyString(first("Nome do comprador"))),
    codigoContrato: asNonEmptyString(first("Código do contrato")),
    filial: asNonEmptyString(first("Filial")),
    nomeFilial: asNonEmptyString(first("Nome Filial")),
  }
}

function isOpenItem(situacaoItem?: string) {
  if (!situacaoItem) return true
  const normalized = situacaoItem.trim().toLowerCase()
  return normalized !== "baixado" && normalized !== "cancelado"
}

function pushOption(set: Set<string>, value: string | undefined) {
  const v = value?.trim()
  if (!v) return
  set.add(v)
}

function normalizeFilialLabel(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const match = trimmed.match(/\(([^)]+)\)/)
  let label = (match?.[1] ?? trimmed).trim()
  label = label.replace(/^ENGEMAN\s*/i, "").trim()
  label = label.replace(/\s+/g, " ").trim()

  label = label.replace(/\s*-\s*[A-Z]{2}\s*$/i, "").trim()
  label = label.replace(/\s+[A-Z]{2}\s*$/i, "").trim()

  const upper = label.toUpperCase()
  if (upper.includes("MONTES CLAROS")) return undefined
  if (upper === "PARACURU") return "FILIAL RNCE"
  return `FILIAL ${upper}`
}

function matchesFilial(label: string | undefined, raw: string | undefined, filter: string | undefined) {
  if (!filter) return true
  const f = filter.trim().toLowerCase()
  if (!f) return true

  const normalizedLabel = (label ?? "").trim().toLowerCase()
  if (normalizedLabel === f) return true

  const normalizedRaw = (raw ?? "").trim().toLowerCase()
  return normalizedRaw.includes(f)
}

function isCotacaoStatus(status?: string) {
  const normalized = status?.trim().toLowerCase()
  if (!normalized) return false
  if (normalized === "a cotar") return true
  return normalized.startsWith("em cot")
}

export function getSolicitacoesDashboardCounts({
  now = new Date(),
  windowDays = 7,
}: {
  now?: Date
  windowDays?: number
} = {}) {
  const table = loadSolicitacoesTable()
  const iNeed = getIndex(table.index, "Data de necessidade", "first")
  const iSituacao = getIndex(table.index, "Situação do Item", "first")

  const targetYear = now.getFullYear()
  const targetMonth = now.getMonth() + 1
  const today = startOfDay(now)
  let itensEmAberto = 0
  let itensAtrasados = 0
  let itensProximos = 0

  for (const row of table.rows) {
    const situacao = asNonEmptyString(getCell(row, iSituacao))
    if (!isOpenItem(situacao)) continue

    const need = asDate(getCell(row, iNeed))
    if (!need || !isReasonableYear(need)) continue
    if (need.getUTCFullYear() !== targetYear || need.getUTCMonth() + 1 !== targetMonth) continue

    itensEmAberto += 1

    const diasAtraso = differenceInCalendarDays(today, startOfDay(need))
    if (diasAtraso > 0) {
      itensAtrasados += 1
      continue
    }

    const diasRestantes = -diasAtraso
    if (diasRestantes >= 0 && diasRestantes <= windowDays) itensProximos += 1
  }

  return { itensEmAberto, itensAtrasados, itensProximos }
}

export function getDelayedItemsPageData({
  filters,
  now = new Date(),
  limit,
}: {
  filters: DashboardFilters
  now?: Date
  limit?: number
}) {
  const table = loadSolicitacoesTable()
  const iNeed = getIndex(table.index, "Data de necessidade", "first")
  const iSituacao = getIndex(table.index, "Situação do Item", "first")
  const iStatus = getIndex(table.index, "Status da necessidade", "first")
  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iNomeFilial = getIndex(table.index, "Nome Filial", "first")
  const iFilial = getIndex(table.index, "Filial", "first")

  const optionsCompradores = new Set<string>()
  const optionsFiliais = new Set<string>()

  const minYear = now.getFullYear()
  const today = startOfDay(now)
  const results: SolicitacaoItemWithSla[] = []

  for (const row of table.rows) {
    const situacao = asNonEmptyString(getCell(row, iSituacao))
    if (!isOpenItem(situacao)) continue

    const need = asDate(getCell(row, iNeed))
    if (!need || !isReasonableYear(need)) continue
    if (need.getUTCFullYear() < minYear) continue
    if (!matchesPeriod(need, filters)) continue

    const status = asNonEmptyString(getCell(row, iStatus))
    if (!isCotacaoStatus(status)) continue

    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)
    const rawFilial = asNonEmptyString(getCell(row, iNomeFilial) ?? getCell(row, iFilial))
    const filial = rawFilial ? normalizeFilialLabel(rawFilial) : "Sem filial"
    if (!filial) continue
    pushOption(optionsCompradores, comprador)
    pushOption(optionsFiliais, filial)

    if (!matchesText(comprador, filters.comprador) || !matchesFilial(filial, rawFilial, filters.filial)) continue

    const diasAtraso = differenceInCalendarDays(today, startOfDay(need))
    if (diasAtraso <= 0) continue

    results.push({ ...normalizeRow(row, table), dias: diasAtraso })
    if (typeof limit === "number" && results.length >= limit) break
  }

  results.sort((a, b) => b.dias - a.dias)
  return {
    filters,
    options: { compradores: [...optionsCompradores].sort(), filiais: [...optionsFiliais].sort() },
    items: results,
  }
}

export function getExpiringItemsPageData({
  filters,
  now = new Date(),
  windowDays = 7,
  limit,
}: {
  filters: DashboardFilters
  now?: Date
  windowDays?: number
  limit?: number
}) {
  const table = loadSolicitacoesTable()
  const iNeed = getIndex(table.index, "Data de necessidade", "first")
  const iSituacao = getIndex(table.index, "Situação do Item", "first")
  const iStatus = getIndex(table.index, "Status da necessidade", "first")
  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iNomeFilial = getIndex(table.index, "Nome Filial", "first")
  const iFilial = getIndex(table.index, "Filial", "first")

  const optionsCompradores = new Set<string>()
  const optionsFiliais = new Set<string>()

  const minYear = now.getFullYear()
  const today = startOfDay(now)
  const results: SolicitacaoItemWithSla[] = []

  for (const row of table.rows) {
    const situacao = asNonEmptyString(getCell(row, iSituacao))
    if (!isOpenItem(situacao)) continue

    const need = asDate(getCell(row, iNeed))
    if (!need || !isReasonableYear(need)) continue
    if (need.getUTCFullYear() < minYear) continue
    if (!matchesPeriod(need, filters)) continue

    const status = asNonEmptyString(getCell(row, iStatus))
    if (!isCotacaoStatus(status)) continue

    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)
    const rawFilial = asNonEmptyString(getCell(row, iNomeFilial) ?? getCell(row, iFilial))
    const filial = rawFilial ? normalizeFilialLabel(rawFilial) : "Sem filial"
    if (!filial) continue
    pushOption(optionsCompradores, comprador)
    pushOption(optionsFiliais, filial)

    if (!matchesText(comprador, filters.comprador) || !matchesFilial(filial, rawFilial, filters.filial)) continue

    const diasRestantes = differenceInCalendarDays(startOfDay(need), today)
    if (diasRestantes < 0 || diasRestantes > windowDays) continue

    results.push({ ...normalizeRow(row, table), dias: diasRestantes })
    if (typeof limit === "number" && results.length >= limit) break
  }

  results.sort((a, b) => a.dias - b.dias)
  return {
    filters,
    options: { compradores: [...optionsCompradores].sort(), filiais: [...optionsFiliais].sort() },
    items: results,
  }
}

export function getDelayedSolicitacaoItems({
  now = new Date(),
  limit,
}: {
  now?: Date
  limit?: number
} = {}): SolicitacaoItemWithSla[] {
  const table = loadSolicitacoesTable()
  const iNeed = getIndex(table.index, "Data de necessidade", "first")
  const iSituacao = getIndex(table.index, "Situação do Item", "first")

  const minYear = now.getFullYear()
  const today = startOfDay(now)
  const results: SolicitacaoItemWithSla[] = []

  for (const row of table.rows) {
    const situacao = asNonEmptyString(getCell(row, iSituacao))
    if (!isOpenItem(situacao)) continue

    const need = asDate(getCell(row, iNeed))
    if (!need || !isReasonableYear(need)) continue
    if (need.getUTCFullYear() < minYear) continue

    const diasAtraso = differenceInCalendarDays(today, startOfDay(need))
    if (diasAtraso <= 0) continue

    results.push({ ...normalizeRow(row, table), dias: diasAtraso })
    if (typeof limit === "number" && results.length >= limit) break
  }

  results.sort((a, b) => b.dias - a.dias)
  return results
}

export function getExpiringSolicitacaoItems({
  now = new Date(),
  windowDays = 7,
  limit,
}: {
  now?: Date
  windowDays?: number
  limit?: number
} = {}): SolicitacaoItemWithSla[] {
  const table = loadSolicitacoesTable()
  const iNeed = getIndex(table.index, "Data de necessidade", "first")
  const iSituacao = getIndex(table.index, "Situação do Item", "first")

  const minYear = now.getFullYear()
  const today = startOfDay(now)
  const results: SolicitacaoItemWithSla[] = []

  for (const row of table.rows) {
    const situacao = asNonEmptyString(getCell(row, iSituacao))
    if (!isOpenItem(situacao)) continue

    const need = asDate(getCell(row, iNeed))
    if (!need || !isReasonableYear(need)) continue
    if (need.getUTCFullYear() < minYear) continue

    const diasRestantes = differenceInCalendarDays(startOfDay(need), today)
    if (diasRestantes < 0 || diasRestantes > windowDays) continue

    results.push({ ...normalizeRow(row, table), dias: diasRestantes })
    if (typeof limit === "number" && results.length >= limit) break
  }

  results.sort((a, b) => a.dias - b.dias)
  return results
}

export function getBuyerYearSummary({
  year = new Date().getFullYear(),
  month,
  top = 30,
}: { year?: number; month?: number; top?: number } = {}) {
  const table = loadSolicitacoesTable()
  const iEmissao = getIndex(table.index, "Data de emissão", "first")
  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iSolicitacao = getIndex(table.index, "Código da solicitação", "first")
  const iNomeFilial = getIndex(table.index, "Nome Filial", "first")
  const iFilial = getIndex(table.index, "Filial", "first")

  const itensPorComprador = new Map<string, number>()
  const solicitacoesPorComprador = new Map<string, Set<string>>()
  const itensPorFilial = new Map<string, number>()
  const itensPorMes = new Map<number, number>()
  const solicitacoesPorMes = new Map<number, Set<string>>()
  const solicitacoesAno = new Set<string>()

  for (const row of table.rows) {
    const emissao = asDate(getCell(row, iEmissao))
    if (!emissao || !isReasonableYear(emissao)) continue
    if (emissao.getUTCFullYear() !== year) continue
    if (typeof month === "number" && month >= 1 && month <= 12 && emissao.getUTCMonth() + 1 !== month) continue

    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)
    itensPorComprador.set(comprador, (itensPorComprador.get(comprador) ?? 0) + 1)

    const codSol = asNonEmptyString(getCell(row, iSolicitacao))
    if (codSol) {
      if (!solicitacoesPorComprador.has(comprador)) solicitacoesPorComprador.set(comprador, new Set())
      solicitacoesPorComprador.get(comprador)!.add(codSol)
      solicitacoesAno.add(codSol)
    }

    const rawFilial = asNonEmptyString(getCell(row, iNomeFilial) ?? getCell(row, iFilial))
    const filial = rawFilial ? normalizeFilialLabel(rawFilial) : "Sem filial"
    if (filial) itensPorFilial.set(filial, (itensPorFilial.get(filial) ?? 0) + 1)

    const m = emissao.getUTCMonth() + 1
    itensPorMes.set(m, (itensPorMes.get(m) ?? 0) + 1)
    if (codSol) {
      if (!solicitacoesPorMes.has(m)) solicitacoesPorMes.set(m, new Set())
      solicitacoesPorMes.get(m)!.add(codSol)
    }
  }

  const itens = [...itensPorComprador.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([comprador, count]) => ({ comprador, itens: count }))

  const solicitacoes = [...solicitacoesPorComprador.entries()]
    .map(([comprador, set]) => ({ comprador, solicitacoes: set.size }))
    .sort((a, b) => b.solicitacoes - a.solicitacoes)
    .slice(0, top)

  const filial = [...itensPorFilial.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([filial, itens]) => ({ filial, itens }))

  const volumeItensPorMes = Array.from({ length: 12 }, (_, idx) => ({
    mes: idx + 1,
    itens: itensPorMes.get(idx + 1) ?? 0,
  }))
  const volumeSolicitacoesPorMes = Array.from({ length: 12 }, (_, idx) => ({
    mes: idx + 1,
    solicitacoes: solicitacoesPorMes.get(idx + 1)?.size ?? 0,
  }))

  const totalItens = volumeItensPorMes.reduce((acc, it) => acc + it.itens, 0)
  const totalSolicitacoes = solicitacoesAno.size
  const totalCompradores = itensPorComprador.size
  const totalFiliais = itensPorFilial.size

  const summary: BuyerYearSummary = {
    year,
    month,
    totalItens,
    totalSolicitacoes,
    totalCompradores,
    totalFiliais,
    itensPorFilial: filial,
    itensPorComprador: itens,
    solicitacoesPorComprador: solicitacoes,
    volumeItensPorMes,
    volumeSolicitacoesPorMes,
  }
  return summary
}

export function getCompradoresPageData(
  filters: DashboardFilters,
  { top = 30 }: { top?: number } = {},
): { filters: DashboardFilters; options: import("@/lib/filters").DashboardFilterOptions; summary: BuyerYearSummary } {
  const table = loadSolicitacoesTable()
  const iEmissao = getIndex(table.index, "Data de emissão", "first")
  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iSolicitacao = getIndex(table.index, "Código da solicitação", "first")
  const iStatus = getIndex(table.index, "Status da necessidade", "first")
  const iSituacao = getIndex(table.index, "Situação do Item", "first")
  const iNomeFilial = getIndex(table.index, "Nome Filial", "first")
  const iFilial = getIndex(table.index, "Filial", "first")

  const optionsCompradores = new Set<string>()
  const optionsFiliais = new Set<string>()

  const itensPorComprador = new Map<string, number>()
  const solicitacoesPorComprador = new Map<string, Set<string>>()
  const filiaisTotal = new Set<string>()
  const itensPorFilial = new Map<string, number>()
  const volumeItensPorMes = new Map<number, number>()
  const volumeSolicitacoesPorMes = new Map<number, Set<string>>()
  const solicitacoesTotal = new Set<string>()

  const now = new Date()
  const year = filters.year ?? now.getFullYear()
  const month = filters.month ?? now.getMonth() + 1
  const periodFilters: DashboardFilters = { ...filters, year, month }

  for (const row of table.rows) {
    const emissao = asDate(getCell(row, iEmissao))
    if (!emissao || !isReasonableYear(emissao)) continue

    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)
    const rawFilial = asNonEmptyString(getCell(row, iNomeFilial) ?? getCell(row, iFilial))
    const filial = rawFilial ? normalizeFilialLabel(rawFilial) : "Sem filial"
    if (rawFilial && !filial) continue

    const codSol = asNonEmptyString(getCell(row, iSolicitacao))
    const status = asNonEmptyString(getCell(row, iStatus))
    const situacao = asNonEmptyString(getCell(row, iSituacao))

    if (matchesText(comprador, filters.comprador) && matchesFilial(filial, rawFilial, filters.filial)) {
      if (matchesPeriod(emissao, { year })) {
        const m = emissao.getUTCMonth() + 1
        volumeItensPorMes.set(m, (volumeItensPorMes.get(m) ?? 0) + 1)
        if (codSol) {
          if (!volumeSolicitacoesPorMes.has(m)) volumeSolicitacoesPorMes.set(m, new Set())
          volumeSolicitacoesPorMes.get(m)!.add(codSol)
        }
      }
    }

    if (!matchesPeriod(emissao, periodFilters)) continue
    if (!isOpenItem(situacao)) continue
    if (status?.trim().toLowerCase() === "pedido") continue

    pushOption(optionsCompradores, comprador)
    pushOption(optionsFiliais, filial)

    if (!matchesText(comprador, filters.comprador) || !matchesFilial(filial, rawFilial, filters.filial)) continue

    itensPorComprador.set(comprador, (itensPorComprador.get(comprador) ?? 0) + 1)
    if (filial) filiaisTotal.add(filial)
    if (filial && (comprador === BUYER_BLANK_LABEL || isCotacaoStatus(status))) {
      itensPorFilial.set(filial, (itensPorFilial.get(filial) ?? 0) + 1)
    }

    if (codSol) {
      solicitacoesTotal.add(codSol)
      if (!solicitacoesPorComprador.has(comprador)) solicitacoesPorComprador.set(comprador, new Set())
      solicitacoesPorComprador.get(comprador)!.add(codSol)
    }
  }

  const itens = [...itensPorComprador.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([comprador, count]) => ({ comprador, itens: count }))

  const solicitacoes = [...solicitacoesPorComprador.entries()]
    .map(([comprador, set]) => ({ comprador, solicitacoes: set.size }))
    .sort((a, b) => b.solicitacoes - a.solicitacoes)
    .slice(0, top)

  const filiais = [...itensPorFilial.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([filial, itens]) => ({ filial, itens }))

  const volumeItensPorMesSeries = Array.from({ length: 12 }, (_, idx) => ({
    mes: idx + 1,
    itens: volumeItensPorMes.get(idx + 1) ?? 0,
  }))
  const volumeSolicitacoesPorMesSeries = Array.from({ length: 12 }, (_, idx) => ({
    mes: idx + 1,
    solicitacoes: volumeSolicitacoesPorMes.get(idx + 1)?.size ?? 0,
  }))

  const totalItens = [...itensPorComprador.values()].reduce((acc, value) => acc + value, 0)
  const totalSolicitacoes = solicitacoesTotal.size
  const totalCompradores = itensPorComprador.size
  const totalFiliais = filiaisTotal.size

  const summary: BuyerYearSummary = {
    year,
    month: periodFilters.month,
    totalItens,
    totalSolicitacoes,
    totalCompradores,
    totalFiliais,
    itensPorFilial: filiais,
    itensPorComprador: itens,
    solicitacoesPorComprador: solicitacoes,
    volumeItensPorMes: volumeItensPorMesSeries,
    volumeSolicitacoesPorMes: volumeSolicitacoesPorMesSeries,
  }

  return {
    filters: periodFilters,
    options: { compradores: [...optionsCompradores].sort(), filiais: [...optionsFiliais].sort() },
    summary,
  }
}
