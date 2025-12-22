import "server-only"

import fs from "node:fs/promises"
import path from "node:path"
import { getDataDir } from "@/lib/server/data-files"
import type { PlannerAssignee, PlannerPlan, PlannerPlanColor, PlannerTask } from "@/lib/types/planner"

type PlannerData = {
  tasks: PlannerTask[]
  assignees: PlannerAssignee[]
  plans: PlannerPlan[]
}

const PLANNER_DIR_NAME = "planner"
const TASKS_FILE_NAME = "tasks.json"
const ASSIGNEES_FILE_NAME = "assignees.json"
const PLANS_FILE_NAME = "plans.json"

export const DEFAULT_PLANNER_PLAN_ID = "default"

const PLAN_COLORS: PlannerPlanColor[] = ["green", "blue", "purple", "pink", "red", "orange", "gray"]

function getPlannerDir() {
  return path.join(getDataDir(), PLANNER_DIR_NAME)
}

function getTasksPath() {
  return path.join(getPlannerDir(), TASKS_FILE_NAME)
}

function getAssigneesPath() {
  return path.join(getPlannerDir(), ASSIGNEES_FILE_NAME)
}

function getPlansPath() {
  return path.join(getPlannerDir(), PLANS_FILE_NAME)
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function normalizeAssigneeKey(name: string) {
  return name.trim().toLowerCase()
}

function buildDefaultPlan(nowIso: string): PlannerPlan {
  return {
    id: DEFAULT_PLANNER_PLAN_ID,
    name: "Atividades de Compras",
    color: "green",
    pinned: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

function normalizePlanName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function normalizePlanColor(value: unknown): PlannerPlanColor {
  return PLAN_COLORS.includes(value as PlannerPlanColor) ? (value as PlannerPlanColor) : "green"
}

async function ensurePlannerInitialized(): Promise<PlannerData> {
  const [tasksRaw, assigneesRaw, plansRaw] = await Promise.all([
    readJsonFile<PlannerTask[]>(getTasksPath(), []),
    readJsonFile<PlannerAssignee[]>(getAssigneesPath(), []),
    readJsonFile<PlannerPlan[]>(getPlansPath(), []),
  ])

  const tasks = Array.isArray(tasksRaw) ? tasksRaw : []
  const assignees = Array.isArray(assigneesRaw) ? assigneesRaw : []
  let plans = Array.isArray(plansRaw) ? plansRaw : []

  const nowIso = new Date().toISOString()

  if (!plans.length) {
    plans = [buildDefaultPlan(nowIso)]
    await writeJsonFile(getPlansPath(), plans)
  } else {
    let changed = false
    plans = plans.map((plan) => {
      const next: PlannerPlan = {
        id: String(plan.id),
        name: normalizePlanName(String(plan.name ?? "")) || "Sem nome",
        color: normalizePlanColor(plan.color),
        pinned: Boolean(plan.pinned),
        createdAt: typeof plan.createdAt === "string" ? plan.createdAt : nowIso,
        updatedAt: typeof plan.updatedAt === "string" ? plan.updatedAt : nowIso,
      }

      if (
        next.id !== plan.id ||
        next.name !== plan.name ||
        next.color !== plan.color ||
        next.pinned !== plan.pinned ||
        next.createdAt !== plan.createdAt ||
        next.updatedAt !== plan.updatedAt
      ) {
        changed = true
      }
      return next
    })

    if (!plans.some((p) => p.id === DEFAULT_PLANNER_PLAN_ID)) {
      plans.unshift(buildDefaultPlan(nowIso))
      changed = true
    }

    if (changed) await writeJsonFile(getPlansPath(), plans)
  }

  const planIds = new Set(plans.map((plan) => plan.id))
  let tasksChanged = false
  const nextTasks = tasks.map((task) => {
    const planId = typeof task.planId === "string" ? task.planId : undefined
    if (!planId || !planIds.has(planId)) {
      tasksChanged = true
      return { ...task, planId: DEFAULT_PLANNER_PLAN_ID }
    }
    return task
  })
  if (tasksChanged) await writeJsonFile(getTasksPath(), nextTasks)

  return { tasks: nextTasks, assignees, plans }
}

export async function readPlannerData(): Promise<PlannerData> {
  return ensurePlannerInitialized()
}

export async function listPlannerPlans(): Promise<PlannerPlan[]> {
  const { plans } = await readPlannerData()
  return plans
}

export async function listPlannerTasks(): Promise<PlannerTask[]> {
  const { tasks } = await readPlannerData()
  return tasks
}

export async function listPlannerAssignees(): Promise<PlannerAssignee[]> {
  const { assignees } = await readPlannerData()
  return assignees
}

export async function savePlannerTasks(tasks: PlannerTask[]) {
  await writeJsonFile(getTasksPath(), tasks)
}

export async function savePlannerAssignees(assignees: PlannerAssignee[]) {
  await writeJsonFile(getAssigneesPath(), assignees)
}

export async function savePlannerPlans(plans: PlannerPlan[]) {
  await writeJsonFile(getPlansPath(), plans)
}

export async function upsertPlannerAssignee({ name, email, updatedAt }: PlannerAssignee) {
  const { assignees } = await readPlannerData()
  const key = normalizeAssigneeKey(name)
  const next = assignees.filter((assignee) => normalizeAssigneeKey(assignee.name) !== key)
  next.push({ name: name.trim(), email: email.trim(), updatedAt })
  next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
  await savePlannerAssignees(next)
  return next
}

export async function deletePlannerAssignee(name: string) {
  const { assignees } = await readPlannerData()
  const key = normalizeAssigneeKey(name)
  const next = assignees.filter((assignee) => normalizeAssigneeKey(assignee.name) !== key)
  await savePlannerAssignees(next)
  return next
}
