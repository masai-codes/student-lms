import { useEffect, useRef } from 'react'

const WINDOW_SECONDS = 15
const BAR_INTERVAL_MS = 120
const MAX_BARS = Math.round((WINDOW_SECONDS * 1000) / BAR_INTERVAL_MS)
const CANVAS_HEIGHT = 24

/**
 * Scrolling amplitude-bar visualizer over the last ~15s of the live mic
 * stream — an oscilloscope snapshot (raw `getByteTimeDomainData` redrawn
 * every frame) reads as a single flat sliver, not a recording history, so
 * this samples amplitude on an interval and scrolls a bar per sample instead.
 * The post-recording preview (wavesurfer.js, in `useInterviewRecorder`) takes
 * over once a blob exists.
 */
export function LiveWaveform({ mediaStream }: { mediaStream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    const ctx = canvasEl?.getContext('2d')
    if (!canvasEl || !ctx) return

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const audioContext = new AudioContextCtor()
    const source = audioContext.createMediaStreamSource(mediaStream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)

    const timeDomainData = new Uint8Array(analyser.frequencyBinCount)
    const bars: Array<number> = []
    let lastSampleAt = 0
    let frameId: number
    // CSS pixel dimensions — the canvas's backing buffer is sized to these
    // times devicePixelRatio, and all drawing below happens in this space
    // (via ctx.scale), so bars stay crisp instead of a low-res buffer being
    // stretched to fit a much wider `flex-1` container.
    let cssWidth = 0
    let cssHeight = CANVAS_HEIGHT

    function resizeCanvas() {
      if (!canvasEl) return
      const rect = canvasEl.getBoundingClientRect()
      cssWidth = rect.width || cssWidth
      cssHeight = rect.height || cssHeight
      const dpr = window.devicePixelRatio || 1
      canvasEl.width = Math.max(1, Math.round(cssWidth * dpr))
      canvasEl.height = Math.max(1, Math.round(cssHeight * dpr))
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()
    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvasEl)

    function sampleAmplitude(): number {
      analyser.getByteTimeDomainData(timeDomainData)
      let sumSquares = 0
      for (const sample of timeDomainData) {
        const normalized = (sample - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / timeDomainData.length)
      return Math.min(1, rms * 4) // gentle boost — raw mic RMS reads very small
    }

    const drawFrame = () => {
      frameId = requestAnimationFrame(drawFrame)

      const now = performance.now()
      if (now - lastSampleAt >= BAR_INTERVAL_MS) {
        lastSampleAt = now
        bars.push(sampleAmplitude())
        if (bars.length > MAX_BARS) bars.shift()
      }

      const barWidth = cssWidth / MAX_BARS
      const gap = barWidth * 0.35
      const midY = cssHeight / 2

      ctx.clearRect(0, 0, cssWidth, cssHeight)
      ctx.fillStyle = '#7164E9'

      bars.forEach((amplitude, i) => {
        const barHeight = Math.max(2, amplitude * (cssHeight - 4))
        const x = cssWidth - (bars.length - i) * barWidth
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(
            x + gap / 2,
            midY - barHeight / 2,
            barWidth - gap,
            barHeight,
            2,
          )
        } else {
          ctx.rect(x + gap / 2, midY - barHeight / 2, barWidth - gap, barHeight)
        }
        ctx.fill()
      })
    }
    drawFrame()

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      source.disconnect()
      void audioContext.close()
    }
  }, [mediaStream])

  return (
    <canvas ref={canvasRef} className="h-6 w-full min-w-0 flex-1 rounded-lg" />
  )
}
