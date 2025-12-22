"use client"

import * as React from "react"
import type { PlannerPlan, PlannerPlanColor } from "@/lib/types/planner"
import { cn } from "@/lib/utils"

export const PLAN_COLOR_STYLES: Record<PlannerPlanColor, { badge: string; dot: string }> = {
  green: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-600" },
  blue: { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-600" },
  purple: { badge: "bg-purple-100 text-purple-800", dot: "bg-purple-600" },
  pink: { badge: "bg-pink-100 text-pink-800", dot: "bg-pink-600" },
  red: { badge: "bg-red-100 text-red-800", dot: "bg-red-600" },
  orange: { badge: "bg-orange-100 text-orange-800", dot: "bg-orange-600" },
  gray: { badge: "bg-gray-100 text-gray-800", dot: "bg-gray-600" },
}

export function PlanBadge({ plan, className }: { plan: PlannerPlan; className?: string }) {
  const styles = PLAN_COLOR_STYLES[plan.color]
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold", styles.badge, className)}>
      {plan.name.toUpperCase()}
    </span>
  )
}

export function PlanDot({ plan }: { plan: PlannerPlan }) {
  const styles = PLAN_COLOR_STYLES[plan.color]
  return <span className={cn("h-2.5 w-2.5 rounded-full", styles.dot)} aria-hidden="true" />
}

