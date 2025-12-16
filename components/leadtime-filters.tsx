import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

export function LeadTimeFilters({ year, month }: { year: number; month: number }) {
  const monthValue = `${year}-${pad2(month)}`

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="leadtime-month" className="text-xs uppercase tracking-wider mb-2">
            Mês (referência)
          </Label>
          <Input id="leadtime-month" type="month" value={monthValue} disabled />
        </div>

        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="leadtime-year" className="text-xs uppercase tracking-wider mb-2">
            Ano
          </Label>
          <Input id="leadtime-year" type="number" value={year} disabled />
        </div>
      </div>
    </Card>
  )
}

