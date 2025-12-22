"use client"

import { useEffect } from "react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto glass-card p-6">
        <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground mb-4">
          O servidor retornou um erro ao renderizar esta pagina.
        </p>

        {error.digest ? (
          <p className="text-xs text-muted-foreground mb-6">
            Codigo do erro: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  )
}
