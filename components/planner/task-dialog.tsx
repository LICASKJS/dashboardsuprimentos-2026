"use client"

import * as React from "react"
import type { PlannerAssignee, PlannerPlan, PlannerPriority, PlannerTask } from "@/lib/types/planner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type TaskDraft = {
  title: string
  description: string
  planId: string
  assigneeName: string
  assigneeEmail: string
  dueDate: string
  priority: PlannerPriority
  notifyEmail: boolean
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase()
}

function getAssigneeEmail(assignees: PlannerAssignee[], name: string) {
  const key = normalizeKey(name)
  if (!key) return ""
  const match = assignees.find((assignee) => normalizeKey(assignee.name) === key)
  return match?.email ?? ""
}

function taskToDraft({
  task,
  assignees,
  mode,
  defaultPlanId,
  initialPlanId,
}: {
  task: PlannerTask | null
  assignees: PlannerAssignee[]
  mode: "create" | "edit"
  defaultPlanId: string
  initialPlanId?: string
}): TaskDraft {
  if (!task) {
    return {
      title: "",
      description: "",
      planId: initialPlanId ?? defaultPlanId,
      assigneeName: "",
      assigneeEmail: "",
      dueDate: "",
      priority: "media",
      notifyEmail: true,
    }
  }

  return {
    title: task.title,
    description: task.description ?? "",
    planId: task.planId ?? defaultPlanId,
    assigneeName: task.assigneeName,
    assigneeEmail: task.assigneeEmail ?? getAssigneeEmail(assignees, task.assigneeName),
    dueDate: task.dueDate ?? "",
    priority: task.priority ?? "media",
    notifyEmail: mode === "create",
  }
}

export function PlannerTaskDialog({
  open,
  onOpenChange,
  mode,
  task,
  assignees,
  plans,
  defaultPlanId,
  initialPlanId,
  onSubmit,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  task: PlannerTask | null
  assignees: PlannerAssignee[]
  plans: PlannerPlan[]
  defaultPlanId: string
  initialPlanId?: string
  onSubmit: (draft: TaskDraft) => void
  busy?: boolean
}) {
  const [draft, setDraft] = React.useState<TaskDraft>(() =>
    taskToDraft({ task, assignees, mode, defaultPlanId, initialPlanId }),
  )

  React.useEffect(() => {
    setDraft(taskToDraft({ task, assignees, mode, defaultPlanId, initialPlanId }))
  }, [task, assignees, mode, open, defaultPlanId, initialPlanId])

  const title = mode === "create" ? "Nova atividade" : "Editar atividade"
  const description = mode === "create" ? "Crie uma atividade para um comprador e envie notificação por e-mail." : ""
  const submitLabel = mode === "create" ? "Criar" : "Salvar"

  const planOptions = plans.length ? plans : [{ id: defaultPlanId, name: "Atividades", color: "green", pinned: true, createdAt: "", updatedAt: "" }]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="planner-title">Título</Label>
            <Input
              id="planner-title"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex.: Cobrar cotação do fornecedor X"
            />
          </div>

          <div className="grid gap-2">
            <Label>Plano</Label>
            <Select value={draft.planId} onValueChange={(value) => setDraft((prev) => ({ ...prev, planId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {planOptions.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planner-description">Descrição (opcional)</Label>
            <Textarea
              id="planner-description"
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes, links, observações..."
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="planner-assignee">Comprador</Label>
              <Input
                id="planner-assignee"
                list="planner-assignees"
                value={draft.assigneeName}
                onChange={(e) => {
                  const name = e.target.value
                  setDraft((prev) => ({
                    ...prev,
                    assigneeName: name,
                    assigneeEmail: prev.assigneeEmail ? prev.assigneeEmail : getAssigneeEmail(assignees, name),
                  }))
                }}
                placeholder="Nome do comprador"
              />
              <datalist id="planner-assignees">
                {assignees.map((assignee) => (
                  <option key={`${assignee.name}-${assignee.email}`} value={assignee.name} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="planner-email">E-mail do comprador</Label>
              <Input
                id="planner-email"
                value={draft.assigneeEmail}
                onChange={(e) => setDraft((prev) => ({ ...prev, assigneeEmail: e.target.value }))}
                placeholder="comprador@empresa.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="planner-due">Prazo</Label>
              <Input
                id="planner-due"
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Select
                value={draft.priority}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, priority: value as PlannerPriority }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="grid gap-0.5">
                <Label>Notificar por e-mail</Label>
                <span className="text-xs text-muted-foreground">Envia para o comprador ao salvar</span>
              </div>
              <Switch
                checked={draft.notifyEmail}
                onCheckedChange={(checked) => setDraft((p) => ({ ...p, notifyEmail: checked }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit(draft)}
            disabled={busy || !draft.title.trim() || !draft.assigneeName.trim() || !draft.planId.trim()}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { TaskDraft }

