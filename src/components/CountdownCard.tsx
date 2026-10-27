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
}

export function CountdownCard({
  eyebrow,
  caption,
  timer,
  targetDate,
  progress: _progress,
  statusLabel,
  tone,
  meta,
}: CountdownCardProps) {
  return (
    <section className={`countdown-hero countdown-hero--${tone}`} aria-label="Countdown to the next bell">
      <div className="countdown-status">
        <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />
        <span>{statusLabel}</span>
        <span className="countdown-eyebrow">{eyebrow}</span>
      </div>
      <div className="countdown-numbers">
        {targetDate ? (
          <VaporCountdown targetDate={targetDate} labels={null} />
        ) : (
          <time className="empty-countdown" aria-label="No countdown today">—:—</time>
        )}
      </div>
      <p className="countdown-caption">{caption}</p>
      {meta.length > 0 && <p className="countdown-meta">{meta.join(' · ')}</p>}
      {timer !== null && <span className="sr-only">{formatCountdown(timer)} remaining</span>}
    </section>
  )
}
