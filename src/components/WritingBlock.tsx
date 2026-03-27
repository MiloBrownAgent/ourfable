'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface WritingBlockProps {
  childFirst: string
  familyId?: string
  locked?: boolean
  onSealed?: () => void
}

const MOCK_CIRCLE = [
  { id: '1', name: 'Grandma' },
  { id: '2', name: 'Grandpa' },
  { id: '3', name: 'Uncle Paul' },
  { id: '4', name: 'Aunt Katie' },
]

export default function WritingBlock({ childFirst, familyId, locked = false, onSealed }: WritingBlockProps) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [mode, setMode] = useState<'seal' | 'dispatch'>('seal')

  // Seal/submit state
  const [sealing, setSealing] = useState(false)
  const [sealed, setSealed] = useState(false)
  const [sealError, setSealError] = useState('')
  const [validationMsg, setValidationMsg] = useState('')
  const [dispatchMsg, setDispatchMsg] = useState('')

  // Attachments
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([])
  const [video, setVideo] = useState<{ name: string } | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Voice recording
  const [recording, setRecording] = useState(false)
  const [recorderError, setRecorderError] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Dispatch
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  // Voice recording
  const startRecording = useCallback(async () => {
    setRecorderError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioDuration(recordingTime)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      setRecorderError('Microphone access denied. Please allow access in your browser settings.')
    }
  }, [recordingTime])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const removeAudio = () => {
    setAudioBlob(null)
    setAudioDuration(0)
    setAudioPlaying(false)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
  }

  const toggleAudioPlay = () => {
    if (!audioBlob) return
    if (audioPlaying && audioRef.current) {
      audioRef.current.pause()
      setAudioPlaying(false)
    } else {
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.onended = () => setAudioPlaying(false)
      audio.play()
      audioRef.current = audio
      setAudioPlaying(true)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // Photo handling
  const onPhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos = Array.from(files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  // Video handling
  const onVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideo({ name: file.name })
    e.target.value = ''
  }

  // Dispatch member selection
  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }
  const toggleAll = () => {
    if (selectedMembers.length === MOCK_CIRCLE.length) setSelectedMembers([])
    else setSelectedMembers(MOCK_CIRCLE.map(m => m.id))
  }

  const handleDispatchClick = () => {
    if (locked) {
      setShowUpgradeModal(true)
    } else {
      setMode('dispatch')
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const hasContent = text.trim().length > 0 || photos.length > 0 || video !== null || audioBlob !== null

  const getContentType = (): string => {
    if (audioBlob) return 'voice'
    if (photos.length > 0) return 'photo'
    if (video) return 'video'
    return 'letter'
  }

  const handleSeal = async () => {
    setSealError('')
    setValidationMsg('')
    if (!hasContent) {
      setValidationMsg('Write something first')
      setTimeout(() => setValidationMsg(''), 2500)
      return
    }
    if (!familyId) return
    setSealing(true)
    try {
      const res = await fetch('/api/ourfable/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'ourfable:submitVaultEntry',
          args: {
            familyId,
            memberName: 'Parent',
            contentType: getContentType(),
            isSealed: true,
          },
          type: 'mutation',
        }),
      })
      if (!res.ok) throw new Error('Failed to seal')
      setSealed(true)
      setTimeout(() => {
        setSealed(false)
        setText('')
        setPhotos([])
        setVideo(null)
        removeAudio()
        onSealed?.()
      }, 2000)
    } catch {
      setSealError('Something went wrong. Please try again.')
    } finally {
      setSealing(false)
    }
  }

  const handleDispatch = () => {
    setDispatchMsg('Coming soon')
    setTimeout(() => setDispatchMsg(''), 2500)
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      boxShadow: '0 2px 24px rgba(26,26,24,0.07), 0 1px 4px rgba(26,26,24,0.04)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* 3px top accent bar */}
      <div style={{
        height: 3,
        background: focused
          ? 'linear-gradient(90deg, var(--green) 0%, var(--sage) 50%, var(--gold) 100%)'
          : 'linear-gradient(90deg, rgba(74,94,76,0.4) 0%, rgba(107,143,111,0.3) 50%, rgba(200,168,122,0.35) 100%)',
        transition: 'background 300ms ease',
        boxShadow: focused ? '0 0 12px rgba(74,94,76,0.25)' : 'none',
      }} />

      {/* Recording overlay */}
      {recording && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          background: 'rgba(253,251,247,0.97)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          borderRadius: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#E53E3E',
            animation: 'recordPulse 1.5s ease-in-out infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTime(recordingTime)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Recording...
          </span>
          <button
            onClick={stopRecording}
            style={{
              padding: '10px 28px',
              borderRadius: 100,
              border: '1.5px solid #E53E3E',
              background: 'transparent',
              color: '#E53E3E',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Stop recording
          </button>
        </div>
      )}

      <div style={{ padding: '20px 24px 0' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--green)',
          }}>
            Dear {childFirst},
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--sage)',
            letterSpacing: '0.04em',
          }}>
            {today}
          </span>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Something happened today I want you to know about…"
          rows={6}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            lineHeight: 1.85,
            color: 'var(--text)',
            background: 'transparent',
            padding: 0,
            caretColor: 'var(--sage)',
          }}
        />

        {/* Recorder error */}
        {recorderError && (
          <p style={{ fontSize: 12, color: '#E53E3E', marginTop: 8 }}>{recorderError}</p>
        )}

        {/* Audio pill */}
        {audioBlob && !recording && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 100,
            background: 'var(--green-light)', border: '1px solid var(--green-border)',
            marginTop: 8,
          }}>
            <button onClick={toggleAudioPlay} style={{
              width: 24, height: 24, borderRadius: '50%', border: 'none',
              background: 'var(--green)', color: '#fff', fontSize: 10,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {audioPlaying ? '⏸' : '▶'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(audioDuration)}
            </span>
            <button onClick={removeAudio} style={{
              background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, padding: '0 2px',
            }}>×</button>
          </div>
        )}

        {/* Photo thumbnails */}
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative', width: 48, height: 48, borderRadius: 6, overflow: 'hidden' }}>
                <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                  fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Video pill */}
        {video && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 100,
            background: 'var(--sage-dim)', border: '1px solid var(--sage-border)',
            marginTop: 10,
          }}>
            <span style={{ fontSize: 13 }}>🎥</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>{video.name}</span>
            <button onClick={() => setVideo(null)} style={{
              background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, padding: '0 2px',
            }}>×</button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPhotosSelected} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onVideoSelected} />

      {/* Attachment strip */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 24px',
        borderTop: '0.5px solid var(--border)',
      }}>
        {[
          { label: 'Voice', icon: '🎙', onClick: () => audioBlob ? undefined : startRecording() },
          { label: 'Photo', icon: '📷', onClick: () => photoRef.current?.click() },
          { label: 'Video', icon: '🎥', onClick: () => videoRef.current?.click() },
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 100,
            border: '1px solid var(--border)',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--text-3)',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sage)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--sage)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'
          }}
          >
            <span style={{ fontSize: 13 }}>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Dispatch member selector */}
      {mode === 'dispatch' && !locked && (
        <div style={{
          padding: '12px 24px',
          borderTop: '0.5px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Send to
            </span>
            <button onClick={toggleAll} style={{
              background: 'none', border: 'none', fontSize: 11, color: 'var(--sage)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', textDecoration: 'underline',
            }}>
              {selectedMembers.length === MOCK_CIRCLE.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOCK_CIRCLE.map(m => (
              <button key={m.id} onClick={() => toggleMember(m.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100,
                border: selectedMembers.includes(m.id) ? '1.5px solid var(--green)' : '1px solid var(--border)',
                background: selectedMembers.includes(m.id) ? 'var(--green-light)' : 'transparent',
                color: selectedMembers.includes(m.id) ? 'var(--green)' : 'var(--text-3)',
                fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer',
                fontWeight: selectedMembers.includes(m.id) ? 500 : 400,
                transition: 'all 150ms ease',
              }}>
                {selectedMembers.includes(m.id) ? '✓ ' : ''}{m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderTop: '0.5px solid var(--border)',
        background: 'var(--bg)',
      }}>
        {/* Seal / Dispatch pill toggle */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          border: '1px solid var(--border)',
          borderRadius: 100,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setMode('seal')}
            style={{
              padding: '6px 14px',
              border: 'none',
              background: mode === 'seal' ? 'var(--green)' : 'transparent',
              color: mode === 'seal' ? '#fff' : 'var(--text-3)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: mode === 'seal' ? 600 : 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}
          >
            Seal
          </button>
          <button
            onClick={handleDispatchClick}
            style={{
              padding: '6px 14px',
              border: 'none',
              background: mode === 'dispatch' && !locked ? 'var(--green)' : 'transparent',
              color: mode === 'dispatch' && !locked ? '#fff' : 'var(--text-3)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: mode === 'dispatch' && !locked ? 600 : 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              opacity: locked ? 0.4 : 1,
              transition: 'background 150ms, color 150ms',
            }}
          >
            Dispatch
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {locked && (
            <span style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 100,
              background: 'var(--gold-dim)',
              color: 'var(--gold)',
              border: '0.5px solid var(--gold-border)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.06em',
            }}>
              ⭐ Plus
            </span>
          )}
          <button
            className="btn-primary"
            onClick={mode === 'seal' ? handleSeal : handleDispatch}
            disabled={sealing || sealed}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              opacity: sealing ? 0.6 : 1,
              transition: 'opacity 150ms',
              animation: validationMsg ? 'shake 400ms ease' : 'none',
            }}
          >
            {sealed ? '✓ Sealed' : sealing ? 'Sealing…' : mode === 'seal' ? 'Seal letter' : 'Send dispatch'}
          </button>
        </div>
      </div>

      {/* Validation / error / dispatch messages */}
      {(validationMsg || sealError || dispatchMsg) && (
        <div style={{
          padding: '8px 24px 12px',
          background: 'var(--bg)',
        }}>
          {validationMsg && (
            <p style={{ fontSize: 12, color: 'var(--sage)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>{validationMsg}</p>
          )}
          {sealError && (
            <p style={{ fontSize: 12, color: '#E53E3E', fontFamily: 'var(--font-body)' }}>{sealError}</p>
          )}
          {dispatchMsg && (
            <p style={{ fontSize: 12, color: 'var(--sage)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>{dispatchMsg}</p>
          )}
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '32px 28px',
            maxWidth: 320,
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                position: 'absolute',
                top: 12, right: 16,
                background: 'none', border: 'none', color: '#fff',
                fontSize: 20, cursor: 'pointer',
              }}
            >×</button>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--green)',
              marginBottom: 12,
            }}>
              Upgrade to Plus
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-2)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              Dispatch letters, photos, and voice memos directly to your circle. Upgrade to unlock this feature.
            </p>
            <a
              href={familyId ? `/${familyId}/settings` : '#upgrade'}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: 14, textDecoration: 'none' }}
            >
              Upgrade now
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
