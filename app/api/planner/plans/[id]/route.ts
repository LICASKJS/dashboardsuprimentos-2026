import { NextResponse } from "next/server"
import { z } from "zod"
import { DEFAULT_PLANNER_PLAN_ID, listPlannerPlans, listPlannerTasks, savePlannerPlans, savePlannerTasks } from "@/lib/server/planner-store"
import type { PlannerPlanColor } from "@/lib/types/planner"

export const runtime = "nodejs"

const planColorSchema = z.enum(["green", "blue", "purple", "pink", "red", "orange", "gray"])

const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    color: planColorSchema.optional(),
    pinned: z.boolean().optional(),
  })
  .strict()

function jsonNoStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return jsonNoStore({ ok: false, error: "Id inválido." }, { status: 400 })

  const body = await request.json().catch(() => null)
  const parsed = updatePlanSchema.safeParse(body)
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "Payload inválido.", issues: parsed.error.issues }, { status: 400 })
  }

  const plans = await listPlannerPlans()
  const index = plans.findIndex((plan) => plan.id === id)
  if (index < 0) return jsonNoStore({ ok: false, error: "Plano não encontrado." }, { status: 404 })

  const nowIso = new Date().toISOString()
  const next = { ...plans[index], updatedAt: nowIso }
  if (parsed.data.name !== undefined) next.name = parsed.data.name
  if (parsed.data.color !== undefined) next.color = parsed.data.color as PlannerPlanColor
  if (parsed.data.pinned !== undefined) next.pinned = parsed.data.pinned

  plans[index] = next
  await savePlannerPlans(plans)
  return jsonNoStore({ ok: true, plan: next })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return jsonNoStore({ ok: false, error: "Id inválido." }, { status: 400 })
  if (id === DEFAULT_PLANNER_PLAN_ID) {
    return jsonNoStore({ ok: false, error: "Não é possível excluir o plano padrão." }, { status: 400 })
  }

  const plans = await listPlannerPlans()
  const nextPlans = plans.filter((plan) => plan.id !== id)
  if (nextPlans.length === plans.length) {
    return jsonNoStore({ ok: false, error: "Plano não encontrado." }, { status: 404 })
  }

  const tasks = await listPlannerTasks()
  const nextTasks = tasks.map((task) => (task.planId === id ? { ...task, planId: DEFAULT_PLANNER_PLAN_ID } : task))
  await savePlannerTasks(nextTasks)

  await savePlannerPlans(nextPlans)
  return jsonNoStore({ ok: true })
}

