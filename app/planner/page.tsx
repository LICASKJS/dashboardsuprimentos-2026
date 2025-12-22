import { PlannerClient } from "@/components/planner/planner-client"
import { listPlannerAssignees, listPlannerPlans, listPlannerTasks } from "@/lib/server/planner-store"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function PlannerPage() {
  const [tasks, assignees, plans] = await Promise.all([listPlannerTasks(), listPlannerAssignees(), listPlannerPlans()])

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Planner</h1>
          <p className="text-muted-foreground">Crie e acompanhe atividades dos compradores, com notificação por e-mail.</p>
        </div>

        <PlannerClient initialTasks={tasks} initialAssignees={assignees} initialPlans={plans} />
      </div>
    </main>
  )
}
