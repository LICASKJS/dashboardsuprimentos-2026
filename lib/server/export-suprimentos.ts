import "server-only"

import { differenceInCalendarDays, startOfDay } from "date-fns"
import { normalizeBuyerLabel, shouldExcludeBuyer } from "@/lib/buyers"
import type { LeadTimeSummary, ProcessosSummary } from "@/lib/types/export-suprimentos"
import type { DesempenhoPageData, LeadTimesPorComprador } from "@/lib/types/desempenho"
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

type ExportCache = {
  mtimeMs: number
  table: ExcelTable
}

let cache: ExportCache | undefined

function loadExportTable() {
  const filePath = resolveDataPath("dados/fs_export_suprimentos_v2.xls")
  const mtimeMs = getFileMtimeMs(filePath)
  if (cache?.mtimeMs === mtimeMs) return cache.table

  const table = readExcelTable(filePath, "Sheet1")
  cache = { mtimeMs, table }
  return table
}

function getYearFromDateCell(cell: unknown) {
  const d = asDate(cell)
  if (!d || !isReasonableYear(d, { minYear: 2015, maxYear: 2100 })) return undefined
  return d.getUTCFullYear()
}

function pushOption(set: Set<string>, value: string | undefined) {
  const v = value?.trim()
  if (!v) return
  set.add(v)
}

