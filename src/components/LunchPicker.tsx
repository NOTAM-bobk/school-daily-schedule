import type { LunchId } from '../types'
import { LUNCHES, lunchWindow } from '../data/schedule'

interface LunchPickerProps {
  value: LunchId
  onChange: (lunch: LunchId) => void
}

export function LunchPicker({ value, onChange }: LunchPickerProps) {
  return (
    <div className="lunch-picker">
      <div className="lunch-picker-label">
        <span className="field-label">Lunch shift</span>
        <span className="field-hint">Adjusts midday bells</span>
      </div>
      <div className="lunch-grid" role="radiogroup" aria-label="Lunch shift">
        {LUNCHES.map((lunch) => {
          const active = lunch.id === value
          return (
            <button
              key={lunch.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`lunch-option${active ? ' is-active' : ''}`}
              onClick={() => onChange(lunch.id)}
            >
              <span className="lunch-name">{lunch.name}</span>
              <span className="lunch-time">{lunchWindow(lunch.id)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
