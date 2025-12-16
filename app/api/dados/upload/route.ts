import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { NextResponse } from "next/server"
import { readDataFilesConfig, resolveDataFilePath, writeDataFilesConfig } from "@/lib/server/data-files"

export const runtime = "nodejs"

const UPLOAD_DIR_REL = "dados/uploads"
const CHUNKED_DIR_NAME = ".chunked"

type UploadKind = "export-suprimentos" | "solicitacoes"

type ChunkedUploadOperation = "complete" | "abort"
type ChunkedUploadRequestBody = {
  op: ChunkedUploadOperation
  kind: UploadKind
  uploadId: string
}

type ChunkedUploadManifest = {
  kind: UploadKind
  originalName: string
  totalSize: number
  chunkSize: number
  totalChunks: number
  received: boolean[]
  createdAt: string
}

function isAllowedKind(value: unknown): value is UploadKind {
  return value === "export-suprimentos" || value === "solicitacoes"
}

function guessExtension(fileName: string, kind: UploadKind) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".xlsx")) return "xlsx"
  if (lower.endsWith(".xls")) return "xls"
  return kind === "solicitacoes" ? "xlsx" : "xls"
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-")
}

function isJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  return contentType.includes("application/json")
}

function isMultipartRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  return contentType.includes("multipart/form-data")
}

function isValidUploadId(value: string) {
  return /^[a-z0-9-]{8,80}$/i.test(value)
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } })
}

async function setActiveFile(kind: UploadKind, relativeDestPath: string) {
  const config = readDataFilesConfig()
  const previous = config[kind]
  config[kind] = relativeDestPath
  await writeDataFilesConfig(config)

  if (typeof previous === "string" && previous && previous !== relativeDestPath) {
    const previousNormalized = previous.trim()
    const previousPath = resolveDataFilePath(previousNormalized)
    const uploadsDir = resolveDataFilePath(UPLOAD_DIR_REL)
    const relativeToUploads = path.relative(path.resolve(uploadsDir), path.resolve(previousPath))
    const isUploads = relativeToUploads && !relativeToUploads.startsWith("..") && !path.isAbsolute(relativeToUploads)

    if (isUploads) {
      await fs.rm(previousPath, { force: true })
    }
  }
}

function getChunkedDirRelPath() {
  return path.posix.join(UPLOAD_DIR_REL, CHUNKED_DIR_NAME)
}

function getChunkedManifestRelPath(kind: UploadKind, uploadId: string) {
  return path.posix.join(getChunkedDirRelPath(), `${kind}-${uploadId}.json`)
}

function getChunkedPartRelPath(kind: UploadKind, uploadId: string) {
  return path.posix.join(getChunkedDirRelPath(), `${kind}-${uploadId}.part`)
}

async function readChunkedManifest(kind: UploadKind, uploadId: string) {
  const manifestPath = resolveDataFilePath(getChunkedManifestRelPath(kind, uploadId))
  const raw = await fs.readFile(manifestPath, "utf8")
  return JSON.parse(raw) as ChunkedUploadManifest
}

async function writeChunkedManifest(kind: UploadKind, uploadId: string, manifest: ChunkedUploadManifest) {
  const manifestPath = resolveDataFilePath(getChunkedManifestRelPath(kind, uploadId))
  await fs.mkdir(path.dirname(manifestPath), { recursive: true })
  await fs.writeFile(manifestPath, JSON.stringify(manifest), "utf8")
}

async function ensureChunkedPartFile(kind: UploadKind, uploadId: string, totalSize: number) {
  const partPath = resolveDataFilePath(getChunkedPartRelPath(kind, uploadId))
  await fs.mkdir(path.dirname(partPath), { recursive: true })
  try {
    const stat = await fs.stat(partPath)
    if (stat.size !== totalSize) {
      return { ok: false as const, error: "Upload em partes inconsistente (tamanho diferente)." }
    }
  } catch {
    const handle = await fs.open(partPath, "w+")
    try {
      await handle.truncate(totalSize)
    } finally {
      await handle.close()
    }
  }
  return { ok: true as const, partPath }
}

