import fs from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { readDataFilesConfig, writeDataFilesConfig } from "@/lib/server/data-files"

export const runtime = "nodejs"

const UPLOAD_DIR_REL = "dados/uploads"
type UploadKind = "export-suprimentos" | "solicitacoes"

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

export async function POST(request: Request) {
  const formData = await request.formData()
  const kind = formData.get("kind")
  const file = formData.get("file")

  if (!isAllowedKind(kind)) {
    return NextResponse.json({ ok: false, error: "Tipo de upload inválido." }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Arquivo não enviado." }, { status: 400 })
  }

  const fileName = file.name ?? ""
  const lowerName = fileName.toLowerCase()
  if (lowerName && !lowerName.endsWith(".xls") && !lowerName.endsWith(".xlsx")) {
    return NextResponse.json({ ok: false, error: "Envie um arquivo .xls ou .xlsx." }, { status: 400 })
  }

  const ext = guessExtension(fileName, kind)
  const relativeDestPath = path.posix.join(UPLOAD_DIR_REL, `${kind}-${safeTimestamp()}.${ext}`)
  const destPath = path.join(process.cwd(), relativeDestPath)

  await fs.mkdir(path.dirname(destPath), { recursive: true })

  const arrayBuffer = await file.arrayBuffer()
  await fs.writeFile(destPath, Buffer.from(arrayBuffer))

  const config = readDataFilesConfig()
  const previous = config[kind]
  config[kind] = relativeDestPath
  await writeDataFilesConfig(config)

  if (typeof previous === "string" && previous && previous !== relativeDestPath) {
    const previousNormalized = previous.trim()
    const isUploads =
      previousNormalized.startsWith("dados/uploads/") || previousNormalized.startsWith("dados\\uploads\\")

    if (isUploads) {
      const previousPath = path.isAbsolute(previousNormalized)
        ? previousNormalized
        : path.join(process.cwd(), previousNormalized)

      await fs.rm(previousPath, { force: true })
    }
  }

  return NextResponse.json(
    { ok: true, kind, savedAs: relativeDestPath, sizeBytes: arrayBuffer.byteLength },
    { headers: { "Cache-Control": "no-store" } },
  )
}

