import type { WeekdayIndex } from '../types'
import { WEEKDAY_NAMES } from '../lib/time'

interface DayStripProps {
  selected: WeekdayIndex
  todayIndex: number
  onSelect: (day: WeekdayIndex) => void
}

export function DayStrip({ selected, todayIndex, onSelect }: DayStripProps) {
  return (
    <label className="compact-picker">
      <span className="field-label">Day</span>
      <select
        aria-label="Pick a school day"
        value={selected}
        onChange={(event) => onSelect(Number(event.target.value) as WeekdayIndex)}
      >
        {WEEKDAY_NAMES.map((name, index) => (
          <option key={name} value={index}>
            {name}{index === todayIndex ? ' · Today' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
