import "server-only"

import nodemailer from "nodemailer"

export type MailSendResult = { ok: true } | { ok: false; error: string }

function normalizeOptionalEnv(name: string) {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  return trimmed ? trimmed : undefined
}

function getOptionalEnv(...names: string[]) {
  for (const name of names) {
    const value = normalizeOptionalEnv(name)
    if (value) return value
  }
  return undefined
}

function getRequiredEnv(...names: string[]) {
  const value = getOptionalEnv(...names)
  if (!value) throw new Error(`Variavel de ambiente nao configurada: ${names.join(" ou ")}.`)
  return value
}

function parsePort(value: string | undefined) {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function isSmtpConfigured() {
  return Boolean(getOptionalEnv("SMTP_HOST", "SMTP_SERVER"))
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<MailSendResult> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP_HOST/SMTP_SERVER nao configurado." }
  }

  try {
    const host = getRequiredEnv("SMTP_HOST", "SMTP_SERVER")
    const port = parsePort(getOptionalEnv("SMTP_PORT")) ?? 587
    const secure = (getOptionalEnv("SMTP_SECURE") ?? "").toLowerCase() === "true" || port === 465

    const user = getOptionalEnv("SMTP_USER")
    const pass = getOptionalEnv("SMTP_PASS", "SMTP_PASSWORD")

    const fromName = getOptionalEnv("SMTP_FROM_NAME")
    const fromEmail = getOptionalEnv("SMTP_FROM") ?? user ?? `no-reply@${host}`
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      requireTLS: port === 587 ? true : undefined,
    })

    await transporter.sendMail({ from, to, subject, text, html })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}

