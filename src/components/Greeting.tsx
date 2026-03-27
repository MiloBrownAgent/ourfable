'use client'
import { useState, useEffect } from 'react'

export default function Greeting() {
  const [text, setText] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setText('Good morning')
    else if (hour >= 12 && hour < 17) setText('Good afternoon')
    else if (hour >= 17 && hour < 21) setText('Good evening')
    else setText('Goodnight')
  }, [])

  if (!text) return <p style={{ height: 14 }} /> // placeholder to prevent layout shift

  return (
    <p style={{
      fontFamily: 'var(--font-body)',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.22em',
      textTransform: 'uppercase' as const,
      color: 'var(--sage)',
      marginBottom: 16,
    }}>
      {text}
    </p>
  )
}
