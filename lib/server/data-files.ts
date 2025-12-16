import "server-only"

import fs from "node:fs"
import fsPromises from "node:fs/promises"
import path from "node:path"

export type DataFileKind = "export-suprimentos" | "solicitacoes"

export const DEFAULT_DATA_FILES: Record<DataFileKind, string> = {
  "export-suprimentos": "dados/fs_export_suprimentos_v2.xls",
  solicitacoes: "dados/FW_Solicitacoes.xlsx",
}

const CONFIG_RELATIVE_PATH = "dados/.data-files.json"

type DataFilesConfig = Partial<Record<DataFileKind, string>>

let configCache:
  | {
      mtimeMs: number
      config: DataFilesConfig
    }
  | undefined

function getConfigAbsolutePath() {
  return path.join(process.cwd(), CONFIG_RELATIVE_PATH)
}

function normalizeConfigValue(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function readDataFilesConfig(): DataFilesConfig {
  const configPath = getConfigAbsolutePath()
  try {
    const stat = fs.statSync(configPath)
    const mtimeMs = stat.mtimeMs
    if (configCache?.mtimeMs === mtimeMs) return configCache.config

    const raw = fs.readFileSync(configPath, "utf8")
    const parsed = JSON.parse(raw) as unknown

    const config: DataFilesConfig = {}
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>
      const exportPath = normalizeConfigValue(obj["export-suprimentos"])
      const solicitacoesPath = normalizeConfigValue(obj["solicitacoes"])
      if (exportPath) config["export-suprimentos"] = exportPath
      if (solicitacoesPath) config["solicitacoes"] = solicitacoesPath
    }

    configCache = { mtimeMs, config }
    return config
  } catch {
    configCache = undefined
    return {}
  }
}

export async function writeDataFilesConfig(nextConfig: DataFilesConfig) {
  const configPath = getConfigAbsolutePath()
  await fsPromises.mkdir(path.dirname(configPath), { recursive: true })
  const payload = JSON.stringify(nextConfig, null, 2)
  await fsPromises.writeFile(configPath, `${payload}\n`, "utf8")
}

function statFile(absolutePath: string) {
  try {
    const stat = fs.statSync(absolutePath)
    if (!stat.isFile()) return undefined
    return { exists: true as const, mtimeMs: stat.mtimeMs, sizeBytes: stat.size }
  } catch {
    return undefined
  }
}

export function getActiveDataFile(kind: DataFileKind) {
  const config = readDataFilesConfig()
  const override = normalizeConfigValue(config[kind])
  if (override) {
    const abs = path.isAbsolute(override) ? override : path.join(process.cwd(), override)
    const s = statFile(abs)
    if (s) return { kind, relativePath: override, absolutePath: abs, source: "upload" as const, ...s }
  }

  const fallbackRelative = DEFAULT_DATA_FILES[kind]
  const fallbackAbs = path.join(process.cwd(), fallbackRelative)
  const s = statFile(fallbackAbs)
  if (s) return { kind, relativePath: fallbackRelative, absolutePath: fallbackAbs, source: "default" as const, ...s }

  return {
    kind,
    relativePath: fallbackRelative,
    absolutePath: fallbackAbs,
    source: override ? ("upload" as const) : ("default" as const),
    exists: false as const,
  }
}

export function resolveDataPathWithUploads(relativePath: string) {
  if (relativePath === DEFAULT_DATA_FILES["export-suprimentos"]) {
    return getActiveDataFile("export-suprimentos").absolutePath
  }

  if (relativePath === DEFAULT_DATA_FILES.solicitacoes) {
    return getActiveDataFile("solicitacoes").absolutePath
  }

  return path.join(process.cwd(), relativePath)
}

