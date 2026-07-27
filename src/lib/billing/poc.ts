export interface PocStatus {
  daysElapsed: number
  daysRemaining: number
  billingStartDate: Date
  progressPercentage: number
  isOver: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Pure function on purpose — every field the POC widget renders (elapsed/
// remaining/start date/progress) is derived here from real merchant data
// (poc_start_date, poc_duration_days), not hardcoded, so it can be exercised
// against arbitrary dates (fresh signup, mid-trial, expired) without a
// database or a running server.
export function computePocStatus(pocStartDate: string, pocDurationDays: number, now: Date = new Date()): PocStatus {
  const start = new Date(pocStartDate)
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY))
  const daysRemaining = Math.max(0, pocDurationDays - daysElapsed)
  const billingStartDate = new Date(start.getTime() + pocDurationDays * MS_PER_DAY)
  const progressPercentage = Math.min(100, Math.round((daysElapsed / pocDurationDays) * 100))

  return { daysElapsed, daysRemaining, billingStartDate, progressPercentage, isOver: daysRemaining === 0 }
}
