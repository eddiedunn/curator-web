import { useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

/**
 * Simple theme hook that returns the current theme
 * For now, we'll just use system/light as default
 * This can be extended later with a theme provider
 */
export function useTheme() {
  const [theme] = useState<Theme>('light')

  return { theme }
}
