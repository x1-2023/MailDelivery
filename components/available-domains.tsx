"use client"

import { useState, useEffect } from "react"
import { Globe, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function AvailableDomains() {
  const [domains, setDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains')
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains || [])
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || domains.length <= 1) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              Available Domains
              <Badge variant="secondary" className="text-xs">
                {domains.length} domains
              </Badge>
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
              You can create email addresses with any of these domains:
            </p>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 text-sm font-mono font-medium text-blue-900 dark:text-blue-300"
                >
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  @{domain}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
