"use client"

import * as React from "react"
import type { NavMode } from "@/components/planner/planner-helpers"
import type { PlannerPlan } from "@/lib/types/planner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlanDot } from "@/components/planner/plan-badges"
import { FolderKanban, KanbanSquare, Plus, Sun } from "lucide-react"

export function PlannerSidebar({
  nav,
  selectedPlanId,
  pinnedPlans,
  planTaskCounts,
  onOpenMyDay,
  onOpenMyTasks,
  onOpenPlans,
  onOpenPlan,
  onCreatePlan,
  busy,
}: {
  nav: NavMode
  selectedPlanId: string | null
  pinnedPlans: PlannerPlan[]
  planTaskCounts: Map<string, number>
  onOpenMyDay: () => void
  onOpenMyTasks: () => void
  onOpenPlans: () => void
  onOpenPlan: (planId: string) => void
  onCreatePlan: () => void
  busy?: boolean
}) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm p-3 h-fit lg:sticky lg:top-24">
      <div className="px-3 py-2 font-semibold flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-orange-600" />
        Planner
      </div>

      <div className="mt-2 space-y-1">
        <button
          type="button"
          onClick={onOpenMyDay}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
            nav === "meu-dia" ? "bg-orange-50 text-orange-700 border border-orange-100" : "hover:bg-gray-100 text-gray-700",
          )}
        >
          <Sun className="w-4 h-4" />
          Meu Dia
        </button>

        <button
          type="button"
          onClick={onOpenMyTasks}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
            nav === "minhas-tarefas"
              ? "bg-orange-50 text-orange-700 border border-orange-100"
              : "hover:bg-gray-100 text-gray-700",
          )}
        >
          <KanbanSquare className="w-4 h-4" />
          Minhas Tarefas
        </button>

        <button
          type="button"
          onClick={onOpenPlans}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
            nav === "meus-planos"
              ? "bg-orange-50 text-orange-700 border border-orange-100"
              : "hover:bg-gray-100 text-gray-700",
          )}
        >
          <FolderKanban className="w-4 h-4" />
          Meus planos
        </button>
      </div>

      <div className="mt-4 px-3 py-2 text-xs font-semibold text-muted-foreground">Fixado</div>
      <div className="space-y-1">
        {pinnedPlans.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum plano fixado</div>
        ) : (
          pinnedPlans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onOpenPlan(plan.id)}
              className={cn(
                "w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                nav === "plano" && selectedPlanId === plan.id
                  ? "bg-orange-50 text-orange-700 border border-orange-100"
                  : "hover:bg-gray-100 text-gray-700",
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <PlanDot plan={plan} />
                <span className="truncate">{plan.name}</span>
              </span>
              <Badge variant="secondary" className="rounded-full">
                {planTaskCounts.get(plan.id) ?? 0}
              </Badge>
            </button>
          ))
        )}
      </div>

      <div className="mt-4 px-3">
        <Button variant="outline" onClick={onCreatePlan} disabled={busy} className="w-full gap-2 justify-center">
          <Plus className="w-4 h-4" />
          Novo plano
        </Button>
      </div>
    </aside>
  )
}

