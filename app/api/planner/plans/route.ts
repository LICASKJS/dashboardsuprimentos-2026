import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import { listPlannerPlans, savePlannerPlans } from "@/lib/server/planner-store"
import type { PlannerPlan, PlannerPlanColor } from "@/lib/types/planner"

export const runtime = "nodejs"

const planColorSchema = z.enum(["green", "blue", "purple", "pink", "red", "orange", "gray"])

const createPlanSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: planColorSchema.optional(),
  pinned: z.boolean().optional(),
})

function jsonNoStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  })
}

export async function GET() {
  const plans = await listPlannerPlans()
  return jsonNoStore({ ok: true, plans })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = createPlanSchema.safeParse(body)
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "Payload inválido.", issues: parsed.error.issues }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const plan: PlannerPlan = {
    id: randomUUID(),
    name: parsed.data.name,
    color: (parsed.data.color ?? "green") as PlannerPlanColor,
    pinned: parsed.data.pinned ?? true,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const plans = await listPlannerPlans()
  plans.push(plan)
  await savePlannerPlans(plans)

  return jsonNoStore({ ok: true, plan }, { status: 201 })
}

