import { NextResponse } from "next/server"
import { getActiveDataFile } from "@/lib/server/data-files"

export const runtime = "nodejs"

export function GET() {
  const suprimentos = getActiveDataFile("export-suprimentos")
  const solicitacoes = getActiveDataFile("solicitacoes")

  return NextResponse.json(
    {
      suprimentos: {
        exists: suprimentos.exists,
        mtimeMs: suprimentos.exists ? suprimentos.mtimeMs : undefined,
        sizeBytes: suprimentos.exists ? suprimentos.sizeBytes : undefined,
        path: suprimentos.relativePath,
        source: suprimentos.source,
      },
      solicitacoes: {
        exists: solicitacoes.exists,
        mtimeMs: solicitacoes.exists ? solicitacoes.mtimeMs : undefined,
        sizeBytes: solicitacoes.exists ? solicitacoes.sizeBytes : undefined,
        path: solicitacoes.relativePath,
        source: solicitacoes.source,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}