function avg(total: number, count: number) {
  return count ? total / count : 0
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function getDesempenhoPageData(
  filters: DashboardFilters,
  { top = 10 }: { top?: number } = {},
): DesempenhoPageData {
  const table = loadExportTable()

  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iFilialPedidoNome = getIndex(table.index, "Nome Filial Pedido", "first")
  const iFilialSolicNome = getIndex(table.index, "Nome Filial da solicitacao", "first")
  const iEmissaoPedido = getIndex(table.index, "Dt.Emissão", "first")
  const iPedido = getIndex(table.index, "Número do pedido", "first")
  const iCodigoSolic = getIndex(table.index, "Código da solicitação", "first")
  const iValorItem = getIndex(table.index, "Vlr.Total Item", "first")
  const iSituItemPedido = getIndex(table.index, "Situação do Item Pedido", "first")
  const iAltPc = getIndex(table.index, "DATA ALTERAÇÃO PC", "first")

  const iAprovSolic = getIndex(table.index, "DATA APROVAÇÃO SOLICITAÇÃO", "first")
  const iAprovPedido = getIndex(table.index, "DATA APROVAÇÃO PEDIDO", "first")

  const iEnvioMapa = getIndex(table.index, "DATA DO ENVIO DA COTAÇÃO PARA APROVAÇÃO", "first")
  const iAprovMapa = getIndex(table.index, "DATA DA APROVAÇÃO - COTAÇÃO", "first")
  const iCodCotacao = getIndex(table.index, "Código da cotação", "first")

  const optionsCompradores = new Set<string>()
  const optionsFiliais = new Set<string>()

  let valorTotal = 0
  let itensAtendidos = 0
  const solicitacoesAtendidas = new Set<string>()
  const revisoes = new Set<string>()

  const valorPorComprador = new Map<string, number>()
  const itensPorComprador = new Map<string, number>()
  const pcsPorComprador = new Map<string, Set<string>>()

  const ltPorComprador = new Map<
    string,
    { compraTotal: number; compraCount: number; aprovTotal: number; aprovCount: number; mapaTotal: number; mapaCount: number }
  >()
  const seenCompra = new Set<string>()
  const seenAprov = new Set<string>()
  const seenMapa = new Set<string>()

  let ltComprasTotal = 0
  let ltComprasCount = 0
  let ltAprovTotal = 0
  let ltAprovCount = 0
  let ltMapaTotal = 0
  let ltMapaCount = 0

  for (const row of table.rows) {
    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)
    const filial =
      asNonEmptyString(getCell(row, iFilialPedidoNome)) ??
      asNonEmptyString(getCell(row, iFilialSolicNome)) ??
      "Sem filial"

    const emissaoPedido = asDate(getCell(row, iEmissaoPedido))
    const envioMapa = asDate(getCell(row, iEnvioMapa))
    const alteracaoPc = asDate(getCell(row, iAltPc))

    const matchesAnyPeriod =
      matchesPeriod(emissaoPedido, filters) || matchesPeriod(envioMapa, filters) || matchesPeriod(alteracaoPc, filters)

    if (matchesAnyPeriod) {
      pushOption(optionsCompradores, comprador)
      pushOption(optionsFiliais, filial)
    }

    if (!matchesText(comprador, filters.comprador) || !matchesText(filial, filters.filial)) continue

    // Compras (base: emissão do pedido)
    if (matchesPeriod(emissaoPedido, filters)) {
      const pedido = asNonEmptyString(getCell(row, iPedido))
      const valor = asNumber(getCell(row, iValorItem)) ?? 0
      if (valor) {
        valorTotal += valor
        valorPorComprador.set(comprador, (valorPorComprador.get(comprador) ?? 0) + valor)
      }

      if (pedido) {
        if (!pcsPorComprador.has(comprador)) pcsPorComprador.set(comprador, new Set())
        pcsPorComprador.get(comprador)!.add(pedido)
      }

      itensPorComprador.set(comprador, (itensPorComprador.get(comprador) ?? 0) + 1)

      const situItemPedido = asNonEmptyString(getCell(row, iSituItemPedido))?.toLowerCase()
      const sol = asNonEmptyString(getCell(row, iCodigoSolic))
      if (situItemPedido?.includes("atendid")) {
        itensAtendidos += 1
        if (sol) solicitacoesAtendidas.add(sol)
      }

      // Lead Time Compras: aprovação solicitação -> aprovação pedido (1x por solicitação)
      const aprovSolic = asDate(getCell(row, iAprovSolic))
      const aprovPedido = asDate(getCell(row, iAprovPedido))
      if (sol && aprovSolic && aprovPedido && !seenCompra.has(sol)) {
        seenCompra.add(sol)
        const dias = differenceInCalendarDays(startOfDay(aprovPedido), startOfDay(aprovSolic))
        if (dias >= 0 && dias <= 3650) {
          ltComprasTotal += dias
          ltComprasCount += 1
          const agg =
            ltPorComprador.get(comprador) ?? { compraTotal: 0, compraCount: 0, aprovTotal: 0, aprovCount: 0, mapaTotal: 0, mapaCount: 0 }
          agg.compraTotal += dias
          agg.compraCount += 1
          ltPorComprador.set(comprador, agg)
        }
      }

      // Lead Time Aprovação PC: emissão -> aprovação (1x por pedido)
      if (pedido && emissaoPedido && aprovPedido && !seenAprov.has(pedido)) {
        seenAprov.add(pedido)
        const dias = differenceInCalendarDays(startOfDay(aprovPedido), startOfDay(emissaoPedido))
        if (dias >= 0 && dias <= 3650) {
          ltAprovTotal += dias
          ltAprovCount += 1
          const agg =
            ltPorComprador.get(comprador) ?? { compraTotal: 0, compraCount: 0, aprovTotal: 0, aprovCount: 0, mapaTotal: 0, mapaCount: 0 }
          agg.aprovTotal += dias
          agg.aprovCount += 1
          ltPorComprador.set(comprador, agg)
        }
      }
    }

    // Revisões (base: data alteração PC)
    if (matchesPeriod(alteracaoPc, filters)) {
      const pedido = asNonEmptyString(getCell(row, iPedido))
      if (pedido) revisoes.add(pedido)
    }

    // Lead Time Mapa: envio -> aprovação (base: envio do mapa)
    if (matchesPeriod(envioMapa, filters)) {
      const aprovMapa = asDate(getCell(row, iAprovMapa))
      const codCot = asNonEmptyString(getCell(row, iCodCotacao))
      if (envioMapa && aprovMapa && codCot && !seenMapa.has(codCot)) {
        seenMapa.add(codCot)
        const dias = differenceInCalendarDays(startOfDay(aprovMapa), startOfDay(envioMapa))
        if (dias >= 0 && dias <= 3650) {
          ltMapaTotal += dias
          ltMapaCount += 1
          const agg =
            ltPorComprador.get(comprador) ?? { compraTotal: 0, compraCount: 0, aprovTotal: 0, aprovCount: 0, mapaTotal: 0, mapaCount: 0 }
          agg.mapaTotal += dias
          agg.mapaCount += 1
          ltPorComprador.set(comprador, agg)
        }
      }
    }
  }

  const leadTimesPorComprador: LeadTimesPorComprador[] = [...ltPorComprador.entries()]
    .map(([comprador, agg]) => {
      const ltComprasDias = round2(avg(agg.compraTotal, agg.compraCount))
      const ltAprovPcDias = round2(avg(agg.aprovTotal, agg.aprovCount))
      const ltMapaDias = round2(avg(agg.mapaTotal, agg.mapaCount))
      return { comprador, ltComprasDias, ltAprovPcDias, ltMapaDias, totalDias: round2(ltComprasDias + ltAprovPcDias + ltMapaDias) }
    })
    .sort((a, b) => b.totalDias - a.totalDias)
    .slice(0, Math.max(1, top))

  const valor = [...valorPorComprador.entries()]
    .map(([comprador, valor]) => ({ comprador, valor: round2(valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, Math.max(1, top))

  const pcs = [...pcsPorComprador.entries()]
    .map(([comprador, set]) => ({ comprador, pcs: set.size }))
    .sort((a, b) => b.pcs - a.pcs)
    .slice(0, Math.max(1, top))

  const itens = [...itensPorComprador.entries()]
    .map(([comprador, itens]) => ({ comprador, itens }))
    .sort((a, b) => b.itens - a.itens)
    .slice(0, Math.max(1, top))

  const kpis = {
    valorTotal: round2(valorTotal),
    itensAtendidos,
    solicitacoesAtendidas: solicitacoesAtendidas.size,
    revisoes: revisoes.size,
    ltComprasDias: round2(avg(ltComprasTotal, ltComprasCount)),
    ltMapaDias: round2(avg(ltMapaTotal, ltMapaCount)),
    ltAprovPcDias: round2(avg(ltAprovTotal, ltAprovCount)),
  }

  return {
    filters,
    options: { compradores: [...optionsCompradores].sort(), filiais: [...optionsFiliais].sort() },
    kpis,
    leadTimesPorComprador,
    valorPorComprador: valor,
    pcsPorComprador: pcs,
    itensPorComprador: itens,
  }
}

export function getLeadTimeSummary({
  year = new Date().getFullYear(),
  month,
  top = 15,
}: {
  year?: number
  month?: number
  top?: number
} = {}): LeadTimeSummary {
  const table = loadExportTable()

  const iAprovSolic = getIndex(table.index, "DATA APROVAÇÃO SOLICITAÇÃO", "first")
  const iAprovPedido = getIndex(table.index, "DATA APROVAÇÃO PEDIDO", "first")
  const iEmissaoPedido = getIndex(table.index, "Dt.Emissão", "first")
  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iPedido = getIndex(table.index, "Número do pedido", "first")
  const iVlrItem = getIndex(table.index, "Vlr.Total Item", "first")
  const iCotacao = getIndex(table.index, "Código da cotação", "first")
  const iEnvioCotacaoAprov = getIndex(table.index, "DATA DO ENVIO DA COTAÇÃO PARA APROVAÇÃO", "first")
  const iAprovCotacao = getIndex(table.index, "DATA DA APROVAÇÃO - COTAÇÃO", "first")

  const monthFilter = typeof month === "number" ? month : new Date().getMonth() + 1

  // Lead time por comprador (considera uma vez por solicitação)
  const leadTimeByBuyer = new Map<string, { totalDias: number; count: number }>()
  const seenSolic = new Set<string>()

  // Gasto por comprador no mês (por item)
  const spendByBuyer = new Map<string, number>()

  // PCs emitidos no mês (únicos)
  const pcsNoMes = new Set<string>()

  // Itens por comprador (por item) no ano
  const itensByBuyer = new Map<string, number>()

  // Mapas em aprovação (cotações enviadas, sem aprovação)
  const mapasByBuyer = new Map<string, Set<string>>()

  // PCs em aprovação (pedido existe, sem aprovação)
  const pcsAprovByBuyer = new Map<string, Set<string>>()

  for (const row of table.rows) {
    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)

    const aprovSolic = asDate(getCell(row, iAprovSolic))
    const aprovPedido = asDate(getCell(row, iAprovPedido))
    const emissaoPedido = asDate(getCell(row, iEmissaoPedido))

    // Lead time: ano pelo aprovSolic
    if (aprovSolic && aprovPedido && isReasonableYear(aprovSolic, { minYear: 2015, maxYear: 2100 })) {
      if (aprovSolic.getUTCFullYear() === year) {
        const codSolic = asNonEmptyString(getCell(row, getIndex(table.index, "Código da solicitação", "first")))
        const key = codSolic ? `${codSolic}` : undefined
        if (key && !seenSolic.has(key)) {
          seenSolic.add(key)
          const dias = differenceInCalendarDays(startOfDay(aprovPedido), startOfDay(aprovSolic))
          if (dias >= 0 && dias <= 3650) {
            const agg = leadTimeByBuyer.get(comprador) ?? { totalDias: 0, count: 0 }
            agg.totalDias += dias
            agg.count += 1
            leadTimeByBuyer.set(comprador, agg)
          }
        }
      }
    }

    // Itens por comprador no ano (usa emissão do pedido como referência do ano)
    if (emissaoPedido && getYearFromDateCell(emissaoPedido) === year) {
      itensByBuyer.set(comprador, (itensByBuyer.get(comprador) ?? 0) + 1)
    }

    // Gasto por comprador no mês (usa emissão do pedido)
    if (emissaoPedido && getYearFromDateCell(emissaoPedido) === year) {
      const m = emissaoPedido.getUTCMonth() + 1
      if (m === monthFilter) {
        const valor = asNumber(getCell(row, iVlrItem)) ?? 0
        spendByBuyer.set(comprador, (spendByBuyer.get(comprador) ?? 0) + valor)
      }
    }

    // PCs emitidos no mês
    const pedido = asNonEmptyString(getCell(row, iPedido))
    if (pedido && emissaoPedido && getYearFromDateCell(emissaoPedido) === year) {
      const m = emissaoPedido.getUTCMonth() + 1
      if (m === monthFilter) pcsNoMes.add(pedido)
    }

    // Mapas em aprovação
    const envioMapa = asDate(getCell(row, iEnvioCotacaoAprov))
    const aprovMapa = asDate(getCell(row, iAprovCotacao))
    const codCot = asNonEmptyString(getCell(row, iCotacao))
    if (envioMapa && isReasonableYear(envioMapa, { minYear: 2015, maxYear: 2100 }) && envioMapa.getUTCFullYear() === year) {
      if (!aprovMapa && codCot) {
        if (!mapasByBuyer.has(comprador)) mapasByBuyer.set(comprador, new Set())
        mapasByBuyer.get(comprador)!.add(codCot)
      }
    }

    // PCs em aprovação
    if (pedido && emissaoPedido && getYearFromDateCell(emissaoPedido) === year) {
      if (!aprovPedido) {
        if (!pcsAprovByBuyer.has(comprador)) pcsAprovByBuyer.set(comprador, new Set())
        pcsAprovByBuyer.get(comprador)!.add(pedido)
      }
    }
  }

  const leadTime = [...leadTimeByBuyer.entries()]
    .map(([comprador, agg]) => ({ comprador, leadTimeMedioDias: agg.count ? agg.totalDias / agg.count : 0 }))
    .sort((a, b) => b.leadTimeMedioDias - a.leadTimeMedioDias)
    .slice(0, top)

  const gastoMes = [...spendByBuyer.entries()]
    .map(([comprador, valor]) => ({ comprador, valor: Number(valor.toFixed(2)) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, top)

  const itens = [...itensByBuyer.entries()]
    .map(([comprador, itens]) => ({ comprador, itens }))
    .sort((a, b) => b.itens - a.itens)
    .slice(0, top)

  const mapas = [...mapasByBuyer.entries()]
    .map(([comprador, set]) => ({ comprador, mapas: set.size }))
    .sort((a, b) => b.mapas - a.mapas)
    .slice(0, top)

  const pcsAprov = [...pcsAprovByBuyer.entries()]
    .map(([comprador, set]) => ({ comprador, pcs: set.size }))
    .sort((a, b) => b.pcs - a.pcs)
    .slice(0, top)

  return {
    year,
    month: monthFilter,
    leadTimePorComprador: leadTime,
    gastoPorCompradorMes: gastoMes,
    pcsEmitidosMes: pcsNoMes.size,
    itensPorComprador: itens,
    mapasEmAprovacao: mapas,
    pcsEmAprovacao: pcsAprov,
  }
}

export function getProcessosSummary({
  year = new Date().getFullYear(),
  month,
  top = 10,
}: { year?: number; month?: number; top?: number } = {}) {
  return getProcessosPageData({ year, month }, { top }).summary
}

export function getProcessosPageData(
  filters: DashboardFilters,
  { top = 10 }: { top?: number } = {},
): { filters: DashboardFilters; options: import("@/lib/filters").DashboardFilterOptions; summary: ProcessosSummary } {
  const table = loadExportTable()

  const iComprador = getIndex(table.index, "Nome do comprador", "first")
  const iFilialPedidoNome = getIndex(table.index, "Nome Filial Pedido", "first")
  const iFilialSolicNome = getIndex(table.index, "Nome Filial da solicitacao", "first")
  const iEmissaoPedido = getIndex(table.index, "Dt.Emissão", "first")
  const iFornecedor = getIndex(table.index, "Nome Fantasia", "first")
  const iVlrItem = getIndex(table.index, "Vlr.Total Item", "first")
  const iTipoFrete = getIndex(table.index, "Tipo de Preço", "first")
  const iCondPagto = getIndex(table.index, "Cond.Pagto.", "first")
  const iDescItemPedido = getIndex(table.index, "Descrição do Item", "last")

  const optionsCompradores = new Set<string>()
  const optionsFiliais = new Set<string>()

  const suppliers = new Map<string, number>()
  const itemsValue = new Map<string, number>()
  const freight = new Map<string, number>()
  const demand = new Map<string, number>()
  const payments = new Map<string, number>()

  for (const row of table.rows) {
    const emissao = asDate(getCell(row, iEmissaoPedido))
    if (!emissao || !matchesPeriod(emissao, filters)) continue

    const rawBuyer = asNonEmptyString(getCell(row, iComprador))
    if (shouldExcludeBuyer(rawBuyer)) continue
    const comprador = normalizeBuyerLabel(rawBuyer)
    const filial =
      asNonEmptyString(getCell(row, iFilialPedidoNome)) ??
      asNonEmptyString(getCell(row, iFilialSolicNome)) ??
      "Sem filial"

    pushOption(optionsCompradores, comprador)
    pushOption(optionsFiliais, filial)

    if (!matchesText(comprador, filters.comprador) || !matchesText(filial, filters.filial)) continue

    const fornecedor = asNonEmptyString(getCell(row, iFornecedor)) ?? "Sem fornecedor"
    const valor = asNumber(getCell(row, iVlrItem)) ?? 0
    suppliers.set(fornecedor, (suppliers.get(fornecedor) ?? 0) + valor)

    const item = asNonEmptyString(getCell(row, iDescItemPedido)) ?? "Sem item"
    itemsValue.set(item, (itemsValue.get(item) ?? 0) + valor)
    demand.set(item, (demand.get(item) ?? 0) + 1)

    const tipo = asNonEmptyString(getCell(row, iTipoFrete)) ?? "N/I"
    freight.set(tipo, (freight.get(tipo) ?? 0) + 1)

    const cond = asNonEmptyString(getCell(row, iCondPagto)) ?? "N/I"
    payments.set(cond, (payments.get(cond) ?? 0) + 1)
  }

  const topFornecedoresValor = [...suppliers.entries()]
    .map(([fornecedor, valor]) => ({ fornecedor, valor: round2(valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, top)

  const topItensValor = [...itemsValue.entries()]
    .map(([item, valor]) => ({ item, valor: round2(valor) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, top)

  const tipoFrete = [...freight.entries()]
    .map(([tipo, quantidade]) => ({ tipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  const demandasPorItem = [...demand.entries()]
    .map(([item, quantidade]) => ({ item, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, top)

  const condicaoPagamento = [...payments.entries()]
    .map(([condicao, quantidade]) => ({ condicao, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  const summary: ProcessosSummary = {
    year: filters.year ?? new Date().getFullYear(),
    month: filters.month,
    pedidosRetroativos: 0,
    topFornecedoresValor,
    topItensValor,
    tipoFrete,
    demandasPorItem,
    condicaoPagamento,
  }

  return {
    filters,
    options: { compradores: [...optionsCompradores].sort(), filiais: [...optionsFiliais].sort() },
    summary,
  }
}
