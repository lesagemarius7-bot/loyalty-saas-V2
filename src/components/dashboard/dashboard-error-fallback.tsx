// Rendered by dashboard pages that catch their own data-fetching errors,
// instead of letting an exception bubble up to (dashboard)/error.tsx — a page
// showing "this section failed to load" while the sidebar still works beats
// losing the whole dashboard shell over one query.
export function DashboardErrorFallback({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
