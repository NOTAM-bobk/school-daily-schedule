import type { WeekdayIndex } from '../types'
import { WEEKDAY_SHORT } from '../lib/time'

interface DayStripProps {
  selected: WeekdayIndex
  todayIndex: number
  onSelect: (day: WeekdayIndex) => void
}

export function DayStrip({ selected, todayIndex, onSelect }: DayStripProps) {
  return (
    <div className="field">
      <div className="field-head">
        <span className="field-label">Day</span>
        <span className="field-hint">{WEEKDAY_SHORT[selected]}</span>
      </div>
      <div className="day-strip" role="tablist" aria-label="Pick a school day">
        {WEEKDAY_SHORT.map((name, index) => {
          const day = index as WeekdayIndex
          const isToday = index === todayIndex
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={day === selected}
              className={`day-chip${day === selected ? ' is-active' : ''}`}
              onClick={() => onSelect(day)}
            >
              {name}
              {isToday && <span className="day-chip-dot" aria-label="today" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
