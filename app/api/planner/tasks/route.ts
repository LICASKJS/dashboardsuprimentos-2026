import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import {
  DEFAULT_PLANNER_PLAN_ID,
  listPlannerPlans,
  listPlannerTasks,
  savePlannerTasks,
  upsertPlannerAssignee,
} from "@/lib/server/planner-store"
import { notifyPlannerTask } from "@/lib/server/planner-notifications"
import type { PlannerPriority, PlannerTask } from "@/lib/types/planner"

export const runtime = "nodejs"

const prioritySchema = z.enum(["baixa", "media", "alta"])

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  planId: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  assigneeName: z.string().trim().min(1).max(120),
  assigneeEmail: z.string().trim().email().optional().or(z.literal("")),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  priority: prioritySchema.optional(),
  notifyEmail: z.boolean().optional(),
})

function jsonNoStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  })
}

export async function GET() {
  const tasks = await listPlannerTasks()
  return jsonNoStore({ ok: true, tasks })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "Payload inválido.", issues: parsed.error.issues }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const id = randomUUID()

  const priority: PlannerPriority = parsed.data.priority ?? "media"
  const description = parsed.data.description?.trim()
  const dueDate = parsed.data.dueDate?.trim()
  const assigneeEmail = parsed.data.assigneeEmail?.trim()
  const notifyEmail = parsed.data.notifyEmail ?? true

  const planIdRaw = parsed.data.planId?.trim()
  const plans = await listPlannerPlans()
  const planId = planIdRaw && plans.some((plan) => plan.id === planIdRaw) ? planIdRaw : DEFAULT_PLANNER_PLAN_ID

  const task: PlannerTask = {
    id,
    title: parsed.data.title,
    description: description ? description : undefined,
    planId,
    assigneeName: parsed.data.assigneeName,
    assigneeEmail: assigneeEmail ? assigneeEmail : undefined,
    dueDate: dueDate ? dueDate : undefined,
    priority,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const tasks = await listPlannerTasks()
  tasks.push(task)
  await savePlannerTasks(tasks)

  if (task.assigneeEmail) {
    await upsertPlannerAssignee({ name: task.assigneeName, email: task.assigneeEmail, updatedAt: nowIso })
  }

  let email: { ok: boolean; error?: string } | undefined
  if (notifyEmail && task.assigneeEmail) {
    const origin = new URL(request.url).origin
    const result = await notifyPlannerTask({ task, origin, kind: "created" })
    email = result.ok ? { ok: true } : { ok: false, error: result.error }
  }

  return jsonNoStore({ ok: true, task, email }, { status: 201 })
}

