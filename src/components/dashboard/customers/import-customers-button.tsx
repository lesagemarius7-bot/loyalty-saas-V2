'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImportCustomersModal } from '@/components/dashboard/customers/import-customers-modal'

export function ImportCustomersButton({ apiKey }: { apiKey: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        📥 Importer une liste
      </Button>

      {open && <ImportCustomersModal apiKey={apiKey} onClose={() => setOpen(false)} onImported={() => setOpen(false)} />}
    </>
  )
}
