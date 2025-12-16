import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function BuyerFilters({ year }: { year: number }) {
  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="filter-year" className="text-xs uppercase tracking-wider mb-2">
            Ano (somente ano atual)
          </Label>
          <Input id="filter-year" type="number" value={year} disabled />
        </div>
      </div>
    </Card>
  )
}

