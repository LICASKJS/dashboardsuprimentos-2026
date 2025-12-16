export const BUYER_BLANK_LABEL = "Em branco"

const EXCLUDED_BUYER_SUBSTRINGS = [
  "thiago",
  "rose",
  "bruna",
  "joice",
  "savio",
  "anderson",
  "jamerson",
  "pedro",
]

export function shouldExcludeBuyer(value: string | undefined) {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return false
  return EXCLUDED_BUYER_SUBSTRINGS.some((substring) => normalized.includes(substring))
}

export function isExcludedBuyerName(value: string) {
  return shouldExcludeBuyer(value)
}

export function normalizeBuyerLabel(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : BUYER_BLANK_LABEL
}
