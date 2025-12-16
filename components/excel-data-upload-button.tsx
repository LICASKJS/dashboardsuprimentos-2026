"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type FileStatus = {
  exists: boolean
  mtimeMs?: number
  sizeBytes?: number
  path?: string
  source?: "upload" | "default"
}

type StatusResponse = { suprimentos: FileStatus; solicitacoes: FileStatus }
type UploadKind = "export-suprimentos" | "solicitacoes"
type UploadProgress = { kind: UploadKind; uploadedBytes: number; totalBytes: number }

class UploadHttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function formatBytes(value?: number) {
  if (!value || value <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let v = value
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  const digits = i === 0 ? 0 : i === 1 ? 0 : 1
  return `${v.toFixed(digits)} ${units[i]}`
}

function formatDateTime(mtimeMs?: number) {
  if (!mtimeMs) return undefined
  return new Date(mtimeMs).toLocaleString("pt-BR")
}

function formatStatusLine(status: FileStatus | undefined, loading: boolean) {
  if (loading) return "Carregando..."
  if (!status?.exists) return "Não carregado"
  const parts: string[] = []
  if (status.sizeBytes !== undefined) parts.push(formatBytes(status.sizeBytes))
  const date = formatDateTime(status.mtimeMs)
  if (date) parts.push(date)
  return parts.join(" - ")
}

async function getStatus() {
  const res = await fetch("/api/dados/status", { cache: "no-store" })
  if (!res.ok) throw new Error("Não foi possível ler o status dos arquivos.")
  return (await res.json()) as StatusResponse
}

async function uploadMultipart(kind: UploadKind, file: File) {
  const form = new FormData()
  form.set("kind", kind)
  form.set("file", file)

  const res = await fetch("/api/dados/upload", { method: "POST", body: form })
  const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
  if (!res.ok) {
    const message =
      payload?.error ?? (res.status === 413 ? "Arquivo muito grande para enviar." : "Falha ao enviar arquivo.")
    throw new UploadHttpError(res.status, message)
  }
}

function randomUploadId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function chunkedControl(op: "abort" | "complete", kind: UploadKind, uploadId: string) {
  const res = await fetch("/api/dados/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, kind, uploadId }),
  })
  const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
  if (!res.ok) throw new UploadHttpError(res.status, payload?.error ?? "Falha ao processar upload.")
}

async function uploadChunked(kind: UploadKind, file: File, onProgress?: (progress: UploadProgress) => void) {
  const chunkSize = 1024 * 1024 // 1MB
  const uploadId = randomUploadId()
  const totalBytes = file.size
  const totalChunks = Math.ceil(totalBytes / chunkSize)

  onProgress?.({ kind, uploadedBytes: 0, totalBytes })

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, totalBytes)
      const chunk = file.slice(start, end)

      const params = new URLSearchParams({
        kind,
        uploadId,
        fileName: file.name ?? "",
        totalSize: String(totalBytes),
        chunkSize: String(chunkSize),
        chunkIndex: String(chunkIndex),
        totalChunks: String(totalChunks),
      })

      const res = await fetch(`/api/dados/upload?${params.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
      })
      const payload = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok) {
        throw new UploadHttpError(res.status, payload?.error ?? `Falha ao enviar parte ${chunkIndex + 1}/${totalChunks}.`)
      }

      onProgress?.({ kind, uploadedBytes: end, totalBytes })
    }

    await chunkedControl("complete", kind, uploadId)
  } catch (e) {
    await chunkedControl("abort", kind, uploadId).catch(() => null)
    throw e
  }
}

async function uploadFile(kind: UploadKind, file: File, onProgress?: (progress: UploadProgress) => void) {
  onProgress?.({ kind, uploadedBytes: 0, totalBytes: file.size })

  try {
    await uploadMultipart(kind, file)
    onProgress?.({ kind, uploadedBytes: file.size, totalBytes: file.size })
  } catch (e) {
    if (e instanceof UploadHttpError && e.status === 413) {
      await uploadChunked(kind, file, onProgress)
      onProgress?.({ kind, uploadedBytes: file.size, totalBytes: file.size })
      return
    }
    throw e
  }
}

export function ExcelDataUploadButton() {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const [exportFile, setExportFile] = useState<File | null>(null)
  const [solicitacoesFile, setSolicitacoesFile] = useState<File | null>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const missingData = useMemo(() => {
    if (!status) return false
    return !status.suprimentos.exists || !status.solicitacoes.exists
  }, [status])

  const refreshStatus = async () => {
    setLoadingStatus(true)
    try {
      setStatus(await getStatus())
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    refreshStatus().catch(() => null)
  }, [])

  useEffect(() => {
    if (!open) {
      setExportFile(null)
      setSolicitacoesFile(null)
      setError(null)
      setSuccess(null)
      setProgress(null)
    } else {
      refreshStatus().catch(() => null)
    }
  }, [open])

  const onUpload = async () => {
    setError(null)
    setSuccess(null)
    setProgress(null)

    if (!exportFile && !solicitacoesFile) {
      setError("Selecione pelo menos um arquivo.")
      return
    }

    setUploading(true)
    try {
      if (exportFile) await uploadFile("export-suprimentos", exportFile, setProgress)
      if (solicitacoesFile) await uploadFile("solicitacoes", solicitacoesFile, setProgress)
      await refreshStatus()
      router.refresh()
      setSuccess("Arquivo(s) atualizado(s).")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar arquivo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Anexar planilhas Excel">
              <Paperclip className="w-4 h-4" />
              {missingData && <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />}
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent sideOffset={8}>
          {missingData ? "Anexar planilhas (faltando arquivos)" : "Anexar planilhas Excel"}
        </TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar planilhas</DialogTitle>
          <DialogDescription>Anexe os arquivos Excel para atualizar os dados do dashboard.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="upload-export">Export Suprimentos</Label>
              <span className="text-xs text-muted-foreground">
                {formatStatusLine(status?.suprimentos, loadingStatus)}
              </span>
            </div>
            <Input
              id="upload-export"
              type="file"
              accept=".xls,.xlsx"
              onChange={(e) => setExportFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Ativo: {status?.suprimentos.path ?? "dados/fs_export_suprimentos_v2.xls"}
            </p>
          </div>

          <Separator />

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="upload-solicitacoes">FW Solicitações</Label>
              <span className="text-xs text-muted-foreground">
                {formatStatusLine(status?.solicitacoes, loadingStatus)}
              </span>
            </div>
            <Input
              id="upload-solicitacoes"
              type="file"
              accept=".xls,.xlsx"
              onChange={(e) => setSolicitacoesFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Ativo: {status?.solicitacoes.path ?? "dados/FW_Solicitacoes.xlsx"}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {progress && progress.totalBytes > 0 && (
            <p className="text-xs text-muted-foreground">
              Enviando {progress.kind === "export-suprimentos" ? "Export Suprimentos" : "FW Solicitacoes"}:{" "}
              {Math.round((progress.uploadedBytes / progress.totalBytes) * 100)}% ({formatBytes(progress.uploadedBytes)} /{" "}
              {formatBytes(progress.totalBytes)})
            </p>
          )}
          {success && <p className="text-sm text-green-700">{success}</p>}
        </div>

        <DialogFooter>
          <Button onClick={onUpload} disabled={uploading}>
            {uploading && <Loader2 className="animate-spin" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
