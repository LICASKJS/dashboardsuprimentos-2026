"use client"

import * as React from "react"
import type { PlannerPlan, PlannerPlanColor } from "@/lib/types/planner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type PlanDraft = {
  name: string
  color: PlannerPlanColor
  pinned: boolean
}

const COLORS: { value: PlannerPlanColor; label: string }[] = [
  { value: "green", label: "Verde" },
  { value: "blue", label: "Azul" },
  { value: "purple", label: "Roxo" },
  { value: "pink", label: "Rosa" },
  { value: "red", label: "Vermelho" },
  { value: "orange", label: "Laranja" },
  { value: "gray", label: "Cinza" },
]

function planToDraft(plan: PlannerPlan | null): PlanDraft {
  if (!plan) return { name: "", color: "green", pinned: true }
  return { name: plan.name, color: plan.color, pinned: plan.pinned }
}

export function PlannerPlanDialog({
  open,
  onOpenChange,
  mode,
  plan,
  onSubmit,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  plan: PlannerPlan | null
  onSubmit: (draft: PlanDraft) => void
  busy?: boolean
}) {
  const [draft, setDraft] = React.useState<PlanDraft>(() => planToDraft(plan))

  React.useEffect(() => {
    setDraft(planToDraft(plan))
  }, [plan, open])

  const title = mode === "create" ? "Novo plano" : "Editar plano"
  const description = mode === "create" ? "Crie um plano para organizar as atividades." : ""
  const submitLabel = mode === "create" ? "Criar" : "Salvar"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="planner-plan-name">Nome</Label>
            <Input
              id="planner-plan-name"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex.: RNEST PREDIAL"
            />
          </div>

          <div className="grid gap-2">
            <Label>Cor</Label>
            <Select value={draft.color} onValueChange={(value) => setDraft((p) => ({ ...p, color: value as PlannerPlanColor }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="grid gap-0.5">
              <Label>Fixar</Label>
              <span className="text-xs text-muted-foreground">Aparece na área “Fixado”</span>
            </div>
            <Switch checked={draft.pinned} onCheckedChange={(checked) => setDraft((p) => ({ ...p, pinned: checked }))} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(draft)} disabled={busy || !draft.name.trim()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { PlanDraft }