async function abortChunkedUpload(kind: UploadKind, uploadId: string) {
  const manifestPath = resolveDataFilePath(getChunkedManifestRelPath(kind, uploadId))
  const partPath = resolveDataFilePath(getChunkedPartRelPath(kind, uploadId))
  await fs.rm(manifestPath, { force: true })
  await fs.rm(partPath, { force: true })
}

async function completeChunkedUpload(kind: UploadKind, uploadId: string) {
  const manifest = await readChunkedManifest(kind, uploadId).catch(() => null)
  if (!manifest) return jsonError(404, "Upload em partes nao encontrado.")

  if (!Array.isArray(manifest.received) || manifest.received.length !== manifest.totalChunks) {
    return jsonError(400, "Upload em partes corrompido.")
  }

  const missing = manifest.received
    .map((done, idx) => (done ? null : idx))
    .filter((idx): idx is number => typeof idx === "number")

  if (missing.length > 0) {
    return jsonError(400, `Upload em partes incompleto (faltam ${missing.length} parte(s)).`)
  }

  const partPath = resolveDataFilePath(getChunkedPartRelPath(kind, uploadId))
  const ext = guessExtension(manifest.originalName, kind)
  const destFileName = `${kind}-${safeTimestamp()}.${ext}`
  const relativeDestPath = path.posix.join(UPLOAD_DIR_REL, destFileName)
  const destPath = resolveDataFilePath(relativeDestPath)

  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.rename(partPath, destPath)
  await fs.rm(resolveDataFilePath(getChunkedManifestRelPath(kind, uploadId)), { force: true })
  await setActiveFile(kind, relativeDestPath)

  return NextResponse.json(
    { ok: true, kind, savedAs: relativeDestPath, sizeBytes: manifest.totalSize },
    { headers: { "Cache-Control": "no-store" } },
  )
}

async function handleMultipartUpload(request: Request) {
  const formData = await request.formData()
  const kind = formData.get("kind")
  const file = formData.get("file")

  if (!isAllowedKind(kind)) {
    return jsonError(400, "Tipo de upload invalido.")
  }

  if (!(file instanceof File)) {
    return jsonError(400, "Arquivo nao enviado.")
  }

  const fileName = file.name ?? ""
  const lowerName = fileName.toLowerCase()
  if (lowerName && !lowerName.endsWith(".xls") && !lowerName.endsWith(".xlsx")) {
    return jsonError(400, "Envie um arquivo .xls ou .xlsx.")
  }

  const ext = guessExtension(fileName, kind)
  const destFileName = `${kind}-${safeTimestamp()}.${ext}`
  const relativeDestPath = path.posix.join(UPLOAD_DIR_REL, destFileName)
  const destPath = resolveDataFilePath(relativeDestPath)

  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await pipeline(Readable.fromWeb(file.stream() as ReadableStream), fsSync.createWriteStream(destPath))

  const stat = await fs.stat(destPath)
  await setActiveFile(kind, relativeDestPath)

  return NextResponse.json(
    { ok: true, kind, savedAs: relativeDestPath, sizeBytes: stat.size },
    { headers: { "Cache-Control": "no-store" } },
  )
}

