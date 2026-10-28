import BackgroundNoise from "./components/ui/background-noise"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CountdownCard, type StatusTone } from './components/CountdownCard'
import { LunchPicker } from './components/LunchPicker'
import { SettingsDialog, type ClockFormat, type ColorTheme, type DateFormat, type DetailsChoice, type DisplayMode, type DisplaySettings, type FontChoice, type GlowColor } from './components/SettingsDialog'
import { Timeline } from './components/Timeline'
import type { WeekChoice } from './components/WeekSwitcher'
import { LUNCHES, autoWeek, buildDay, dayTypeFor } from './data/schedule'
import { isSchoolDay, noSchoolReason, nextSchoolDate, EARLY_RELEASES } from './data/calendar'
import { useNow, useStoredState, useVisitCount } from './lib/hooks'
import { getDayStatus, type DayStatus } from './lib/status'
import {
  WEEKDAY_NAMES,
  dayKey,
  formatClock,
  formatDate,
  secondsSinceMidnight,
  secondsUntilWeekdayStart,
  weekdayIndex,
} from './lib/time'
import type { LunchId, ScheduleBlock, Week, WeekdayIndex } from './types'

const WEEK_KEY = 'minnetonka.week'
const LUNCH_KEY = 'minnetonka.lunch'
const DEFAULT_SETTINGS: DisplaySettings = {
  clockFormat: '12h',
  dateFormat: 'long',
  font: 'ndot',
  colorTheme: 'ocean',
  displayMode: 'normal',
  showCourseDetails: 'off',
  glowColor: 'teal',
}

const FOOTER_LINKS = ['AB week schedule', 'Daily calendar', 'Year calendar', 'Lunch', 'TV Panel', 'Admin'] as const

interface Hero {
  eyebrow: string
  caption: string
  timer: number | null
  progress: number | null
  statusLabel: string
  tone: StatusTone
  meta: string[]
}

