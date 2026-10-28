import { formatCountdown } from '../lib/time'
import { VaporCountdown } from './ui/countdown-vapor-digits'

export type StatusTone = 'live' | 'lunch' | 'idle' | 'off'

export interface CountdownCardProps {
  eyebrow: string
  caption: string
  timer: number | null
  targetDate: Date | null
  progress: number | null
  statusLabel: string
  tone: StatusTone
  meta: string[]
  circleLabel?: string
}

/* Ring geometry in a 240 × 240 viewBox; the SVG scales with the dial. */
const RING_RADIUS = 112
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function CountdownCard({
  eyebrow,
  caption,
  timer,
  targetDate,
  progress,
  statusLabel,
  tone,
  meta,
  circleLabel = 'Class Ends in',
}: CountdownCardProps) {
  // Full at the first bell of the period, drained to nothing at the last: the
  // ring unfills as the current class runs. Outside a period it rests, full
  // but dimmed, so the layout never jumps.
  const remaining = progress === null ? 1 : Math.max(0, Math.min(1, 1 - progress))
  const dashOffset = RING_CIRCUMFERENCE * (1 - remaining)
  const resting = progress === null

  return (
    <section className={`countdown-hero countdown-hero--${tone}`} aria-label="Countdown to the next bell">
      <div className="countdown-status">
        <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />
        <span className="countdown-status-text">{statusLabel}</span>
        {eyebrow ? <span className="countdown-eyebrow">{eyebrow}</span> : null}
      </div>

      <div className="countdown-dial">
        <svg className="countdown-ring" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
          <circle className="countdown-ring-track" cx="120" cy="120" r={RING_RADIUS} />
          <circle
            className={`countdown-ring-value countdown-ring-value--${tone}${
              resting ? ' countdown-ring-value--resting' : ''
            }`}
            cx="120"
            cy="120"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 120 120)"
          />
        </svg>

        <div className="countdown-numbers">
          <span className="countdown-circle-label">{circleLabel}</span>
          {targetDate ? (
            <VaporCountdown targetDate={targetDate} labels={null} />
          ) : (
            <time className="empty-countdown" aria-label="No countdown today">00:00:00</time>
          )}
        </div>
      </div>

      {caption ? <p className="countdown-caption">{caption}</p> : null}
      {meta.length > 0 && <p className="countdown-meta">{meta.join(' · ')}</p>}
      {timer !== null && <span className="sr-only">{formatCountdown(timer)} remaining</span>}
    </section>
  )
}
