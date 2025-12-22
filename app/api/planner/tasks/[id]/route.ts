import { NextResponse } from "next/server"
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

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    planId: z.string().trim().min(1).max(120).optional().or(z.literal("")),
    assigneeName: z.string().trim().min(1).max(120).optional(),
    assigneeEmail: z.string().trim().email().optional().or(z.literal("")),
    dueDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    priority: prioritySchema.optional(),
    completed: z.boolean().optional(),
    notifyEmail: z.boolean().optional(),
  })
  .strict()

function jsonNoStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  })
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

async function resolvePlanId(value: string | undefined) {
  const planIdRaw = normalizeOptionalString(value)
  if (!planIdRaw) return undefined
  const plans = await listPlannerPlans()
  return plans.some((plan) => plan.id === planIdRaw) ? planIdRaw : DEFAULT_PLANNER_PLAN_ID
}

async function applyPatch(task: PlannerTask, patch: z.infer<typeof updateTaskSchema>, nowIso: string) {
  const next: PlannerTask = { ...task, updatedAt: nowIso }

  if (patch.title !== undefined) next.title = patch.title

  if (patch.description !== undefined) {
    const description = normalizeOptionalString(patch.description)
    next.description = description
  }

  if (patch.planId !== undefined) {
    const planId = await resolvePlanId(patch.planId)
    next.planId = planId ?? DEFAULT_PLANNER_PLAN_ID
  }

  if (patch.assigneeName !== undefined) next.assigneeName = patch.assigneeName

  if (patch.assigneeEmail !== undefined) {
    const email = normalizeOptionalString(patch.assigneeEmail)
    next.assigneeEmail = email
  }

  if (patch.dueDate !== undefined) {
    const dueDate = normalizeOptionalString(patch.dueDate)
    next.dueDate = dueDate
  }

  if (patch.priority !== undefined) next.priority = patch.priority as PlannerPriority

  if (patch.completed !== undefined) {
    next.completedAt = patch.completed ? nowIso : undefined
  }

  return next
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "Payload inválido.", issues: parsed.error.issues }, { status: 400 })
  }

  const tasks = await listPlannerTasks()
  const index = tasks.findIndex((task) => task.id === id)
  if (index < 0) return jsonNoStore({ ok: false, error: "Atividade não encontrada." }, { status: 404 })

  const { notifyEmail, ...taskPatch } = parsed.data
  const nowIso = new Date().toISOString()
  const nextTask = await applyPatch(tasks[index], taskPatch, nowIso)
  tasks[index] = nextTask
  await savePlannerTasks(tasks)

  if (nextTask.assigneeEmail) {
    await upsertPlannerAssignee({ name: nextTask.assigneeName, email: nextTask.assigneeEmail, updatedAt: nowIso })
  }

  let email: { ok: boolean; error?: string } | undefined
  if (notifyEmail && nextTask.assigneeEmail) {
    const origin = new URL(request.url).origin
    const result = await notifyPlannerTask({ task: nextTask, origin, kind: "updated" })
    email = result.ok ? { ok: true } : { ok: false, error: result.error }
  }

  return jsonNoStore({ ok: true, task: nextTask, email })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tasks = await listPlannerTasks()
  const nextTasks = tasks.filter((task) => task.id !== id)
  if (nextTasks.length === tasks.length) {
    return jsonNoStore({ ok: false, error: "Atividade não encontrada." }, { status: 404 })
  }

  await savePlannerTasks(nextTasks)
  return jsonNoStore({ ok: true })
}

