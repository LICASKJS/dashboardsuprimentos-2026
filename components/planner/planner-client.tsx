"use client"

import * as React from "react"
import type { PlannerAssignee, PlannerPlan, PlannerTask } from "@/lib/types/planner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlannerBoard } from "@/components/planner/planner-board"
import { PlannerGrid } from "@/components/planner/planner-grid"
import { PlannerPlansGrid } from "@/components/planner/plans-grid"
import { PlannerSidebar } from "@/components/planner/planner-sidebar"
import { PlannerPlanDialog, type PlanDraft } from "@/components/planner/plan-dialog"
import { PlannerTaskDialog, type TaskDraft } from "@/components/planner/task-dialog"
import type { NavMode, ViewMode } from "@/components/planner/planner-helpers"
import { formatDueDate, isToday, normalizeKey, startOfDayLocal } from "@/components/planner/planner-helpers"
import { KanbanSquare, LayoutGrid, Plus, Search } from "lucide-react"

type EmailResult = { ok: boolean; error?: string }
type ApiOk<T> = { ok: true } & T
type ApiErr = { ok: false; error?: string }

type CreateTaskResponse = ApiOk<{ task: PlannerTask; email?: EmailResult }> | ApiErr
type UpdateTaskResponse = ApiOk<{ task: PlannerTask; email?: EmailResult }> | ApiErr
type ToggleTaskResponse = ApiOk<{ task: PlannerTask }> | ApiErr
type DeleteTaskResponse = ApiOk<{}> | ApiErr

type CreatePlanResponse = ApiOk<{ plan: PlannerPlan }> | ApiErr
type UpdatePlanResponse = ApiOk<{ plan: PlannerPlan }> | ApiErr
type DeletePlanResponse = ApiOk<{}> | ApiErr

const DEFAULT_PLAN_ID = "default"

