export type PlannerPriority = "baixa" | "media" | "alta"

export type PlannerPlanColor = "green" | "blue" | "purple" | "pink" | "red" | "orange" | "gray"

export type PlannerPlan = {
  id: string
  name: string
  color: PlannerPlanColor
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export type PlannerTask = {
  id: string
  title: string
  description?: string
  planId?: string
  assigneeName: string
  assigneeEmail?: string
  dueDate?: string
  priority: PlannerPriority
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type PlannerAssignee = {
  name: string
  email: string
  updatedAt: string
}
