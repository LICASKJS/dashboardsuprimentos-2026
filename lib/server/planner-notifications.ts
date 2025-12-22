import "server-only"

import type { PlannerTask } from "@/lib/types/planner"
import { sendMail, type MailSendResult } from "@/lib/server/mailer"

function formatDueDate(value: string | undefined) {
  if (!value) return "Sem data"
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

function formatPriority(value: PlannerTask["priority"]) {
  if (value === "alta") return "Alta"
  if (value === "baixa") return "Baixa"
  return "Média"
}

function buildTaskEmailText(task: PlannerTask, plannerUrl: string, kind: "created" | "updated") {
  const actionLabel = kind === "created" ? "recebeu uma nova atividade" : "teve uma atividade atualizada"
  const lines = [
    `Olá, ${task.assigneeName}!`,
    "",
    `Você ${actionLabel} no Planner do Suprimentos.`,
    "",
    `Título: ${task.title}`,
    `Prazo: ${formatDueDate(task.dueDate)}`,
    `Prioridade: ${formatPriority(task.priority)}`,
  ]

  if (task.description) {
    lines.push("", "Descrição:", task.description)
  }

  lines.push("", `Acesse o Planner: ${plannerUrl}`)
  return lines.join("\n")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function buildTaskEmailHtml(task: PlannerTask, plannerUrl: string, kind: "created" | "updated") {
  const actionLabel = kind === "created" ? "Nova atividade atribuída" : "Atividade atualizada"
  const descriptionHtml = task.description
    ? `<p style="margin: 16px 0 8px; font-weight: 600;">Descrição</p><pre style="white-space: pre-wrap; background: #f6f7f9; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(task.description)}</pre>`
    : ""

  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'; line-height: 1.4; color: #111827;">
    <h2 style="margin: 0 0 12px;">${escapeHtml(actionLabel)}</h2>
    <p style="margin: 0 0 16px;">Olá, <strong>${escapeHtml(task.assigneeName)}</strong>!</p>
    <p style="margin: 0 0 16px;">${kind === "created" ? "Você recebeu uma nova atividade" : "Uma atividade foi atualizada"} no Planner do Suprimentos.</p>
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #ffffff;">
      <p style="margin: 0 0 8px;"><strong>Título:</strong> ${escapeHtml(task.title)}</p>
      <p style="margin: 0 0 8px;"><strong>Prazo:</strong> ${escapeHtml(formatDueDate(task.dueDate))}</p>
      <p style="margin: 0;"><strong>Prioridade:</strong> ${escapeHtml(formatPriority(task.priority))}</p>
      ${descriptionHtml}
      <p style="margin: 16px 0 0;"><a href="${escapeHtml(plannerUrl)}" style="display: inline-block; background: #f97316; color: #ffffff; padding: 10px 14px; border-radius: 10px; text-decoration: none; font-weight: 600;">Abrir Planner</a></p>
    </div>
    <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px;">Mensagem automática. Não responda este e-mail.</p>
  </div>
  `.trim()
}

export async function notifyPlannerTask({
  task,
  origin,
  kind,
}: {
  task: PlannerTask
  origin: string
  kind: "created" | "updated"
}): Promise<MailSendResult> {
  if (!task.assigneeEmail) return { ok: false, error: "Atividade sem e-mail do comprador." }

  const plannerUrl = `${origin.replace(/\/$/, "")}/planner?task=${encodeURIComponent(task.id)}`
  const prefix = kind === "created" ? "Nova atividade" : "Atividade atualizada"
  const subject = `[Planner] ${prefix}: ${task.title}`

  return sendMail({
    to: task.assigneeEmail,
    subject,
    text: buildTaskEmailText(task, plannerUrl, kind),
    html: buildTaskEmailHtml(task, plannerUrl, kind),
  })
}

