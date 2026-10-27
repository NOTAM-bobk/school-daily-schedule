import type { Week } from '../types'
import { WEEKDAY_SHORT } from '../lib/time'
import { isADay } from '../data/schedule'

export type WeekChoice = Week | 'auto'

interface WeekSwitcherProps {
  value: WeekChoice
  detected: Week
  onChange: (choice: WeekChoice) => void
}

const WEEKS: readonly Week[] = ['A', 'B']

export function WeekSwitcher({ value, detected, onChange }: WeekSwitcherProps) {
  const active = value === 'auto' ? detected : value
  const aDays = WEEKDAY_SHORT.filter((_, index) => isADay(active, index as 0)).join(' · ')

  return (
    <div className="field">
      <div className="field-head">
        <span className="field-label">Week</span>
        {value === 'auto' ? (
          <span className="field-hint">Auto · {detected} week</span>
        ) : (
          <button type="button" className="link-button" onClick={() => onChange('auto')}>
            Reset to auto
          </button>
        )}
      </div>

      <div className="segmented" role="radiogroup" aria-label="A or B week">
        {WEEKS.map((week) => (
          <button
            key={week}
            type="button"
            role="radio"
            aria-checked={active === week}
            className={`segment${active === week ? ' is-active' : ''}`}
            onClick={() => onChange(week)}
          >
            {week} week
          </button>
        ))}
      </div>

      <p className="field-note">
        {active} days: {aDays}. Clicking A or B pins the week by hand.
      </p>
    </div>
  )
}
