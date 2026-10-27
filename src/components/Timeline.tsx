import type { LunchId, ScheduleBlock } from '../types'
import { LUNCHES } from '../data/schedule'
import { getDayStatus } from '../lib/status'
import { WEEKDAY_NAMES, formatClock } from '../lib/time'
import type { WeekdayIndex } from '../types'

interface TimelineProps {
  blocks: ScheduleBlock[]
  lunch: LunchId
  day: WeekdayIndex
  dayType: 'A' | 'B'
  live: boolean
  nowSeconds: number
}

export function Timeline({ blocks, lunch, day, dayType, live, nowSeconds }: TimelineProps) {
  const status = live ? getDayStatus(blocks, nowSeconds) : null
  const lunchName = LUNCHES.find((entry) => entry.id === lunch)?.name ?? 'Lunch'

  return (
    <section className="card timeline-card" aria-label="Day timeline">
      <header className="card-head">
        <h2 className="card-title">{WEEKDAY_NAMES[day]}</h2>
        <p className="card-sub">
          {dayType} day · {lunchName} · {blocks.length} bells
          {live ? ' · live' : ' · preview'}
        </p>
      </header>

      <ol className="timeline">
        {blocks.map((block) => {
          const isNow = status?.current?.id === block.id
          const isNext = status?.next?.id === block.id && status.phase !== 'in'
          const isPast = live && block.end * 60 <= nowSeconds

          const state = isNow ? 'now' : isNext ? 'next' : isPast ? 'past' : 'upcoming'

          return (
            <li key={block.id} className={`slot slot--${state} slot--${block.kind}`}>
              <div className="slot-time">
                <span className="slot-start">{formatClock(block.start)}</span>
                <span className="slot-end">{formatClock(block.end)}</span>
              </div>

              <div className="slot-body">
                <div className="slot-head">
                  <span className="slot-label">{block.label}</span>
                  {isNow && <span className="chip chip--live">Now</span>}
                  {isNext && <span className="chip">Next</span>}
                  {block.kind === 'lunch' && <span className="chip chip--lunch">Your lunch</span>}
                </div>
                {isNow && status && (
                  <div className="progress progress--thin">
                    <span style={{ width: `${Math.min(100, Math.max(0, status.progress * 100))}%` }} />
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
