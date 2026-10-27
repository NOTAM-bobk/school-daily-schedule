import type { ScheduleBlock } from '../types'
import { getDayStatus } from '../lib/status'
import { formatClock } from '../lib/time'

interface TimelineProps {
  blocks: ScheduleBlock[]
  live: boolean
  nowSeconds: number
}

/** Horizontal day schedule: one compact card per bell, scrolled sideways. */
export function Timeline({ blocks, live, nowSeconds }: TimelineProps) {
  const status = live ? getDayStatus(blocks, nowSeconds) : null

  return (
    <section className="schedule-card" aria-label="Day schedule">
      <ol className="schedule-strip">
        {blocks.map((block) => {
          const isNow = status?.current?.id === block.id
          const isNext = status?.next?.id === block.id && status.phase !== 'in'
          const isPast = live && block.end * 60 <= nowSeconds

          const state = isNow ? 'now' : isNext ? 'next' : isPast ? 'past' : 'upcoming'

          return (
            <li key={block.id} className={`sched-block sched-block--${state} sched-block--${block.kind}`}>
              <div className="sched-head">
                <span className="sched-label">{block.label}</span>
                {isNow && <span className="chip chip--live">Now</span>}
                {isNext && <span className="chip">Next</span>}
              </div>
              <span className="sched-title">{block.title}</span>
              <span className="sched-time">
                {formatClock(block.start)} – {formatClock(block.end)}
              </span>
              {isNow && status && (
                <span className="progress progress--thin">
                  <span style={{ width: `${Math.min(100, Math.max(0, status.progress * 100))}%` }} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
