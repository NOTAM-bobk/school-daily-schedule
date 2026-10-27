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

export function CountdownCard({
  eyebrow,
  caption,
  timer,
  progress,
  statusLabel,
  tone,
  meta,
}: CountdownCardProps) {
  // Circular ring geometry
  const radius = 96
  const stroke = 8
  const circumference = 2 * Math.PI * radius

  // "unfills when the class is getting closer to done"
  // When class begins (progress = 0) -> ring is 100% full (offset = 0)
  // When class nears completion (progress -> 1) -> ring drains down to 0% (offset -> circumference)
  // When not in session (progress === null) -> calm full ring (offset = 0)
  const remainingFraction = progress !== null ? Math.max(0, Math.min(1, 1 - progress)) : 1
  const strokeDashoffset = circumference * (1 - remainingFraction)

  return (
    <section className="card hero" aria-label="Countdown to the next bell">
      <div className="hero-top">
        <span className={`pill pill--${tone}`}>
          <span className="pill-dot" aria-hidden />
          {statusLabel}
        </span>
        <span className="hero-eyebrow">{eyebrow}</span>
      </div>

      <div className="timer-ring-container">
        <svg
          className="timer-ring-svg"
          width="240"
          height="240"
          viewBox="0 0 240 240"
          role="presentation"
        >
          {/* Subtle background track */}
          <circle
            className="timer-ring-track"
            cx="120"
            cy="120"
            r={radius}
            strokeWidth={stroke}
          />
          {/* Animated unfilling progress ring */}
          <circle
            className={`timer-ring-progress timer-ring--${tone}`}
            cx="120"
            cy="120"
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 120 120)"
          />
        </svg>

        <div className="timer-ring-content">
          <p className="hero-timer" role="timer" aria-live="off">
            {timer === null ? '—:—' : formatCountdown(timer)}
          </p>
          <span className="timer-ring-sub">
            {progress !== null ? `${Math.round(remainingFraction * 100)}% left` : 'bell timer'}
          </span>
        </div>
      </div>

      <p className="hero-caption">{caption}</p>

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
