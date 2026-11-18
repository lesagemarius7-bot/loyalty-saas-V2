// Registers the real Inter font face (the main app uses next/font's Inter —
// see loyalty-saas/src/app/layout.tsx) so text renders with actual Inter
// metrics instead of falling back to the render environment's system sans.
// Imported once, for its side effect, from Root.tsx before any composition
// mounts.
import { loadFont } from '@remotion/google-fonts/Inter'

loadFont('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] })
