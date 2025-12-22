"use client"

import * as React from "react"
import type { PlannerPlan, PlannerTask } from "@/lib/types/planner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlanBadge } from "@/components/planner/plan-badges"
import { COLUMNS, dueTagClasses, formatDueDate, getAvatarInitial, getColumnKey, parseDateOnly } from "@/components/planner/planner-helpers"
import { CalendarDays, CheckCircle2, Circle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

export function PlannerBoard({
  tasks,
  plansById,
  todayDay,
  busy,
  onToggleCompleted,
  onEditTask,
  onDeleteTask,
}: {
  tasks: PlannerTask[]
  plansById: Map<string, PlannerPlan>
  todayDay: Date
  busy?: boolean
  onToggleCompleted: (task: PlannerTask) => void
  onEditTask: (task: PlannerTask) => void
  onDeleteTask: (task: PlannerTask) => void
}) {
  const boardColumns = React.useMemo(() => {
    const groups = new Map<(typeof COLUMNS)[number]["key"], PlannerTask[]>()
    for (const c of COLUMNS) groups.set(c.key, [])

    for (const task of tasks) {
      const key = getColumnKey(task, todayDay)
      groups.get(key)!.push(task)
    }

    const bySort = (a: PlannerTask, b: PlannerTask) => {
      const aDue = a.dueDate ? parseDateOnly(a.dueDate)?.getTime() ?? 0 : Number.MAX_SAFE_INTEGER
      const bDue = b.dueDate ? parseDateOnly(b.dueDate)?.getTime() ?? 0 : Number.MAX_SAFE_INTEGER
      if (aDue !== bDue) return aDue - bDue
      return b.updatedAt.localeCompare(a.updatedAt)
    }

    for (const [key, list] of groups) {
      if (key === "concluidas") {
        list.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
      } else {
        list.sort(bySort)
      }
    }

    return COLUMNS.map((c) => ({ ...c, tasks: groups.get(c.key)! }))
  }, [tasks, todayDay])

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max">
        {boardColumns.map((col) => (
          <div
            key={col.key}
            className="w-[320px] flex-shrink-0 rounded-xl border border-gray-200 bg-white/60 backdrop-blur-sm shadow-sm"
          >
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="font-semibold text-sm">{col.title}</div>
              <Badge variant="secondary" className="rounded-full px-2.5">
                {col.tasks.length}
              </Badge>
            </div>

            <div className="p-3 space-y-3">
              {col.tasks.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-8 text-center">Sem atividades</div>
              ) : null}

              {col.tasks.map((task) => {
                const plan = plansById.get(task.planId ?? "default")
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow",
                      task.completedAt ? "opacity-70" : "",
                    )}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        {plan ? <PlanBadge plan={plan} /> : null}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditTask(task)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDeleteTask(task)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-2 text-xs text-blue-700 font-medium">{task.assigneeName}</div>

                      <div className="mt-2 flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleCompleted(task)}
                          disabled={busy}
                          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={task.completedAt ? "Marcar como pendente" : "Marcar como concluída"}
                        >
                          {task.completedAt ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditTask(task)}>
                          <div
                            className={cn(
                              "text-sm font-semibold leading-snug break-words",
                              task.completedAt ? "line-through text-muted-foreground" : "",
                            )}
                          >
                            {task.title}
                          </div>

                          {task.description ? (
                            <div className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap max-h-16 overflow-hidden">
                              {task.description}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        {task.dueDate ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium",
                              dueTagClasses(task.dueDate, todayDay),
                            )}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground"> </span>
                        )}

                        <span
                          className="h-8 w-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-semibold"
                          title={task.assigneeEmail ?? task.assigneeName}
                        >
                          {getAvatarInitial(task.assigneeName)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

