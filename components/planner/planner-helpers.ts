import type { PlannerTask } from "@/lib/types/planner"

export type ViewMode = "grade" | "quadro"
export type NavMode = "meu-dia" | "minhas-tarefas" | "meus-planos" | "plano"

export type ColumnKey =
  | "atrasada"
  | "hoje"
  | "amanha"
  | "essa-semana"
  | "semana-que-vem"
  | "mais-tarde"
  | "sem-data"
  | "concluidas"

export const COLUMNS: { key: ColumnKey; title: string }[] = [
  { key: "atrasada", title: "Atrasada" },
  { key: "hoje", title: "Hoje" },
  { key: "amanha", title: "Amanhã" },
  { key: "essa-semana", title: "Essa semana" },
  { key: "semana-que-vem", title: "Semana que vem" },
  { key: "mais-tarde", title: "Mais tarde" },
  { key: "sem-data", title: "Sem data" },
  { key: "concluidas", title: "Concluídas" },
]

export function normalizeKey(value: string) {
  return value.trim().toLowerCase()
}

export function formatDueDate(value: string | undefined) {
  if (!value) return "Sem data"
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

export function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return undefined
  return new Date(y, m - 1, d)
}

export function startOfDayLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDaysLocal(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function endOfWeekLocal(date: Date) {
  const day = date.getDay() // 0..6 (domingo..sábado)
  const delta = (day === 0 ? 7 : day) - 1 // semana começa na segunda
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - delta)
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
}

export function getColumnKey(task: PlannerTask, todayDay: Date): ColumnKey {
  if (task.completedAt) return "concluidas"
  if (!task.dueDate) return "sem-data"
  const due = parseDateOnly(task.dueDate)
  if (!due) return "sem-data"

  const dueDay = startOfDayLocal(due)
  const diffMs = dueDay.getTime() - todayDay.getTime()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays < 0) return "atrasada"
  if (diffDays === 0) return "hoje"
  if (diffDays === 1) return "amanha"

  const endThisWeek = endOfWeekLocal(todayDay)
  if (dueDay.getTime() <= endThisWeek.getTime()) return "essa-semana"

  const endNextWeek = endOfWeekLocal(addDaysLocal(todayDay, 7))
  if (dueDay.getTime() <= endNextWeek.getTime()) return "semana-que-vem"

  return "mais-tarde"
}

export function getAvatarInitial(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  return (trimmed[0] ?? "?").toUpperCase()
}

export function isToday(dueDate: string | undefined, todayDay: Date) {
  if (!dueDate) return false
  const due = parseDateOnly(dueDate)
  if (!due) return false
  return startOfDayLocal(due).getTime() === todayDay.getTime()
}

export function isOverdue(dueDate: string | undefined, todayDay: Date) {
  if (!dueDate) return false
  const due = parseDateOnly(dueDate)
  if (!due) return false
  return startOfDayLocal(due).getTime() < todayDay.getTime()
}

export function dueTagClasses(dueDate: string | undefined, todayDay: Date) {
  if (!dueDate) return "bg-gray-100 text-gray-700"
  if (isOverdue(dueDate, todayDay)) return "bg-red-600 text-white"
  if (isToday(dueDate, todayDay)) return "bg-orange-500 text-white"
  return "bg-gray-100 text-gray-700"
}

