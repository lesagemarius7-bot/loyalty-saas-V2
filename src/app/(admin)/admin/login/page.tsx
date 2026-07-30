import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getCurrentUserAdminStatus } from '@/lib/auth/admin-guard'
import { AdminLoginForm } from '@/components/admin/admin-login-form'

// Deliberately NOT under (admin)/admin/(protected)/layout.tsx's
// requireSuperAdmin() guard — that layout redirects non-admins to
// /dashboard, which would make this login page itself unreachable by
// anyone not already a super admin. This page does its own status check
// instead, with three distinct outcomes rather than a binary allow/deny.
export default async function AdminLoginPage() {
  const status = await getCurrentUserAdminStatus()

  // Already a confirmed super admin with an active session — skip the form.
  if (status.loggedIn && status.isSuperAdmin) {
    redirect('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">👑 Espace Super Administrateur Loyalty</h1>
          <p className="mt-1 text-sm text-slate-400">Réservé à l’équipe de gestion de la plateforme.</p>
        </div>

        {status.loggedIn && !status.isSuperAdmin ? (
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
            <p className="text-sm text-red-400">Cet espace est réservé à l’administration de la plateforme.</p>
            <Link href="/dashboard" className="text-sm font-medium text-indigo-400 underline">
              Retour à mon tableau de bord
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <AdminLoginForm />
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          Vous êtes commerçant ?{' '}
          <Link href="/login" className="text-slate-400 underline">
            Connexion espace commerçant
          </Link>
        </p>
      </div>
    </div>
  )
}
