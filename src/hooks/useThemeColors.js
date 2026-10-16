import { useEffect, useState } from 'react'
import { onThemeChange, readThemeColors } from '../lib/theme.js'

export default function useThemeColors() {
  const [colors, setColors] = useState(readThemeColors)
  useEffect(() => onThemeChange(setColors), [])
  return colors
}
