import Link from "next/link"
import { Users, GitBranch, Clock, AlertTriangle } from "lucide-react"

const cards = [
  {
    title: "Compradores",
    description: "Acompanhe a performance dos compradores",
    href: "/compradores",
    icon: Users,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Processos",
    description: "Análise detalhada dos processos",
    href: "/processos",
    icon: GitBranch,
    color: "from-primary to-accent",
  },
  {
    title: "Desempenho",
    description: "Valor, itens e lead times",
    href: "/desempenho",
    icon: Clock,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Itens Atrasados",
    description: "Itens com prazo vencido",
    href: "/itens-atrasados",
    icon: AlertTriangle,
    color: "from-red-500 to-red-600",
  },
]

export function QuickAccessCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`}
          />

          <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} mb-4`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{card.title}</h3>

            <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