export default function App() {
  const now = useNow(1000)
  const visitCount = useVisitCount()
  const todayKey = dayKey(now)
  const [selectedDate, setSelectedDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()))
  const viewingCurrentDate = useRef(true)
  const selectedDateKey = dayKey(selectedDate)
  const dateAtOffset = (days: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  const calendarDayIndex = weekdayIndex(selectedDate)
  const selectedDay = (calendarDayIndex === 5 ? 4 : calendarDayIndex === 6 ? 0 : calendarDayIndex) as WeekdayIndex
  const schoolToday = isSchoolDay(selectedDate)
  const closureReason = noSchoolReason(selectedDate)
  const nextSchoolDay = nextSchoolDate(selectedDate)
  const calendarNotice = EARLY_RELEASES[selectedDateKey]

  const [storedWeek, setStoredWeek] = useStoredState<WeekChoice>(WEEK_KEY, 'auto')
  const [storedLunch, setStoredLunch] = useStoredState<LunchId>(LUNCH_KEY, 'lunch2')
  const [clockFormat, setClockFormat] = useStoredState<ClockFormat>('minnetonka.settings.clockFormat', DEFAULT_SETTINGS.clockFormat)
  const [dateFormat, setDateFormat] = useStoredState<DateFormat>('minnetonka.settings.dateFormat', DEFAULT_SETTINGS.dateFormat)
  const [font, setFont] = useStoredState<FontChoice>('minnetonka.settings.font', DEFAULT_SETTINGS.font)
  const [colorTheme, setColorTheme] = useStoredState<ColorTheme>('minnetonka.settings.colorTheme', DEFAULT_SETTINGS.colorTheme)
  const [displayMode, setDisplayMode] = useStoredState<DisplayMode>('minnetonka.settings.displayMode', DEFAULT_SETTINGS.displayMode)
  const [showCourseDetails, setShowCourseDetails] = useStoredState<DetailsChoice>('minnetonka.settings.courseDetails', DEFAULT_SETTINGS.showCourseDetails)
  const [glowColor, setGlowColor] = useStoredState<GlowColor>('minnetonka.settings.glowColor', DEFAULT_SETTINGS.glowColor)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const settings: DisplaySettings = { clockFormat, dateFormat, font, colorTheme, displayMode, showCourseDetails, glowColor }
  const onSettingChange = <Key extends keyof DisplaySettings>(key: Key, value: DisplaySettings[Key]) => {
    switch (key) {
      case 'clockFormat': setClockFormat(value as ClockFormat); break
      case 'dateFormat': setDateFormat(value as DateFormat); break
      case 'font': setFont(value as FontChoice); break
      case 'colorTheme': setColorTheme(value as ColorTheme); break
      case 'displayMode': setDisplayMode(value as DisplayMode); break
      case 'showCourseDetails': setShowCourseDetails(value as DetailsChoice); break
      case 'glowColor': setGlowColor(value as GlowColor); break
    }
  }

  const resetSettings = () => {
    setClockFormat(DEFAULT_SETTINGS.clockFormat)
    setDateFormat(DEFAULT_SETTINGS.dateFormat)
    setFont(DEFAULT_SETTINGS.font)
    setColorTheme(DEFAULT_SETTINGS.colorTheme)
    setDisplayMode(DEFAULT_SETTINGS.displayMode)
    setShowCourseDetails(DEFAULT_SETTINGS.showCourseDetails)
    setGlowColor(DEFAULT_SETTINGS.glowColor)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme
    document.documentElement.dataset.font = font
    document.documentElement.dataset.glow = glowColor
  }, [colorTheme, font, glowColor])

  // Validate whatever came out of localStorage before trusting it.
  const weekChoice: WeekChoice = storedWeek === 'A' || storedWeek === 'B' ? storedWeek : 'auto'
  const lunch: LunchId = LUNCHES.some((entry) => entry.id === storedLunch) ? storedLunch : 'lunch2'
  const toggleWeek = () => setStoredWeek(weekChoice === 'auto' ? (week === 'A' ? 'B' : 'A') : weekChoice === 'A' ? 'B' : 'A')

  // Keep following the real calendar at midnight unless the viewer is paging through another date.
  useEffect(() => {
    if (viewingCurrentDate.current) {
      setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    }
  }, [todayKey])

  const detectedWeek = useMemo(() => autoWeek(selectedDate), [selectedDateKey])
  const week: Week = weekChoice === 'auto' ? detectedWeek : weekChoice

  const blocks = useMemo(() => buildDay(week, selectedDay, lunch), [week, selectedDay, lunch])
  const dayType = dayTypeFor(week, selectedDay)
  const live = schoolToday && selectedDateKey === todayKey
  const nowSeconds = secondsSinceMidnight(now)
  const status = getDayStatus(blocks, nowSeconds)
  const selectedSchoolDay = schoolToday && selectedDateKey !== todayKey

  const hero = describeHero({
    now,
    live,
    schoolToday,
    selectedSchoolDay,
    selectedDay,
    status,
    blocks,
    dayType,
    closureReason,
    nextSchoolDay,
    clockFormat,
    dateFormat,
  })

  const timerTarget = useMemo(() => {
    if (hero.timer === null) return null
    if (hero.timer === 0) return new Date(0)
    const target = new Date(now)
    target.setMilliseconds(0)
    target.setSeconds(target.getSeconds() + hero.timer)
    return target
  }, [now, hero.timer])

  const notice = !schoolToday
    ? `${closureReason === 'Weekend' ? 'Weekend · no classes' : `${closureReason ?? 'No classes'} · no classes`}${
        nextSchoolDay ? ` · Next school day ${formatDate(nextSchoolDay, dateFormat)}` : ''
      }`
    : (calendarNotice ?? null)

  const chooseDate = (days: number) => {
    viewingCurrentDate.current = days === 0
    setSelectedDate(dateAtOffset(days))
  }

  return (
    <>
      <BackgroundNoise />
      <div className={`page${displayMode === 'tv' ? ' page--tv' : ''}`}>
        <header className="app-header">
          <nav className="date-navigation" aria-label="Schedule date and week">
            <div className="date-segmented" role="group" aria-label="Choose schedule day">
              {([-1, 0, 1] as const).map((offset) => {
                const label = offset === -1 ? 'Yesterday' : offset === 0 ? 'Today' : 'Tomorrow'
                const isSelected = selectedDateKey === dayKey(dateAtOffset(offset))
                return (
                  <button
                    key={offset}
                    className={`date-segment-button${isSelected ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => chooseDate(offset)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              className="week-toggle"
              type="button"
              onClick={toggleWeek}
              aria-label={`Week ${week}${weekChoice === 'auto' ? ' is the calendar default' : ` selected; the calendar default is Week ${detectedWeek}`}. Switch to Week ${week === 'A' ? 'B' : 'A'}.`}
              title={weekChoice === 'auto' ? 'Using the calendar default' : `Calendar default: Week ${detectedWeek}`}
            >
              <span>Week {week}</span>
              <span className="week-toggle-note">{weekChoice === 'auto' ? 'Default week' : `Default: Week ${detectedWeek}`}</span>
            </button>
          </nav>
        </header>

        <main className="layout">
          <div className="daily-dashboard" key={`${selectedDateKey}-${week}-${lunch}`}>
            <CountdownCard
              eyebrow={hero.eyebrow}
              caption={hero.caption}
              timer={hero.timer}
              targetDate={timerTarget}
              progress={hero.progress}
              statusLabel={hero.statusLabel}
              tone={hero.tone}
              meta={hero.meta}
            />
            <div className="daily-dashboard-schedule">
              {notice && <p className="notice">{notice}</p>}
              <Timeline blocks={blocks} live={live} nowSeconds={nowSeconds} clockFormat={clockFormat} showCourseDetails={showCourseDetails} />
            </div>
          </div>

          <section className="schedule-controls" aria-label="Schedule controls">
            <div className="controls-date">
              <span className="controls-weekday">{new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(selectedDate)}</span>
              <span className="controls-full-date">{formatDate(selectedDate, dateFormat)}</span>
            </div>
            <LunchPicker value={lunch} onChange={setStoredLunch} clockFormat={clockFormat} />
          </section>
        </main>

        <footer className="footer">
          <p className="visit-count">Site visits on this device <strong>{visitCount.toLocaleString()}</strong></p>
          <nav className="footer-links" aria-label="Schedule quick links">
            {FOOTER_LINKS.map((link) => (
              <a key={link} href="#" onClick={(e) => e.preventDefault()} className="footer-link">
                {link}
              </a>
            ))}
            <a
              className="footer-link"
              href="https://docs.google.com/forms/d/e/1FAIpQLSfJyrglqlKc2nvIQoHHsO_u2MrxL5M6dZRB0WlpX2HZbpEzJw/viewform"
              target="_blank"
              rel="noreferrer"
            >
              Bug report
            </a>
            <button type="button" className="footer-link footer-settings" onClick={() => setSettingsOpen(true)}>Settings</button>
          </nav>
        </footer>
      </div>
      {settingsOpen && (
        <SettingsDialog settings={settings} onSettingChange={onSettingChange} onReset={resetSettings} onClose={closeSettings} />
      )}
    </>
  )
}

interface HeroArgs {
  now: Date
  live: boolean
  schoolToday: boolean
  selectedSchoolDay: boolean
  selectedDay: WeekdayIndex
  status: DayStatus
  blocks: ScheduleBlock[]
  dayType: Week
  closureReason: string | null
  nextSchoolDay: Date | null
  clockFormat: ClockFormat
  dateFormat: DateFormat
}

function describeHero(args: HeroArgs): Hero {
  const { now, live, schoolToday, selectedSchoolDay, selectedDay, status, blocks, dayType, closureReason, nextSchoolDay, clockFormat, dateFormat } = args
  const show24Hour = clockFormat === '24h'
  const time = (minutes: number) => formatClock(minutes, false, show24Hour)
  const firstBell = blocks[0]?.start ?? 0
  const dayName = WEEKDAY_NAMES[selectedDay]

  if (live) {
    if (status.phase === 'in' && status.current) {
      const current = status.current
      const isLunch = current.kind === 'lunch'
      return {
        eyebrow: current.kind === 'class' ? current.label : current.title,
        caption: `${current.kind === 'class' ? current.label : current.title} ends at ${time(current.end)}`,
        timer: selectedSchoolDay ? 0 : status.seconds,
        progress: selectedSchoolDay ? null : status.progress,
        statusLabel: isLunch ? 'Lunch' : 'In session',
        tone: isLunch ? 'lunch' : 'live',
        meta: [`${current.end - current.start} min`],
      }
    }

    if (status.phase === 'passing' && status.next) {
      const next = status.next
      return {
        eyebrow: 'Passing period',
        caption: `${next.label} starts at ${time(next.start)}`,
        timer: selectedSchoolDay ? 0 : status.seconds,
        progress: null,
        statusLabel: 'Between bells',
        tone: 'live',
        meta: [],
      }
    }

    if (status.phase === 'before' && status.next) {
      return {
        eyebrow: `${dayName} · ${dayType} day`,
        caption: `First bell rings at ${time(firstBell)}`,
        timer: selectedSchoolDay ? 0 : status.seconds,
        progress: null,
        statusLabel: 'Before school',
        tone: 'idle',
        meta: [],
      }
    }

    return {
      eyebrow: 'School day complete',
      caption: 'Classes have ended for today.',
      timer: 0,
      progress: null,
      statusLabel: "School's out",
      tone: 'off',
      meta: [],
    }
  }

  if (!schoolToday) {
    return {
      eyebrow: closureReason ?? 'No classes today',
      caption: nextSchoolDay ? `Next school day: ${formatDate(nextSchoolDay, dateFormat)}` : 'No classes today',
      timer: 0,
      progress: null,
      statusLabel: 'No school today',
      tone: 'off',
      meta: [],
    }
  }

  if (selectedSchoolDay) {
    return {
      eyebrow: `${dayName} · ${dayType} day`,
      caption: `${dayName} starts at ${time(firstBell)}`,
      timer: 0,
      progress: null,
      statusLabel: 'Preview',
      tone: 'idle',
      meta: [],
    }
  }

  return {
    eyebrow: `${dayName} · ${dayType} day`,
    caption: `${dayName} starts at ${time(firstBell)}`,
    timer: secondsUntilWeekdayStart(now, selectedDay, firstBell),
    progress: null,
    statusLabel: 'Preview',
    tone: 'idle',
    meta: [],
  }
}
