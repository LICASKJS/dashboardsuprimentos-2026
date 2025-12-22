"use client"

import * as React from "react"
import type { PlannerPlan } from "@/lib/types/planner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlanDot, PLAN_COLOR_STYLES } from "@/components/planner/plan-badges"

export function PlannerPlansGrid({
  plans,
  planTaskCounts,
  defaultPlanId,
  busy,
  onOpenPlan,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
}: {
  plans: PlannerPlan[]
  planTaskCounts: Map<string, number>
  defaultPlanId: string
  busy?: boolean
  onOpenPlan: (planId: string) => void
  onCreatePlan: () => void
  onEditPlan: (plan: PlannerPlan) => void
  onDeletePlan: (plan: PlannerPlan) => void
}) {
  const plansSorted = React.useMemo(() => {
    return [...plans].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
  }, [plans])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{plans.length} planos</div>
        <Button onClick={onCreatePlan} disabled={busy} className="gap-2">
          + Novo plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plansSorted.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <button type="button" onClick={() => onOpenPlan(plan.id)} className="w-full text-left p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <PlanDot plan={plan} />
                  <div className="font-semibold truncate">{plan.name}</div>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {planTaskCounts.get(plan.id) ?? 0}
                </Badge>
              </div>

              <div className="mt-3">
                <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold", PLAN_COLOR_STYLES[plan.color].badge)}>
                  {plan.pinned ? "FIXADO" : "PLANO"}
                </span>
              </div>
            </button>

            <div className="px-4 pb-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => onEditPlan(plan)} disabled={busy}>
                Editar
              </Button>
              {plan.id !== defaultPlanId ? (
                <Button variant="destructive" size="sm" onClick={() => onDeletePlan(plan)} disabled={busy}>
                  Excluir
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Padrão</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

