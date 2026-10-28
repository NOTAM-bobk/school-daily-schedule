import { useEffect, useRef } from 'react'
import type { ClockFormat, ColorTheme, DateFormat, DisplayMode, DisplaySettings, FontChoice, GlowColor } from '../types'

export type {
  ClockFormat,
  ColorTheme,
  DateFormat,
  DetailsChoice,
  DisplayMode,
  DisplaySettings,
  FontChoice,
  GlowColor,
} from '../types'

/* Font picker labels render in their own typeface where the browser allows it. */
const FONT_OPTIONS: { value: FontChoice; label: string; stack: string }[] = [
  { value: 'ndot', label: 'Ndot 55 · dot matrix', stack: "'Ndot 55'" },
  { value: 'geist', label: 'Geist · clean sans', stack: "'Geist'" },
  { value: 'grotesk', label: 'Space Grotesk · modern', stack: "'Space Grotesk'" },
  { value: 'orbitron', label: 'Orbitron · sci-fi', stack: "'Orbitron'" },
  { value: 'silkscreen', label: 'Silkscreen · pixel', stack: "'Silkscreen'" },
  { value: 'vt323', label: 'VT323 · terminal', stack: "'VT323'" },
  { value: 'system', label: 'System sans-serif', stack: 'system-ui' },
]

interface SettingsDialogProps {
  settings: DisplaySettings
  onSettingChange: <Key extends keyof DisplaySettings>(key: Key, value: DisplaySettings[Key]) => void
  onReset: () => void
  onClose: () => void
}

export function SettingsDialog({ settings, onSettingChange, onReset, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('[data-settings-focus]')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), input:not([disabled])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <div className="settings-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialogRef} className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-dialog-header">
          <div>
            <h2 id="settings-title">Settings</h2>
            <p>Your preferences are saved on this device.</p>
          </div>
          <button className="settings-close" type="button" onClick={onClose} aria-label="Close settings">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="settings-panel">
          <label className="setting-row" htmlFor="settings-clock-format">
            <span><strong>Time format</strong><small>Choose how bell times are displayed.</small></span>
            <select data-settings-focus id="settings-clock-format" value={settings.clockFormat} onChange={(event) => onSettingChange('clockFormat', event.target.value as ClockFormat)}>
              <option value="12h">12-hour (8:00 AM)</option>
              <option value="24h">24-hour (08:00)</option>
            </select>
          </label>
          <label className="setting-row" htmlFor="settings-date-format">
            <span><strong>Date format</strong><small>Choose how dates appear across the schedule.</small></span>
            <select id="settings-date-format" value={settings.dateFormat} onChange={(event) => onSettingChange('dateFormat', event.target.value as DateFormat)}>
              <option value="long">Long date</option>
              <option value="short">Short date</option>
              <option value="numeric">Numeric date</option>
            </select>
          </label>
          <label className="setting-row" htmlFor="settings-font">
            <span><strong>Font</strong><small>Pick a type style for the schedule.</small></span>
            <select id="settings-font" value={settings.font} onChange={(event) => onSettingChange('font', event.target.value as FontChoice)}>
              {FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} style={{ fontFamily: option.stack }}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="setting-row" htmlFor="settings-color-theme">
            <span><strong>Colors</strong><small>Change the schedule's color palette.</small></span>
            <select id="settings-color-theme" value={settings.colorTheme} onChange={(event) => onSettingChange('colorTheme', event.target.value as ColorTheme)}>
              <option value="ocean">Ocean blue</option>
              <option value="violet">Violet</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="setting-row" htmlFor="settings-glow-color">
            <span><strong>Pixel glow color</strong><small>Change the animated background glow.</small></span>
            <select id="settings-glow-color" value={settings.glowColor} onChange={(event) => onSettingChange('glowColor', event.target.value as GlowColor)}>
              <option value="teal">Teal</option>
              <option value="blue">Blue</option>
              <option value="violet">Violet</option>
              <option value="amber">Amber</option>
              <option value="rose">Rose</option>
            </select>
          </label>
          <label className="setting-row" htmlFor="settings-display-mode">
            <span><strong>Display mode</strong><small>TV mode enlarges the live schedule for distance viewing.</small></span>
            <select id="settings-display-mode" value={settings.displayMode} onChange={(event) => onSettingChange('displayMode', event.target.value as DisplayMode)}>
              <option value="normal">Normal</option>
              <option value="tv">TV display</option>
            </select>
          </label>
          <label className="setting-row" htmlFor="settings-course-details">
            <span><strong>Course details</strong><small>Show teacher and room under each class.</small></span>
            <input
              id="settings-course-details"
              className="setting-checkbox"
              type="checkbox"
              role="switch"
              checked={settings.showCourseDetails === 'on'}
              onChange={(event) => onSettingChange('showCourseDetails', event.target.checked ? 'on' : 'off')}
            />
          </label>
          <div className="setting-row settings-reset-row">
            <span><strong>Reset settings</strong><small>Return display preferences to their defaults.</small></span>
            <button className="settings-reset" type="button" onClick={onReset}>Reset</button>
          </div>
        </div>
      </section>
    </div>
  )
}