export async function PUT(request: Request) {
  const url = new URL(request.url)
  const kindParam = url.searchParams.get("kind")
  const uploadId = url.searchParams.get("uploadId") ?? ""
  const fileName = url.searchParams.get("fileName") ?? ""
  const totalSize = Number(url.searchParams.get("totalSize") ?? NaN)
  const chunkSize = Number(url.searchParams.get("chunkSize") ?? NaN)
  const chunkIndex = Number(url.searchParams.get("chunkIndex") ?? NaN)
  const totalChunks = Number(url.searchParams.get("totalChunks") ?? NaN)

  if (!isAllowedKind(kindParam)) return jsonError(400, "Tipo de upload invalido.")
  const kind = kindParam

  if (!uploadId || !isValidUploadId(uploadId)) return jsonError(400, "UploadId invalido.")

  if (!fileName) return jsonError(400, "Nome do arquivo invalido.")
  const lowerName = fileName.toLowerCase()
  if (lowerName && !lowerName.endsWith(".xls") && !lowerName.endsWith(".xlsx")) {
    return jsonError(400, "Envie um arquivo .xls ou .xlsx.")
  }

  if (!Number.isFinite(totalSize) || totalSize <= 0) return jsonError(400, "TotalSize invalido.")
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return jsonError(400, "ChunkSize invalido.")
  if (!Number.isFinite(chunkIndex) || chunkIndex < 0) return jsonError(400, "ChunkIndex invalido.")
  if (!Number.isFinite(totalChunks) || totalChunks <= 0) return jsonError(400, "TotalChunks invalido.")
  if (chunkIndex >= totalChunks) return jsonError(400, "ChunkIndex invalido.")

  const expectedTotalChunks = Math.ceil(totalSize / chunkSize)
  if (totalChunks !== expectedTotalChunks) return jsonError(400, "TotalChunks invalido.")

  const arrayBuffer = await request.arrayBuffer()
  const chunkBuffer = Buffer.from(arrayBuffer)
  if (chunkBuffer.length <= 0) return jsonError(400, "Chunk vazio.")
  if (chunkBuffer.length > chunkSize) return jsonError(400, "Chunk maior que o esperado.")

  const offset = chunkIndex * chunkSize
  if (offset >= totalSize) return jsonError(400, "Chunk fora do limite.")
  if (offset + chunkBuffer.length > totalSize) return jsonError(400, "Chunk fora do limite.")

  const existing = await readChunkedManifest(kind, uploadId).catch(() => null)
  const manifest: ChunkedUploadManifest =
    existing ?? {
      kind,
      originalName: fileName,
      totalSize,
      chunkSize,
      totalChunks,
      received: Array.from({ length: totalChunks }, () => false),
      createdAt: new Date().toISOString(),
    }

  if (
    manifest.kind !== kind ||
    manifest.totalSize !== totalSize ||
    manifest.chunkSize !== chunkSize ||
    manifest.totalChunks !== totalChunks ||
    manifest.originalName !== fileName ||
    !Array.isArray(manifest.received) ||
    manifest.received.length !== totalChunks
  ) {
    return jsonError(400, "Upload em partes inconsistente.")
  }

  const part = await ensureChunkedPartFile(kind, uploadId, totalSize)
  if (!part.ok) return jsonError(400, part.error)

  const handle = await fs.open(part.partPath, "r+")
  try {
    await handle.write(chunkBuffer, 0, chunkBuffer.length, offset)
  } finally {
    await handle.close()
  }

  manifest.received[chunkIndex] = true
  await writeChunkedManifest(kind, uploadId, manifest)

  return NextResponse.json(
    { ok: true, kind, uploadId, chunkIndex, totalChunks, receivedBytes: chunkBuffer.length },
    { headers: { "Cache-Control": "no-store" } },
  )
}

export async function POST(request: Request) {
  if (isJsonRequest(request)) {
    const body = (await request.json().catch(() => null)) as ChunkedUploadRequestBody | null
    if (!body || typeof body !== "object") return jsonError(400, "Payload invalido.")
    if (!isAllowedKind(body.kind)) return jsonError(400, "Tipo de upload invalido.")
    if (!body.uploadId || !isValidUploadId(body.uploadId)) return jsonError(400, "UploadId invalido.")

    if (body.op === "abort") {
      await abortChunkedUpload(body.kind, body.uploadId)
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
    }

    if (body.op === "complete") {
      return completeChunkedUpload(body.kind, body.uploadId)
    }

    return jsonError(400, "Operacao invalida.")
  }

  if (isMultipartRequest(request)) {
    return handleMultipartUpload(request)
  }

  return jsonError(415, "Content-Type nao suportado.")
}
