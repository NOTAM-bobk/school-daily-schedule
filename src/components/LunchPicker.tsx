import type { LunchId } from '../types'
import { LUNCHES, lunchWindow } from '../data/schedule'

interface LunchPickerProps {
  value: LunchId
  onChange: (lunch: LunchId) => void
}

export function LunchPicker({ value, onChange }: LunchPickerProps) {
  return (
    <div className="field">
      <div className="field-head">
        <span className="field-label">Lunch shift</span>
        <span className="field-hint">Re-times the midday bells</span>
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
              <span className="lunch-detail">{lunch.detail}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
