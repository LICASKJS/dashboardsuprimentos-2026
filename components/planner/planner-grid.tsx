"use client"

import * as React from "react"
import type { PlannerPlan, PlannerTask } from "@/lib/types/planner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlanBadge } from "@/components/planner/plan-badges"
import { dueTagClasses, formatDueDate } from "@/components/planner/planner-helpers"
import { CalendarDays, CheckCircle2, Circle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

export function PlannerGrid({
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
  return (
    <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Atividade</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Comprador</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                Sem atividades
              </TableCell>
            </TableRow>
          ) : null}

          {tasks.map((task) => {
            const plan = plansById.get(task.planId ?? "default")
            return (
              <TableRow key={task.id}>
                <TableCell className="w-10">
                  <button
                    type="button"
                    onClick={() => onToggleCompleted(task)}
                    disabled={busy}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={task.completedAt ? "Marcar como pendente" : "Marcar como concluída"}
                  >
                    {task.completedAt ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                </TableCell>

                <TableCell className="max-w-[420px]">
                  <button type="button" onClick={() => onEditTask(task)} className="text-left w-full" disabled={busy}>
                    <div className={cn("font-medium truncate", task.completedAt ? "line-through text-muted-foreground" : "")}>
                      {task.title}
                    </div>
                    {task.description ? <div className="text-xs text-muted-foreground truncate">{task.description}</div> : null}
                  </button>
                </TableCell>

                <TableCell>{plan ? <PlanBadge plan={plan} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">{task.assigneeName}</TableCell>

                <TableCell>
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
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-sm">{task.priority === "alta" ? "Alta" : task.priority === "baixa" ? "Baixa" : "Média"}</TableCell>

                <TableCell className="w-10">
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

