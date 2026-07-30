'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TabDef {
  id: string
  label: string
  content: React.ReactNode
}

// All tab content is rendered up front (just hidden via CSS), not
// conditionally mounted — every section's data already came from the same
// server-side fetch in the page, so there's no extra cost to keeping it in
// the DOM, and switching tabs never re-triggers a fetch or shows a flash of
// empty state.
export function AdminTabs({ tabs, defaultTabId }: { tabs: TabDef[]; defaultTabId?: string }) {
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id)

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active === tab.id
                ? 'border-[#706af1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} hidden={active !== tab.id}>
          {tab.content}
        </div>
      ))}
    </div>
  )
}
