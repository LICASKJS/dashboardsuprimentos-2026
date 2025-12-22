import { NextResponse } from "next/server"
import { z } from "zod"
import { deletePlannerAssignee, listPlannerAssignees, savePlannerAssignees } from "@/lib/server/planner-store"
import type { PlannerAssignee } from "@/lib/types/planner"

export const runtime = "nodejs"

const assigneeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
})

const upsertSchema = z.object({
  assignees: z.array(assigneeSchema).max(500),
})

function jsonNoStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  })
}

export async function GET() {
  const assignees = await listPlannerAssignees()
  return jsonNoStore({ ok: true, assignees })
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "Payload inválido.", issues: parsed.error.issues }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const normalized: PlannerAssignee[] = parsed.data.assignees
    .map((assignee) => ({ name: assignee.name, email: assignee.email, updatedAt: nowIso }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))

  await savePlannerAssignees(normalized)
  return jsonNoStore({ ok: true, assignees: normalized })
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const name = url.searchParams.get("name")?.trim() ?? ""
  if (!name) return jsonNoStore({ ok: false, error: "Parâmetro 'name' é obrigatório." }, { status: 400 })

  const assignees = await deletePlannerAssignee(name)
  return jsonNoStore({ ok: true, assignees })
}

