import { formatCountdown } from '../lib/time'

export type StatusTone = 'live' | 'lunch' | 'idle' | 'off'

export interface CountdownCardProps {
  eyebrow: string
  caption: string
  timer: number | null
  progress: number | null
  statusLabel: string
  tone: StatusTone
  meta: string[]
}

export function CountdownCard({ eyebrow, caption, timer, progress, statusLabel, tone, meta }: CountdownCardProps) {
  return (
    <section className="card hero" aria-label="Countdown to the next bell">
      <div className="hero-top">
        <span className={`pill pill--${tone}`}>
          <span className="pill-dot" aria-hidden />
          {statusLabel}
        </span>
        <span className="hero-eyebrow">{eyebrow}</span>
      </div>

      <p className="hero-timer" role="timer" aria-live="off">
        {timer === null ? '—:—' : formatCountdown(timer)}
      </p>

      <p className="hero-caption">{caption}</p>

      {progress !== null && (
        <div className="progress" role="presentation">
          <span style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
      )}

      {meta.length > 0 && (
        <div className="hero-meta">
          {meta.map((item) => (
            <span key={item} className="hero-meta-item">
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
