import type { ClockFormat, DetailsChoice, ScheduleBlock } from '../types'
import { getDayStatus } from '../lib/status'
import { formatClock } from '../lib/time'

interface TimelineProps {
  blocks: ScheduleBlock[]
  live: boolean
  nowSeconds: number
  clockFormat: ClockFormat
  showCourseDetails: DetailsChoice
}

/** Full-width bell schedule with a familiar period-and-time list layout. */
export function Timeline({ blocks, live, nowSeconds, clockFormat, showCourseDetails }: TimelineProps) {
  const status = live ? getDayStatus(blocks, nowSeconds) : null

  return (
    <section className="schedule-card" aria-label="Day schedule">
      <div className="schedule-table-header" aria-hidden="true">
        <span>Period</span>
        <span>Time</span>
      </div>
      <ol className="schedule-list">
        {blocks.map((block) => {
          const isNow = status?.current?.id === block.id
          const isNext = status?.next?.id === block.id && status.phase !== 'in'
          const isPast = live && block.end * 60 <= nowSeconds

          const state = isNow ? 'now' : isNext ? 'next' : isPast ? 'past' : 'upcoming'

          return (
            <li key={block.id} className={`schedule-row schedule-row--${state} schedule-row--${block.kind}`}>
              <div className="schedule-period">
                <span className="schedule-state-dot" aria-hidden="true" />
                <div className="schedule-period-copy">
                  <span className="schedule-period-title">
                    {block.kind === 'class' ? block.label : block.title}
                    {block.kind === 'class' && <span className="schedule-course-name">{block.title}</span>}
                  </span>
                  {showCourseDetails === 'on' && block.kind === 'class' && (block.teacher || block.room) && (
                    <span className="schedule-course-details">{[block.teacher, block.room].filter(Boolean).join(' · ')}</span>
                  )}
                </div>
                {(isNow || isNext) && (
                  <span className={`schedule-state-chip${isNow ? ' schedule-state-chip--live' : ''}`}>
                    {isNow ? 'Now' : 'Next'}
                  </span>
                )}
              </div>
              <span className="sched-time">
                {formatClock(block.start, false, clockFormat === '24h')} – {formatClock(block.end, false, clockFormat === '24h')}
              </span>
              {isNow && status && (
                <span className="schedule-row-progress" aria-hidden="true">
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
