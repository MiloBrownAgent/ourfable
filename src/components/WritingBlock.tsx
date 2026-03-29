'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'

interface WritingBlockProps {
  childFirst: string
  familyId?: string
  locked?: boolean
  onSealed?: () => void
}

interface CircleMember { _id: string; name: string; email?: string }

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
  const [recordingVideo, setRecordingVideo] = useState(false)
  const [previewingVideo, setPreviewingVideo] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [recorderError, setRecorderError] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoCameraRef = useRef<HTMLVideoElement | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const photoFilesRef = useRef<File[]>([])
  const pendingStreamRef = useRef<MediaStream | null>(null)
  const recordingTimeRef = useRef(0)

  // Dispatch
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([])
  const [parentName, setParentName] = useState<string>('Parent')

  useEffect(() => {
    if (!familyId) return
    fetch('/api/ourfable/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'ourfable:listCircle', args: { familyId } }),
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.value)) setCircleMembers(d.value) })
      .catch(() => {})
    // Fetch parent name from ourfable_families
    fetch('/api/ourfable/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'ourfable:getOurFableFamilyById', args: { familyId } }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.value?.parentNames) setParentName(d.value.parentNames)
      })
      .catch(() => {})
  }, [familyId])

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  // ── Detect supported mime types (Safari vs Chrome/Firefox) ──
  const getAudioMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return ''
    // Check mp4/aac FIRST — Safari doesn't support webm
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
    if (MediaRecorder.isTypeSupported('audio/aac')) return 'audio/aac'
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
    return '' // let browser pick default
  }

  const getVideoMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return ''
    // Check mp4 FIRST — Safari only supports mp4, not webm
    if (MediaRecorder.isTypeSupported('video/mp4')) return 'video/mp4'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) return 'video/webm;codecs=vp9,opus'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) return 'video/webm;codecs=vp8,opus'
    if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm'
    return '' // let browser pick default
  }

  // Voice recording
  const startRecording = useCallback(async () => {
    setRecorderError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getAudioMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)
      const actualMime = recorder.mimeType || mimeType || 'audio/mp4'
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime })
        setAudioBlob(blob)
        setAudioDuration(recordingTimeRef.current)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current = recorder
      // Safari doesn't reliably support timeslice — omit it
      recorder.start()
      setRecording(true)
      setRecordingTime(0)
      recordingTimeRef.current = 0
      timerRef.current = setInterval(() => {
        setRecordingTime(t => { recordingTimeRef.current = t + 1; return t + 1 })
      }, 1000)
    } catch (err) {
      console.error('[WritingBlock] Audio recording error:', err)
      setRecorderError('Microphone access denied. Please allow access in your browser settings.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    setRecordingVideo(false)
    setPreviewingVideo(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (videoCameraRef.current) videoCameraRef.current.srcObject = null
  }, [])

  // Callback ref for video element — attaches stream immediately when element mounts
  // IMPORTANT: do NOT null out pendingStreamRef here — startVideoRecording needs it
  const videoCameraRefCallback = useCallback((el: HTMLVideoElement | null) => {
    videoCameraRef.current = el
    if (el && pendingStreamRef.current) {
      el.srcObject = pendingStreamRef.current
      el.muted = true
      el.setAttribute('playsinline', '')
      el.setAttribute('webkit-playsinline', '')
      el.play().catch(() => {})
    }
  }, [])

  // Step 1: Open camera preview (no recording yet)
  const openVideoPreview = useCallback(async () => {
    setRecorderError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      pendingStreamRef.current = stream
      setPreviewingVideo(true)
    } catch (err) {
      console.error('[WritingBlock] Camera preview error:', err)
      setRecorderError('Camera access denied. Please allow access in your browser settings.')
    }
  }, [])

  // Step 2: Start actual recording (camera already open from preview)
  const startVideoRecording = useCallback(() => {
    const stream = pendingStreamRef.current
    if (!stream) return

    const mimeType = getVideoMimeType()
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
    const recorder = new MediaRecorder(stream, options)
    const actualMime = recorder.mimeType || mimeType || 'video/mp4'
    const ext = actualMime.includes('mp4') ? 'mp4' : 'webm'
    chunksRef.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      if (videoCameraRef.current) videoCameraRef.current.srcObject = null
      pendingStreamRef.current = null
      const blob = new Blob(chunksRef.current, { type: actualMime })
      setVideoBlob(blob)
      setVideo({ name: `video-${Date.now()}.${ext}` })
      setAudioDuration(recordingTimeRef.current)
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setPreviewingVideo(false)
    setRecordingVideo(true)
    setRecordingTime(0)
    recordingTimeRef.current = 0
    timerRef.current = setInterval(() => {
      setRecordingTime(t => { recordingTimeRef.current = t + 1; return t + 1 })
    }, 1000)
  }, [])

  // Cancel preview without recording
  const cancelVideoPreview = useCallback(() => {
    if (pendingStreamRef.current) {
      pendingStreamRef.current.getTracks().forEach(t => t.stop())
      pendingStreamRef.current = null
    }
    if (videoCameraRef.current) videoCameraRef.current.srcObject = null
    setPreviewingVideo(false)
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
    // Store all photo files for upload
    photoFilesRef.current = [...photoFilesRef.current, ...Array.from(files)]
    e.target.value = ''
  }

  // Video file upload (from file picker, not camera recording)
  const onVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideo({ name: file.name })
    setVideoBlob(file)
    e.target.value = ''
  }

  // Dispatch member selection
  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }
  const toggleAll = () => {
    if (selectedMembers.length === circleMembers.length) setSelectedMembers([])
    else setSelectedMembers(circleMembers.map(m => m._id))
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

  // Fallback: if callback ref didn't fire (re-render timing), connect stream via effect
  useEffect(() => {
    if ((previewingVideo || recordingVideo) && videoCameraRef.current && pendingStreamRef.current) {
      const el = videoCameraRef.current
      if (!el.srcObject) {
        el.srcObject = pendingStreamRef.current
        el.muted = true
        el.setAttribute('playsinline', '')
        el.setAttribute('webkit-playsinline', '')
        el.play().catch(() => {})
      }
    }
  }, [previewingVideo, recordingVideo])

  const hasContent = text.trim().length > 0 || photos.length > 0 || video !== null || audioBlob !== null

  const getContentType = (): string => {
    if (audioBlob) return 'voice'
    if (videoBlob || video) return 'video'
    if (photos.length > 0) return 'photo'
    return 'letter'
  }

  const uploadMedia = async (blob: Blob, mimeType: string): Promise<string | undefined> => {
    try {
      setUploadStatus('Preparing upload…')
      console.log(`[WritingBlock] Uploading ${mimeType}, size: ${(blob.size / 1024).toFixed(0)}KB`)

      if (blob.size === 0) {
        console.error('[WritingBlock] Blob is empty — recording failed')
        setUploadStatus('')
        setSealError('Recording was empty. Please try again.')
        return undefined
      }

      // 1. Get presigned upload URL from Convex
      const urlRes = await fetch('/api/ourfable/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'ourfable:generateUploadUrl', args: {}, type: 'mutation' }),
      })
      const urlData = await urlRes.json()
      const uploadUrl = urlData.value as string
      if (!uploadUrl) throw new Error('No upload URL')

      // 2. Upload file to Convex storage
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1)
      setUploadStatus(`Uploading ${sizeMB}MB…`)

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      })
      const uploadData = await uploadRes.json()
      setUploadStatus('Saving…')
      console.log(`[WritingBlock] Upload complete, storageId: ${uploadData.storageId}`)
      return uploadData.storageId
    } catch (err) {
      console.error('[WritingBlock] Media upload failed:', err)
      setUploadStatus('')
      return undefined
    }
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
      // Upload media if present
      let mediaStorageId: string | undefined
      let mediaMimeType: string | undefined

      if (videoBlob) {
        mediaMimeType = videoBlob.type || 'video/mp4'
        mediaStorageId = await uploadMedia(videoBlob, mediaMimeType)
      } else if (audioBlob) {
        mediaMimeType = audioBlob.type || 'audio/mp4'
        mediaStorageId = await uploadMedia(audioBlob, mediaMimeType)
      } else if (photos.length > 0 && photoFilesRef.current.length > 0) {
        mediaMimeType = photoFilesRef.current[0].type || 'image/jpeg'
        mediaStorageId = await uploadMedia(photoFilesRef.current[0], mediaMimeType)
      }

      const contentType = getContentType()
      const entryArgs: Record<string, unknown> = {
        familyId,
        memberName: parentName,
        contentType,
        isSealed: true,
      }

      // Include text body for letters (and as caption for media)
      if (text.trim()) {
        entryArgs.body = text.trim()
      }

      // Include media reference
      if (mediaStorageId) {
        entryArgs.mediaStorageId = mediaStorageId
        entryArgs.mediaMimeType = mediaMimeType
      }

      const res = await fetch('/api/ourfable/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'ourfable:sealParentLetter',
          args: entryArgs,
          type: 'mutation',
        }),
      })
      if (!res.ok) throw new Error('Failed to seal')
      setSealed(true)
      setTimeout(() => {
        setSealed(false)
        setText('')
        setPhotos([]); photoFilesRef.current = []
        setVideo(null)
        setVideoBlob(null)
        removeAudio()
        onSealed?.()
      }, 2000)
    } catch {
      setSealError('Something went wrong. Please try again.')
    } finally {
      setSealing(false)
    }
  }

  const handleDispatch = async () => {
    setDispatchMsg('')
    setValidationMsg('')
    if (!hasContent) {
      setValidationMsg('Write something first')
      setTimeout(() => setValidationMsg(''), 2500)
      return
    }
    if (selectedMembers.length === 0) {
      setValidationMsg('Select at least one person to send to')
      setTimeout(() => setValidationMsg(''), 2500)
      return
    }
    if (!familyId) return
    setSealing(true)
    try {
      // Upload media if present
      let mediaUrls: string[] = []
      let mediaType: string | undefined

      if (videoBlob) {
        mediaType = 'video'
        const storageId = await uploadMedia(videoBlob, videoBlob.type || 'video/mp4')
        if (storageId) {
          const urlRes = await fetch('/api/ourfable/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'ourfable:getMediaUrl', args: { storageId }, type: 'query' }),
          })
          const urlData = await urlRes.json()
          if (urlData.value) mediaUrls.push(urlData.value)
        }
      } else if (audioBlob) {
        mediaType = 'voice'
        const storageId = await uploadMedia(audioBlob, audioBlob.type || 'audio/mp4')
        if (storageId) {
          const urlRes = await fetch('/api/ourfable/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'ourfable:getMediaUrl', args: { storageId }, type: 'query' }),
          })
          const urlData = await urlRes.json()
          if (urlData.value) mediaUrls.push(urlData.value)
        }
      } else if (photos.length > 0 && photoFilesRef.current.length > 0) {
        mediaType = 'photo'
        const totalPhotos = photoFilesRef.current.length
        for (let i = 0; i < totalPhotos; i++) {
          const file = photoFilesRef.current[i]
          setUploadStatus(`Uploading photo ${i + 1}/${totalPhotos}…`)
          const storageId = await uploadMedia(file, file.type || 'image/jpeg')
          if (storageId) {
            const urlRes = await fetch('/api/ourfable/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: 'ourfable:getMediaUrl', args: { storageId }, type: 'query' }),
            })
            const urlData = await urlRes.json()
            if (urlData.value) mediaUrls.push(urlData.value)
          }
        }
      }

      const res = await fetch('/api/ourfable/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'ourfable:createOutgoing',
          args: {
            familyId,
            subject: 'Dispatch',
            body: text.trim(),
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            mediaType,
            sentToAll: selectedMembers.length === circleMembers.length,
            sentToMemberIds: selectedMembers,
            sentByName: 'Parent',
            recipientCount: selectedMembers.length,
          },
          type: 'mutation',
        }),
      })
      if (!res.ok) throw new Error('Failed to send dispatch')
      setDispatchMsg('Dispatch sent!')
      setTimeout(() => {
        setDispatchMsg('')
        setText('')
        setPhotos([]); photoFilesRef.current = []
        setVideo(null)
        setVideoBlob(null)
        removeAudio()
        setMode('seal')
        onSealed?.()
      }, 2000)
    } catch {
      setSealError('Something went wrong. Please try again.')
    } finally {
      setSealing(false)
    }
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

      {/* Video camera preview — shown ABOVE the overlay so it's visible on iOS */}
      {(previewingVideo || recordingVideo) && (
        <video
          ref={videoCameraRefCallback}
          muted
          playsInline
          autoPlay
          // @ts-expect-error webkit-playsinline is needed for older iOS Safari
          webkit-playsinline=""
          style={{ width: '100%', maxHeight: 200, background: '#000', display: 'block', transform: 'scaleX(-1)', position: 'relative', zIndex: 11 }}
        />
      )}

      {/* Video preview controls — camera open, not recording yet */}
      {previewingVideo && !recordingVideo && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '16px 24px', background: 'var(--bg)',
          borderTop: '0.5px solid var(--border)',
        }}>
          <button onClick={cancelVideoPreview} style={{
            padding: '10px 24px', borderRadius: 100,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-3)', fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={startVideoRecording} style={{
            padding: '10px 24px', borderRadius: 100,
            border: 'none', background: '#E53E3E',
            color: '#fff', fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
            Start recording
          </button>
        </div>
      )}

      {/* Recording overlay — for audio: full overlay; for video: controls below the preview */}
      {(recording || recordingVideo) && (
        <div style={{
          position: recordingVideo ? 'relative' : 'absolute',
          inset: recordingVideo ? undefined : 0,
          zIndex: 10,
          background: 'rgba(253,251,247,0.97)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          borderRadius: recordingVideo ? 0 : 12,
          padding: recordingVideo ? '20px 0' : undefined,
          minHeight: recordingVideo ? undefined : '100%',
        }}>
          {!recordingVideo && (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#E53E3E',
              animation: 'recordPulse 1.5s ease-in-out infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {(previewingVideo || recordingVideo) && (
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E53E3E', animation: 'recordPulse 1.5s ease-in-out infinite' }} />
            )}
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatTime(recordingTime)}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {recordingVideo ? 'Recording video...' : 'Recording voice...'}
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
            <VideoIcon size={13} strokeWidth={1.5} />
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
          { label: 'Voice', icon: <Mic size={13} strokeWidth={1.5} />, onClick: () => audioBlob ? undefined : startRecording() },
          { label: 'Photo', icon: <ImageIcon size={13} strokeWidth={1.5} />, onClick: () => photoRef.current?.click() },
          { label: 'Video', icon: <VideoIcon size={13} strokeWidth={1.5} />, onClick: () => videoBlob ? undefined : openVideoPreview() },
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
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Dispatch member selector */}
      {mode === 'dispatch' && !locked && (
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '0.5px solid var(--border)',
          background: 'var(--bg)',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Send to
            </span>
            <button onClick={toggleAll} style={{
              background: 'none', border: 'none', fontSize: 11, color: 'var(--sage)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', textDecoration: 'underline',
            }}>
              {selectedMembers.length === circleMembers.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {circleMembers.map(m => (
              <button key={m._id} onClick={() => toggleMember(m._id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100,
                border: selectedMembers.includes(m._id) ? '1.5px solid var(--green)' : '1px solid var(--border)',
                background: selectedMembers.includes(m._id) ? 'var(--green-light)' : 'transparent',
                color: selectedMembers.includes(m._id) ? 'var(--green)' : 'var(--text-3)',
                fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer',
                fontWeight: selectedMembers.includes(m._id) ? 500 : 400,
                transition: 'all 150ms ease',
              }}>
                {selectedMembers.includes(m._id) ? '✓ ' : ''}{m.name}
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
        flexWrap: 'wrap',
        gap: 12,
        padding: '16px 24px',
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
            {sealed ? '✓ Sealed' : sealing ? (uploadStatus || (mode === 'seal' ? 'Sealing…' : 'Sending…')) : mode === 'seal' ? 'Seal letter' : 'Send dispatch'}
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
