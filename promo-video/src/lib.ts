import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Ported verbatim from the main app's src/lib/utils.ts so components copied
// from loyalty-saas behave identically here.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
