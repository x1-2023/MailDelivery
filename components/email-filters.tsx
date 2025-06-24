"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"

interface EmailFilter {
  type: "from" | "subject" | "date" | "size"
  operator: "contains" | "equals" | "before" | "after" | "greater" | "less"
  value: string
}

interface EmailFiltersProps {
  onFiltersChange: (filters: EmailFilter[]) => void
}

export function EmailFilters({ onFiltersChange }: EmailFiltersProps) {
  const [filters, setFilters] = useState<EmailFilter[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const addFilter = () => {
    const newFilter: EmailFilter = {
      type: "from",
      operator: "contains",
      value: "",
    }
    const updatedFilters = [...filters, newFilter]
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const updateFilter = (index: number, field: keyof EmailFilter, value: string) => {
    const updatedFilters = filters.map((filter, i) => (i === index ? { ...filter, [field]: value } : filter))
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index)
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
        <Filter className="h-4 w-4 mr-2" />
        Filters {filters.length > 0 && `(${filters.length})`}
      </Button>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-3">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Select value={filter.type} onValueChange={(value) => updateFilter(index, "type", value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="from">From</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filter.operator} onValueChange={(value) => updateFilter(index, "operator", value)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                  <SelectItem value="greater">Greater</SelectItem>
                  <SelectItem value="less">Less</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter value..."
                value={filter.value}
                onChange={(e) => updateFilter(index, "value", e.target.value)}
                className="flex-1"
              />

              <Button variant="ghost" size="sm" onClick={() => removeFilter(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addFilter}>
            Add Filter
          </Button>
        </div>
      )}
    </div>
  )
}
