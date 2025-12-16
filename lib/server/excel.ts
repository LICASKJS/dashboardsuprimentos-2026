import "server-only"

import fs from "node:fs"
import * as XLSX from "xlsx"
import { resolveDataPathWithUploads } from "@/lib/server/data-files"

export type ExcelTable = {
  header: string[]
  rows: unknown[][]
  index: Record<string, number[]>
}

export function resolveDataPath(relativePath: string) {
  return resolveDataPathWithUploads(relativePath)
}

export function getFileMtimeMs(filePath: string) {
  try {
    return fs.statSync(filePath).mtimeMs
  } catch {
    return 0
  }
}

export function buildHeaderIndex(header: unknown[]): Record<string, number[]> {
  const index: Record<string, number[]> = {}
  header.forEach((cell, idx) => {
    const key = typeof cell === "string" ? cell.trim() : String(cell ?? "").trim()
    if (!key) return
    if (!index[key]) index[key] = []
    index[key].push(idx)
  })
  return index
}

export function getIndex(index: Record<string, number[]>, key: string, which: "first" | "last" = "first") {
  const indexes = index[key]
  if (!indexes?.length) return undefined
  return which === "first" ? indexes[0] : indexes[indexes.length - 1]
}

export function getCell(row: unknown[], colIndex: number | undefined) {
  if (colIndex === undefined) return undefined
  return row[colIndex]
}

export function readExcelTable(filePath: string, sheetName?: string): ExcelTable {
  if (!fs.existsSync(filePath)) {
    return { header: [], rows: [], index: {} }
  }

  const fileBuffer = fs.readFileSync(filePath)
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true })
  const resolvedSheetName = sheetName ?? workbook.SheetNames[0]
  const sheet = workbook.Sheets[resolvedSheetName]
  if (!sheet) {
    throw new Error(`Sheet "${resolvedSheetName}" não encontrada em ${filePath}`)
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null }) as unknown[][]
  const header = (rows[0] ?? []).map((cell) => (typeof cell === "string" ? cell.trim() : String(cell ?? "").trim()))
  const dataRows = rows.slice(1)

  return {
    header,
    rows: dataRows,
    index: buildHeaderIndex(header),
  }
}

export function asNonEmptyString(value: unknown) {
  if (value === null || value === undefined) return undefined
  const str = String(value).trim()
  return str ? str : undefined
}

export function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const str = asNonEmptyString(value)
  if (!str) return undefined
  const normalized = str.replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value
  return undefined
}

export function isReasonableYear(date: Date, { minYear = 2015, maxYear = 2035 } = {}) {
  const y = date.getUTCFullYear()
  return y >= minYear && y <= maxYear
}
