import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    // useSearchParams() inside LoginForm (used to read the post-login redirect
    // target) requires a Suspense boundary, or `next build` fails to prerender
    // this route.
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
