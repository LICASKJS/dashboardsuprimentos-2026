import { cn } from "@/lib/utils"
import { AlertTriangle, Package, ShoppingCart, Users } from "lucide-react"

export function DashboardStats({
  totalCompradores,
  pedidosMes,
  itensEmAberto,
  itensAtrasados,
}: {
  totalCompradores: number
  pedidosMes: number
  itensEmAberto: number
  itensAtrasados: number
}) {
  const stats = [
    { label: "Compradores (ano)", value: totalCompradores.toLocaleString("pt-BR"), icon: Users, color: "text-blue-500" },
    { label: "Pedidos (mês)", value: pedidosMes.toLocaleString("pt-BR"), icon: ShoppingCart, color: "text-primary" },
    { label: "Itens em Aberto (mês)", value: itensEmAberto.toLocaleString("pt-BR"), icon: Package, color: "text-accent" },
    { label: "Itens Atrasados (mês)", value: itensAtrasados.toLocaleString("pt-BR"), icon: AlertTriangle, color: "text-red-500" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
      {stats.map((stat) => (
        <div key={stat.label} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-8 h-8", stat.color)} />
              <div className={cn("text-3xl font-bold", stat.color)}>{stat.value}</div>
            </div>
            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
