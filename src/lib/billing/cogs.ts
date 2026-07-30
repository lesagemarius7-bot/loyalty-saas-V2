// Documented, editable cost assumptions for the Finance page's Gross Margin
// indicator. This app has no real per-send billing data from Resend/APNs/FCM
// (see lib/analytics/admin-overview.ts's emailSuccessRatePct comment —
// outcomes aren't persisted anywhere), so the estimate combines one real
// signal (push notification volume, from notification_deliveries) with flat
// constants instead of fabricating precise per-merchant costs. Update these
// two numbers as real provider invoices come in.
export const COST_PER_PUSH_EUR = 0.0004
export const ESTIMATED_HOSTING_EUR_PER_MONTH = 45

export function estimateMonthlyCogs(pushSentThisMonth: number): number {
  return Math.round((pushSentThisMonth * COST_PER_PUSH_EUR + ESTIMATED_HOSTING_EUR_PER_MONTH) * 100) / 100
}
