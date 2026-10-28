import { useEffect, useRef, useState } from 'react'
import type {
  ClockFormat,
  ColorTheme,
  DateFormat,
  DisplayMode,
  DisplaySettings,
  FontChoice,
} from '../types'

export type {
  ClockFormat,
  ColorTheme,
  DateFormat,
  DetailsChoice,
  DisplayMode,
  DisplaySettings,
  FontChoice,
} from '../types'

interface SettingsDialogProps {
  settings: DisplaySettings
  onSettingChange: <Key extends keyof DisplaySettings>(key: Key, value: DisplaySettings[Key]) => void
  onReset: () => void
  onClose: () => void
}

const TABS = [
  { id: 'time-date', label: 'Time & date' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'others', label: 'Others' },
] as const

type SettingsTab = (typeof TABS)[number]['id']

export function SettingsDialog({ settings, onSettingChange, onReset, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('time-date')
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLButtonElement>('[role="tab"]')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), select:not([disabled]), input:not([disabled]), [tabindex="0"]',
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
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const tabs = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
        const activeIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
        if (activeIndex === -1) return
        event.preventDefault()
        const direction = event.key === 'ArrowDown' ? 1 : -1
        const nextTab = tabs[(activeIndex + direction + tabs.length) % tabs.length]
        nextTab?.focus()
        nextTab?.click()
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
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <aside className="settings-sidebar">
          <div className="settings-sidebar-heading">
            <h2 id="settings-title">Settings</h2>
            <p>Set up your schedule view.</p>
          </div>
          <nav className="settings-tabs" role="tablist" aria-label="Settings sections" aria-orientation="vertical">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="settings-panel"
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <p className="settings-saved-note">Your choices are saved on this device.</p>
        </aside>

        <div className="settings-content">
          <header className="settings-content-header">
            <div>
              <p className="settings-kicker">MHS Student Assist</p>
              <h3>{TABS.find((tab) => tab.id === activeTab)?.label}</h3>
            </div>
            <button className="settings-close" type="button" onClick={onClose} aria-label="Close settings">
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div
            id="settings-panel"
            className="settings-panel"
            role="tabpanel"
            aria-labelledby={`settings-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === 'time-date' && (
              <div className="settings-group">
                <label className="setting-row" htmlFor="settings-clock-format">
                  <span><strong>Time format</strong><small>Choose how bell times are displayed.</small></span>
                  <select
                    id="settings-clock-format"
                    value={settings.clockFormat}
                    onChange={(event) => onSettingChange('clockFormat', event.target.value as ClockFormat)}
                  >
                    <option value="12h">12-hour (8:00 AM)</option>
                    <option value="24h">24-hour (08:00)</option>
                  </select>
                </label>
                <label className="setting-row" htmlFor="settings-date-format">
                  <span><strong>Date format</strong><small>Choose how dates appear across the schedule.</small></span>
                  <select
                    id="settings-date-format"
                    value={settings.dateFormat}
                    onChange={(event) => onSettingChange('dateFormat', event.target.value as DateFormat)}
                  >
                    <option value="long">Long date</option>
                    <option value="short">Short date</option>
                    <option value="numeric">Numeric date</option>
                  </select>
                </label>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="settings-group">
                <label className="setting-row" htmlFor="settings-font">
                  <span><strong>Font</strong><small>Pick a type style for the schedule.</small></span>
                  <select
                    id="settings-font"
                    value={settings.font}
                    onChange={(event) => onSettingChange('font', event.target.value as FontChoice)}
                  >
                    <option value="ndot">Ndot display</option>
                    <option value="geist">Geist</option>
                    <option value="system">System sans-serif</option>
                  </select>
                </label>
                <label className="setting-row" htmlFor="settings-color-theme">
                  <span><strong>Colors</strong><small>Change the schedule's color palette.</small></span>
                  <select
                    id="settings-color-theme"
                    value={settings.colorTheme}
                    onChange={(event) => onSettingChange('colorTheme', event.target.value as ColorTheme)}
                  >
                    <option value="ocean">Ocean blue</option>
                    <option value="violet">Violet</option>
                    <option value="light">Light</option>
                  </select>
                </label>
                <label className="setting-row" htmlFor="settings-display-mode">
                  <span><strong>Display mode</strong><small>TV mode enlarges the live schedule for distance viewing.</small></span>
                  <select
                    id="settings-display-mode"
                    value={settings.displayMode}
                    onChange={(event) => onSettingChange('displayMode', event.target.value as DisplayMode)}
                  >
                    <option value="normal">Normal</option>
                    <option value="tv">TV display</option>
                  </select>
                </label>
              </div>
            )}

            {activeTab === 'others' && (
              <div className="settings-group">
                <label className="setting-row" htmlFor="settings-course-details">
                  <span><strong>Course details</strong><small>Show teacher and room under each class.</small></span>
                  <input
                    id="settings-course-details"
                    className="setting-checkbox"
                    type="checkbox"
                    checked={settings.showCourseDetails === 'on'}
                    onChange={(event) => onSettingChange('showCourseDetails', event.target.checked ? 'on' : 'off')}
                  />
                </label>
                <div className="settings-row settings-reset-row">
                  <span><strong>Reset settings</strong><small>Return display preferences to their defaults.</small></span>
                  <button className="settings-reset" type="button" onClick={onReset}>Reset to defaults</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
