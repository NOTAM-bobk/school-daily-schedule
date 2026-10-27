import type { Week } from '../types'

export type WeekChoice = Week | 'auto'

interface WeekSwitcherProps {
  value: WeekChoice
  detected: Week
  onChange: (choice: WeekChoice) => void
}

export function WeekSwitcher({ value, detected, onChange }: WeekSwitcherProps) {
  return (
    <label className="compact-picker">
      <span className="field-label">Week</span>
      <select
        aria-label="Choose A or B week"
        value={value}
        onChange={(event) => onChange(event.target.value as WeekChoice)}
      >
        <option value="auto">Auto · {detected}</option>
        <option value="A">Week A</option>
        <option value="B">Week B</option>
      </select>
    </label>
  )
}
