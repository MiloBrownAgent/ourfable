'use client'
import { useEffect, useRef, useState } from 'react'

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

interface CountUpNumberProps {
  target: number
  duration?: number
  label?: string
  inline?: boolean
  fontSize?: number
}

export default function CountUpNumber({ target, duration = 1200, label, inline = false, fontSize }: CountUpNumberProps) {
  const [count, setCount] = useState(0)
  const [landed, setLanded] = useState(false)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    setCount(0)
    setLanded(false)
    startRef.current = null

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutExpo(progress)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(target)
        requestAnimationFrame(() => setLanded(true))
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  // Inline mode: render just the number as an inline span (no label, no gold bar)
  if (inline) {
    return (
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: fontSize ?? 11,
        fontWeight: 600,
        color: 'var(--sage)',
        letterSpacing: '0.18em',
        fontVariantNumeric: 'tabular-nums',
        textTransform: 'uppercase' as const,
      }}>
        {count.toLocaleString()}
      </span>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: fontSize ? `${fontSize}px` : 'clamp(3.5rem, 12vw, 8rem)',
        fontWeight: 700,
        color: 'var(--green)',
        letterSpacing: '-0.025em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        display: 'block',
        animation: landed ? 'countLand 0.45s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
      }}>
        {count.toLocaleString()}
      </span>
      <span style={{
        display: 'block',
        height: 2,
        width: '100%',
        background: 'linear-gradient(90deg, transparent 0%, var(--gold) 15%, #D4B483 50%, var(--gold) 85%, transparent 100%)',
        borderRadius: 2,
        marginTop: 12,
        transform: landed ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left center',
        opacity: landed ? 1 : 0,
        transition: 'transform 0.65s cubic-bezier(0.22,1,0.36,1) 0.15s, opacity 0.3s ease 0.15s',
      }} />
      {label && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.6875rem, 1.5vw, 0.8125rem)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--green)',
          opacity: 0.55,
          letterSpacing: '0.14em',
          textTransform: 'lowercase' as const,
          marginTop: 18,
          display: 'block',
        }}>{label}</span>
      )}
    </div>
  )
}