function safeLocalStorageGet(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

async function readJson<T>(res: Response): Promise<T | null> {
  return (await res.json().catch(() => null)) as T | null
}

export function PlannerClient({
  initialTasks,
  initialAssignees,
  initialPlans,
}: {
  initialTasks: PlannerTask[]
  initialAssignees: PlannerAssignee[]
  initialPlans: PlannerPlan[]
}) {
  const [tasks, setTasks] = React.useState<PlannerTask[]>(initialTasks)
  const [assignees, setAssignees] = React.useState<PlannerAssignee[]>(initialAssignees)
  const [plans, setPlans] = React.useState<PlannerPlan[]>(initialPlans)

  const [nav, setNav] = React.useState<NavMode>("minhas-tarefas")
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>(DEFAULT_PLAN_ID)
  const [view, setView] = React.useState<ViewMode>("quadro")

  const [query, setQuery] = React.useState("")
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("__all__")

  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false)
  const [taskDialogMode, setTaskDialogMode] = React.useState<"create" | "edit">("create")
  const [taskDialogTask, setTaskDialogTask] = React.useState<PlannerTask | null>(null)

  const [planDialogOpen, setPlanDialogOpen] = React.useState(false)
  const [planDialogMode, setPlanDialogMode] = React.useState<"create" | "edit">("create")
  const [planDialogPlan, setPlanDialogPlan] = React.useState<PlannerPlan | null>(null)

  const todayDay = React.useMemo(() => startOfDayLocal(new Date()), [])

  React.useEffect(() => {
    const savedView = safeLocalStorageGet("planner.view")
    if (savedView === "grade" || savedView === "quadro") setView(savedView)
    const savedAssignee = safeLocalStorageGet("planner.assignee")
    if (savedAssignee) setAssigneeFilter(savedAssignee)
    const savedNav = safeLocalStorageGet("planner.nav")
    if (savedNav === "meu-dia" || savedNav === "minhas-tarefas" || savedNav === "meus-planos" || savedNav === "plano") {
      setNav(savedNav)
    }
    const savedPlanId = safeLocalStorageGet("planner.planId")
    if (savedPlanId) setSelectedPlanId(savedPlanId)
  }, [])

  React.useEffect(() => safeLocalStorageSet("planner.view", view), [view])
  React.useEffect(() => safeLocalStorageSet("planner.assignee", assigneeFilter), [assigneeFilter])
  React.useEffect(() => safeLocalStorageSet("planner.nav", nav), [nav])
  React.useEffect(() => safeLocalStorageSet("planner.planId", selectedPlanId), [selectedPlanId])

  const plansById = React.useMemo(() => {
    const map = new Map<string, PlannerPlan>()
    for (const plan of plans) map.set(plan.id, plan)
    return map
  }, [plans])

  const pinnedPlans = React.useMemo(() => plans.filter((p) => p.pinned), [plans])

  const selectedPlan = React.useMemo(() => plansById.get(selectedPlanId) ?? null, [plansById, selectedPlanId])

  const assigneeOptions = React.useMemo(() => {
    const names = new Map<string, string>()
    for (const a of assignees) names.set(normalizeKey(a.name), a.name)
    for (const t of tasks) names.set(normalizeKey(t.assigneeName), t.assigneeName)
    return [...names.values()].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
  }, [assignees, tasks])

  const planTaskCounts = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tasks) {
      if (t.completedAt) continue
      const id = t.planId ?? DEFAULT_PLAN_ID
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return counts
  }, [tasks])

  const filteredTasksBase = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const filterKey = assigneeFilter === "__all__" ? undefined : normalizeKey(assigneeFilter)

    return tasks.filter((task) => {
      if (filterKey && normalizeKey(task.assigneeName) !== filterKey) return false
      if (!q) return true
      const hay = `${task.title}\n${task.description ?? ""}\n${task.assigneeName}`.toLowerCase()
      return hay.includes(q)
    })
  }, [tasks, query, assigneeFilter])

  const contextTasks = React.useMemo(() => {
    if (nav === "meu-dia") return filteredTasksBase.filter((t) => !t.completedAt && isToday(t.dueDate, todayDay))
    if (nav === "plano") return filteredTasksBase.filter((t) => (t.planId ?? DEFAULT_PLAN_ID) === selectedPlanId)
    return filteredTasksBase
  }, [filteredTasksBase, nav, selectedPlanId, todayDay])

  function openCreateTask() {
    setTaskDialogMode("create")
    setTaskDialogTask(null)
    setTaskDialogOpen(true)
  }

  function openEditTask(task: PlannerTask) {
    setTaskDialogMode("edit")
    setTaskDialogTask(task)
    setTaskDialogOpen(true)
  }

  function openCreatePlan() {
    setPlanDialogMode("create")
    setPlanDialogPlan(null)
    setPlanDialogOpen(true)
  }

  function openEditPlan(plan: PlannerPlan) {
    setPlanDialogMode("edit")
    setPlanDialogPlan(plan)
    setPlanDialogOpen(true)
  }

  async function createTask(draft: TaskDraft) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/planner/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          planId: draft.planId,
          assigneeName: draft.assigneeName,
          assigneeEmail: draft.assigneeEmail || undefined,
          dueDate: draft.dueDate || undefined,
          priority: draft.priority,
          notifyEmail: draft.notifyEmail,
        }),
      })
      const json = await readJson<CreateTaskResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({
          kind: "error",
          text: json && !json.ok ? json.error ?? "Não foi possível criar a atividade." : "Não foi possível criar a atividade.",
        })
        return
      }

      setTasks((prev) => [...prev, json.task])
      if (json.task.assigneeEmail) {
        setAssignees((prev) => {
          const key = normalizeKey(json.task.assigneeName)
          const next = prev.filter((a) => normalizeKey(a.name) !== key)
          next.push({ name: json.task.assigneeName, email: json.task.assigneeEmail!, updatedAt: new Date().toISOString() })
          next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
          return next
        })
      }

      const emailMsg =
        json.email?.ok === true
          ? "E-mail enviado."
          : json.email?.ok === false
            ? `E-mail não enviado: ${json.email.error ?? "erro"}`
            : draft.notifyEmail && json.task.assigneeEmail
              ? "E-mail não enviado."
              : "Sem e-mail."
      setMessage({ kind: "ok", text: `Atividade criada. ${emailMsg}` })
      setTaskDialogOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function updateTask(task: PlannerTask, draft: TaskDraft) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/planner/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          planId: draft.planId,
          assigneeName: draft.assigneeName,
          assigneeEmail: draft.assigneeEmail || "",
          dueDate: draft.dueDate || "",
          priority: draft.priority,
          notifyEmail: draft.notifyEmail,
        }),
      })
      const json = await readJson<UpdateTaskResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({
          kind: "error",
          text: json && !json.ok ? json.error ?? "Não foi possível salvar a atividade." : "Não foi possível salvar a atividade.",
        })
        return
      }

      setTasks((prev) => prev.map((t) => (t.id === json.task.id ? json.task : t)))
      setMessage({ kind: "ok", text: "Atividade salva." })
      setTaskDialogOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function toggleCompleted(task: PlannerTask) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/planner/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completed: !task.completedAt }),
      })
      const json = await readJson<ToggleTaskResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({
          kind: "error",
          text: json && !json.ok ? json.error ?? "Não foi possível atualizar a atividade." : "Não foi possível atualizar a atividade.",
        })
        return
      }
      setTasks((prev) => prev.map((t) => (t.id === json.task.id ? json.task : t)))
    } finally {
      setBusy(false)
    }
  }

  async function deleteTask(task: PlannerTask) {
    const ok = window.confirm(`Excluir a atividade "${task.title}"?`)
    if (!ok) return

    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/planner/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" })
      const json = await readJson<DeleteTaskResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({
          kind: "error",
          text: json && !json.ok ? json.error ?? "Não foi possível excluir a atividade." : "Não foi possível excluir a atividade.",
        })
        return
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      setMessage({ kind: "ok", text: "Atividade excluída." })
    } finally {
      setBusy(false)
    }
  }

  async function createPlan(draft: PlanDraft) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/planner/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      })
      const json = await readJson<CreatePlanResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({ kind: "error", text: json && !json.ok ? json.error ?? "Não foi possível criar o plano." : "Não foi possível criar o plano." })
        return
      }

      setPlans((prev) => [...prev, json.plan])
      setMessage({ kind: "ok", text: "Plano criado." })
      setPlanDialogOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function updatePlan(plan: PlannerPlan, draft: PlanDraft) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/planner/plans/${encodeURIComponent(plan.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      })
      const json = await readJson<UpdatePlanResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({ kind: "error", text: json && !json.ok ? json.error ?? "Não foi possível salvar o plano." : "Não foi possível salvar o plano." })
        return
      }

      setPlans((prev) => prev.map((p) => (p.id === json.plan.id ? json.plan : p)))
      setMessage({ kind: "ok", text: "Plano salvo." })
      setPlanDialogOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function deletePlan(plan: PlannerPlan) {
    const ok = window.confirm(`Excluir o plano "${plan.name}"? As tarefas serão movidas para o plano padrão.`)
    if (!ok) return

    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/planner/plans/${encodeURIComponent(plan.id)}`, { method: "DELETE" })
      const json = await readJson<DeletePlanResponse>(res)
      if (!json || !res.ok || !json.ok) {
        setMessage({ kind: "error", text: json && !json.ok ? json.error ?? "Não foi possível excluir o plano." : "Não foi possível excluir o plano." })
        return
      }

      setPlans((prev) => prev.filter((p) => p.id !== plan.id))
      setTasks((prev) => prev.map((t) => ((t.planId ?? DEFAULT_PLAN_ID) === plan.id ? { ...t, planId: DEFAULT_PLAN_ID } : t)))
      setMessage({ kind: "ok", text: "Plano excluído." })
    } finally {
      setBusy(false)
    }
  }

  const pageTitle = React.useMemo(() => {
    if (nav === "meu-dia") return "Meu Dia"
    if (nav === "meus-planos") return "Meus planos"
    if (nav === "plano") return selectedPlan?.name ?? "Plano"
    return "Minhas Tarefas"
  }, [nav, selectedPlan])

  const showViewToggle = nav === "minhas-tarefas" || nav === "plano"
  const showSearchAndFilters = nav === "minhas-tarefas" || nav === "plano"
  const showNewTaskButton = nav === "minhas-tarefas" || nav === "plano" || nav === "meu-dia"

  const mainContent = (() => {
    if (nav === "meus-planos") {
      return (
        <PlannerPlansGrid
          plans={plans}
          planTaskCounts={planTaskCounts}
          defaultPlanId={DEFAULT_PLAN_ID}
          busy={busy}
          onOpenPlan={(id) => {
            setNav("plano")
            setSelectedPlanId(id)
          }}
          onCreatePlan={openCreatePlan}
          onEditPlan={openEditPlan}
          onDeletePlan={deletePlan}
        />
      )
    }

    if (nav === "meu-dia") {
      return (
        <PlannerGrid
          tasks={contextTasks}
          plansById={plansById}
          todayDay={todayDay}
          busy={busy}
          onToggleCompleted={toggleCompleted}
          onEditTask={openEditTask}
          onDeleteTask={deleteTask}
        />
      )
    }

    if (view === "grade") {
      return (
        <PlannerGrid
          tasks={contextTasks}
          plansById={plansById}
          todayDay={todayDay}
          busy={busy}
          onToggleCompleted={toggleCompleted}
          onEditTask={openEditTask}
          onDeleteTask={deleteTask}
        />
      )
    }

    return (
      <PlannerBoard
        tasks={contextTasks}
        plansById={plansById}
        todayDay={todayDay}
        busy={busy}
        onToggleCompleted={toggleCompleted}
        onEditTask={openEditTask}
        onDeleteTask={deleteTask}
      />
    )
  })()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <PlannerSidebar
        nav={nav}
        selectedPlanId={nav === "plano" ? selectedPlanId : null}
        pinnedPlans={pinnedPlans}
        planTaskCounts={planTaskCounts}
        onOpenMyDay={() => setNav("meu-dia")}
        onOpenMyTasks={() => setNav("minhas-tarefas")}
        onOpenPlans={() => setNav("meus-planos")}
        onOpenPlan={(id) => {
          setNav("plano")
          setSelectedPlanId(id)
        }}
        onCreatePlan={openCreatePlan}
        busy={busy}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{pageTitle}</div>
            {nav === "meu-dia" ? <div className="text-sm text-muted-foreground">{formatDueDate(new Date().toISOString().slice(0, 10))}</div> : null}
          </div>

          <div className="flex items-center gap-2">
            {showViewToggle ? (
              <ButtonGroup className="rounded-lg border border-gray-200 bg-white/70 p-1">
                <Button
                  size="sm"
                  variant={view === "grade" ? "default" : "ghost"}
                  className={cn(view === "grade" ? "bg-orange-600 hover:bg-orange-600 text-white" : "text-gray-700")}
                  onClick={() => setView("grade")}
                  disabled={busy}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Grade
                </Button>
                <Button
                  size="sm"
                  variant={view === "quadro" ? "default" : "ghost"}
                  className={cn(view === "quadro" ? "bg-orange-600 hover:bg-orange-600 text-white" : "text-gray-700")}
                  onClick={() => setView("quadro")}
                  disabled={busy}
                >
                  <KanbanSquare className="w-4 h-4 mr-2" />
                  Quadro
                </Button>
              </ButtonGroup>
            ) : null}

            {showNewTaskButton ? (
              <Button
                onClick={openCreateTask}
                disabled={busy}
                className="gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
                Nova atividade
              </Button>
            ) : null}
          </div>
        </div>

        {message ? (
          <div
            className={cn(
              "text-sm rounded-xl border px-4 py-2",
              message.kind === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
            )}
          >
            {message.text}
          </div>
        ) : null}

        {showSearchAndFilters ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, descrição ou comprador..."
                className="pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
            </div>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por comprador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os compradores</SelectItem>
                {assigneeOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {mainContent}
      </section>

      <PlannerTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        mode={taskDialogMode}
        task={taskDialogMode === "edit" ? taskDialogTask : null}
        assignees={assignees}
        plans={plans}
        defaultPlanId={DEFAULT_PLAN_ID}
        initialPlanId={nav === "plano" ? selectedPlanId : DEFAULT_PLAN_ID}
        busy={busy}
        onSubmit={(draft) => {
          if (taskDialogMode === "edit" && taskDialogTask) return updateTask(taskDialogTask, draft)
          return createTask(draft)
        }}
      />

      <PlannerPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        mode={planDialogMode}
        plan={planDialogMode === "edit" ? planDialogPlan : null}
        busy={busy}
        onSubmit={(draft) => {
          if (planDialogMode === "edit" && planDialogPlan) return updatePlan(planDialogPlan, draft)
          return createPlan(draft)
        }}
      />
    </div>
  )
}
