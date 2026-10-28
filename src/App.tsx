import BackgroundNoise from "./components/ui/background-noise"
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CountdownCard, type StatusTone } from './components/CountdownCard'
import { LunchPicker } from './components/LunchPicker'
import { SettingsDialog, type ClockFormat, type ColorTheme, type DateFormat, type DetailsChoice, type DisplayMode, type DisplaySettings, type FontChoice } from './components/SettingsDialog'
import { DayStrip } from './components/DayStrip'
import { Timeline } from './components/Timeline'
import { WeekSwitcher, type WeekChoice } from './components/WeekSwitcher'
import { LUNCHES, autoWeek, buildDay, dayTypeFor } from './data/schedule'
import { dateKey, isSchoolDay, noSchoolReason, nextSchoolDate, EARLY_RELEASES } from './data/calendar'
import { useNow, useStoredState, useVisitCount } from './lib/hooks'
import { getDayStatus, type DayStatus } from './lib/status'
import {
  WEEKDAY_NAMES,
  dayKey,
  formatClock,
  formatDate,
  nextSchoolWeekdayIndex,
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
  const todayIndex = weekdayIndex(now)
  const schoolToday = todayIndex <= 4 && isSchoolDay(now)
  const closureReason = noSchoolReason(now)
  const nextSchoolDay = nextSchoolDate(now)
  const calendarNotice = EARLY_RELEASES[dateKey(now)]

  const [storedWeek, setStoredWeek] = useStoredState<WeekChoice>(WEEK_KEY, 'auto')
  const [storedLunch, setStoredLunch] = useStoredState<LunchId>(LUNCH_KEY, 'lunch2')
  const [clockFormat, setClockFormat] = useStoredState<ClockFormat>('minnetonka.settings.clockFormat', DEFAULT_SETTINGS.clockFormat)
  const [dateFormat, setDateFormat] = useStoredState<DateFormat>('minnetonka.settings.dateFormat', DEFAULT_SETTINGS.dateFormat)
  const [font, setFont] = useStoredState<FontChoice>('minnetonka.settings.font', DEFAULT_SETTINGS.font)
  const [colorTheme, setColorTheme] = useStoredState<ColorTheme>('minnetonka.settings.colorTheme', DEFAULT_SETTINGS.colorTheme)
  const [displayMode, setDisplayMode] = useStoredState<DisplayMode>('minnetonka.settings.displayMode', DEFAULT_SETTINGS.displayMode)
  const [showCourseDetails, setShowCourseDetails] = useStoredState<DetailsChoice>('minnetonka.settings.courseDetails', DEFAULT_SETTINGS.showCourseDetails)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const settings: DisplaySettings = { clockFormat, dateFormat, font, colorTheme, displayMode, showCourseDetails }
  const onSettingChange = <Key extends keyof DisplaySettings>(key: Key, value: DisplaySettings[Key]) => {
    switch (key) {
      case 'clockFormat': setClockFormat(value as ClockFormat); break
      case 'dateFormat': setDateFormat(value as DateFormat); break
      case 'font': setFont(value as FontChoice); break
      case 'colorTheme': setColorTheme(value as ColorTheme); break
      case 'displayMode': setDisplayMode(value as DisplayMode); break
      case 'showCourseDetails': setShowCourseDetails(value as DetailsChoice); break
    }
  }

  const resetSettings = () => {
    setClockFormat(DEFAULT_SETTINGS.clockFormat)
    setDateFormat(DEFAULT_SETTINGS.dateFormat)
    setFont(DEFAULT_SETTINGS.font)
    setColorTheme(DEFAULT_SETTINGS.colorTheme)
    setDisplayMode(DEFAULT_SETTINGS.displayMode)
    setShowCourseDetails(DEFAULT_SETTINGS.showCourseDetails)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme
    document.documentElement.dataset.font = font
  }, [colorTheme, font])

  // Validate whatever came out of localStorage before trusting it.
  const weekChoice: WeekChoice = storedWeek === 'A' || storedWeek === 'B' ? storedWeek : 'auto'
  const lunch: LunchId = LUNCHES.some((entry) => entry.id === storedLunch) ? storedLunch : 'lunch2'

  const [selectedDay, setSelectedDay] = useState<WeekdayIndex>(() =>
    schoolToday ? (todayIndex as WeekdayIndex) : 0,
  )

  // If the tab is left open past midnight, follow the new day.
  useEffect(() => {
    const index = weekdayIndex(new Date())
    if (index <= 4) setSelectedDay(index as WeekdayIndex)
  }, [todayKey])

  const detectedWeek = useMemo(() => autoWeek(new Date()), [todayKey])
  const week: Week = weekChoice === 'auto' ? detectedWeek : weekChoice

  const blocks = useMemo(() => buildDay(week, selectedDay, lunch), [week, selectedDay, lunch])
  const dayType = dayTypeFor(week, selectedDay)
  const live = schoolToday && selectedDay === todayIndex
  const nowSeconds = secondsSinceMidnight(now)
  const status = getDayStatus(blocks, nowSeconds)

  const hero = describeHero({
    now,
    live,
    schoolToday,
    selectedDay,
    todayIndex,
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
    const target = new Date(now)
    target.setMilliseconds(0)
    target.setSeconds(target.getSeconds() + hero.timer)
    return target
  }, [now, hero.timer])

  const notice = !schoolToday
    ? `${closureReason === 'Weekend' ? 'Weekend · no classes today' : `${closureReason ?? 'No classes today'} · no classes today`}${
        nextSchoolDay ? ` · Next school day ${formatDate(nextSchoolDay, dateFormat)}` : ''
      }`
    : (calendarNotice ?? null)

  return (
    <>
      <BackgroundNoise />
      <div className={`page${displayMode === 'tv' ? ' page--tv' : ''}`}>
        <header className="app-header">
          <h1 className="app-mark">MHS Student Assist - {formatDate(now, dateFormat)} - Week {week}</h1>
          <button className="settings-trigger" type="button" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">
            Settings
          </button>
        </header>

        <main className="layout">
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

          {notice && <p className="notice">{notice}</p>}

          <Timeline blocks={blocks} live={live} nowSeconds={nowSeconds} clockFormat={clockFormat} showCourseDetails={showCourseDetails} />

          <section className="schedule-controls" aria-label="Schedule controls">
            <div className="controls-date">
              <span className="controls-weekday">{WEEKDAY_NAMES[selectedDay]}</span>
              <span className="controls-full-date">{formatDate(now, dateFormat)}</span>
            </div>

            <div className="compact-controls">
              <DayStrip selected={selectedDay} todayIndex={todayIndex} onSelect={setSelectedDay} />
              <WeekSwitcher value={weekChoice} detected={detectedWeek} onChange={setStoredWeek} />
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
  selectedDay: WeekdayIndex
  todayIndex: number
  status: DayStatus
  blocks: ScheduleBlock[]
  dayType: Week
  closureReason: string | null
  nextSchoolDay: Date | null
  clockFormat: ClockFormat
  dateFormat: DateFormat
}

function describeHero(args: HeroArgs): Hero {
  const { now, live, schoolToday, selectedDay, todayIndex, status, blocks, dayType, closureReason, nextSchoolDay, clockFormat, dateFormat } = args
  const show24Hour = clockFormat === '24h'
  const time = (minutes: number) => formatClock(minutes, false, show24Hour)
  const firstBell = blocks[0]?.start ?? 0
  const dayName = WEEKDAY_NAMES[selectedDay]
  const classCount = blocks.filter((block) => block.kind === 'class').length
  const daySummary = [`${blocks.length} bells`, `${classCount} classes`]

  if (live) {
    if (status.phase === 'in' && status.current) {
      const current = status.current
      const isLunch = current.kind === 'lunch'
      return {
        eyebrow: current.label,
        caption: `${current.label} ends at ${time(current.end)}`,
        timer: status.seconds,
        progress: status.progress,
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
        timer: status.seconds,
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
        timer: status.seconds,
        progress: null,
        statusLabel: 'Before school',
        tone: 'idle',
        meta: daySummary,
      }
    }

    const nextDay = nextSchoolWeekdayIndex(todayIndex)
    return {
      eyebrow: 'School day complete',
      caption: `Back ${WEEKDAY_NAMES[nextDay]} for the first bell at ${time(firstBell)}`,
      timer: secondsUntilWeekdayStart(now, nextDay, firstBell),
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
      timer: null,
      progress: null,
      statusLabel: 'No school today',
      tone: 'off',
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
    meta: daySummary,
  }
}
