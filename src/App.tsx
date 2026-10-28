import BackgroundNoise from "./components/ui/background-noise"
import { Badge } from '@/components/ui/badge-2'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, History, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CountdownCard, type StatusTone } from './components/CountdownCard'
import { LunchPicker } from './components/LunchPicker'
import {
  SettingsDialog,
  type BackgroundStyle,
  type ClockFormat,
  type ColorTheme,
  type DateFormat,
  type DetailsChoice,
  type DisplayMode,
  type DisplaySettings,
  type FontChoice,
  type GlowColor,
} from './components/SettingsDialog'
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
  backgroundStyle: 'default',
  customBgColor: '#020617',
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
  circleLabel?: string
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
  const [backgroundStyle, setBackgroundStyle] = useStoredState<BackgroundStyle>('minnetonka.settings.background', DEFAULT_SETTINGS.backgroundStyle)
  const [customBgColor, setCustomBgColor] = useStoredState<string>('minnetonka.settings.customBgColor', DEFAULT_SETTINGS.customBgColor ?? '#020617')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const settings: DisplaySettings = {
    clockFormat,
    dateFormat,
    font,
    colorTheme,
    displayMode,
    showCourseDetails,
    glowColor,
    backgroundStyle,
    customBgColor,
  }

  const onSettingChange = <Key extends keyof DisplaySettings>(key: Key, value: DisplaySettings[Key]) => {
    switch (key) {
      case 'clockFormat': setClockFormat(value as ClockFormat); break
      case 'dateFormat': setDateFormat(value as DateFormat); break
      case 'font': setFont(value as FontChoice); break
      case 'colorTheme': setColorTheme(value as ColorTheme); break
      case 'displayMode': setDisplayMode(value as DisplayMode); break
      case 'showCourseDetails': setShowCourseDetails(value as DetailsChoice); break
      case 'glowColor': setGlowColor(value as GlowColor); break
      case 'backgroundStyle': setBackgroundStyle(value as BackgroundStyle); break
      case 'customBgColor': setCustomBgColor(value as string); break
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
    setBackgroundStyle(DEFAULT_SETTINGS.backgroundStyle)
    setCustomBgColor(DEFAULT_SETTINGS.customBgColor ?? '#020617')
  }

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme
    document.documentElement.dataset.font = font
    document.documentElement.dataset.glow = glowColor
    document.documentElement.dataset.background = backgroundStyle
    if (backgroundStyle === 'custom' && customBgColor) {
      document.documentElement.style.setProperty('--bg-custom', customBgColor)
    } else {
      document.documentElement.style.removeProperty('--bg-custom')
    }
  }, [colorTheme, font, glowColor, backgroundStyle, customBgColor])

  const isSignMode = displayMode === 'tv'

  // Keyboard shortcut: Escape exits sign mode
  useEffect(() => {
    if (!isSignMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDisplayMode('normal')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSignMode, setDisplayMode])

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

  const currentTab = selectedDateKey === dayKey(dateAtOffset(-1))
    ? '-1'
    : selectedDateKey === dayKey(dateAtOffset(0))
    ? '0'
    : selectedDateKey === dayKey(dateAtOffset(1))
    ? '1'
    : '0'

  const handleTabChange = (val: string) => {
    const offset = parseInt(val, 10)
    if (!Number.isNaN(offset)) {
      chooseDate(offset)
    }
  }

  return (
    <>
      <BackgroundNoise />
      <div className={`page${isSignMode ? ' page--tv page--sign' : ''}`}>
        {!isSignMode && (
          <header className="app-header">
            <div className="controls-date top-date-banner">
              <span className="controls-weekday">{new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(selectedDate)}</span>
              <span className="controls-full-date">
                {dateFormat === 'long'
                  ? new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(selectedDate)
                  : formatDate(selectedDate, dateFormat)}
              </span>
            </div>
            <nav className="date-navigation" aria-label="Schedule date and week">
              <Tabs value={currentTab} onValueChange={handleTabChange} className="date-tabs">
                <TabsList className="grid w-full grid-cols-3 date-segmented" shape="pill">
                  <TabsTrigger value="-1">
                    <History className="tab-icon" aria-hidden="true" />
                    <span>Yesterday</span>
                  </TabsTrigger>
                  <TabsTrigger value="0">
                    <Sparkles className="tab-icon" aria-hidden="true" />
                    <span>Today</span>
                    {live && status.current ? (
                      <Badge variant="destructive" shape="circle" size="xs" aria-label={`Period ${status.current.label}`}>
                        {status.current.kind === 'class' ? status.current.label : '•'}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="1">
                    <CalendarDays className="tab-icon" aria-hidden="true" />
                    <span>Tomorrow</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
        )}

        <main className={`layout${isSignMode ? ' layout--sign' : ''}`}>
          <div className={`daily-dashboard${isSignMode ? ' daily-dashboard--sign' : ''}`} key={`${selectedDateKey}-${week}-${lunch}`}>
            <CountdownCard
              eyebrow={hero.eyebrow}
              caption={isSignMode ? '' : hero.caption}
              timer={hero.timer}
              targetDate={timerTarget}
              progress={hero.progress}
              statusLabel={hero.statusLabel}
              tone={hero.tone}
              meta={isSignMode ? [] : hero.meta}
              circleLabel="Class Ends in"
            />
            <div className="daily-dashboard-schedule">
              {!isSignMode && notice && <p className="notice">{notice}</p>}
              <Timeline blocks={blocks} live={live} nowSeconds={nowSeconds} clockFormat={clockFormat} showCourseDetails={showCourseDetails} />
            </div>
          </div>

          {!isSignMode && (
            <section className="schedule-controls" aria-label="Schedule controls">
              <LunchPicker value={lunch} onChange={setStoredLunch} clockFormat={clockFormat} />
            </section>
          )}
        </main>

        {!isSignMode ? (
          <footer className="footer">
            <p className="visit-count">Site visits on this device <strong>{visitCount.toLocaleString()}</strong></p>
            <nav className="footer-links" aria-label="Schedule quick links">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (link === 'TV Panel') {
                      setDisplayMode('tv')
                    }
                  }}
                  className="footer-link"
                >
                  {link === 'TV Panel' ? 'Sign mode' : link}
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
        ) : (
          <div className="sign-mode-bottom-bar">
            <button
              type="button"
              className="exit-sign-mode-button"
              onClick={() => setDisplayMode('normal')}
              aria-label="Exit sign mode"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Exit sign mode</span>
            </button>
          </div>
        )}
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
      const periodLabel = current.kind === 'class' ? current.label : current.title
      const periodEndText = isLunch ? `Lunch ends at ${time(current.end)}` : `${periodLabel} ends at ${time(current.end)}`
      return {
        eyebrow: '',
        caption: current.title && current.title !== periodLabel ? current.title : '',
        timer: selectedSchoolDay ? 0 : status.seconds,
        progress: selectedSchoolDay ? null : status.progress,
        statusLabel: periodEndText,
        tone: isLunch ? 'lunch' : 'live',
        meta: [`${current.end - current.start} min`],
      }
    }

    if (status.phase === 'passing' && status.next) {
      const next = status.next
      return {
        eyebrow: '',
        caption: '',
        timer: selectedSchoolDay ? 0 : status.seconds,
        progress: null,
        statusLabel: `Passing · ${next.label} starts at ${time(next.start)}`,
        tone: 'live',
        meta: [],
      }
    }

    if (status.phase === 'before' && status.next) {
      return {
        eyebrow: '',
        caption: `${dayName} · ${dayType} day`,
        timer: selectedSchoolDay ? 0 : status.seconds,
        progress: null,
        statusLabel: `First bell rings at ${time(firstBell)}`,
        tone: 'idle',
        meta: [],
      }
    }

    return {
      eyebrow: '',
      caption: 'Classes have ended for today.',
      timer: 0,
      progress: null,
      statusLabel: "School's out for today",
      tone: 'off',
      meta: [],
    }
  }

  if (!schoolToday) {
    return {
      eyebrow: '',
      caption: nextSchoolDay ? `Next school day: ${formatDate(nextSchoolDay, dateFormat)}` : 'No classes today',
      timer: 0,
      progress: null,
      statusLabel: closureReason ?? 'No school today',
      tone: 'off',
      meta: [],
    }
  }

  if (selectedSchoolDay) {
    return {
      eyebrow: `${dayName} · ${dayType} day`,
      caption: '',
      timer: 0,
      progress: null,
      statusLabel: `${dayName} starts at ${time(firstBell)}`,
      tone: 'idle',
      meta: [],
    }
  }

  return {
    eyebrow: `${dayName} · ${dayType} day`,
    caption: '',
    timer: secondsUntilWeekdayStart(now, selectedDay, firstBell),
    progress: null,
    statusLabel: `${dayName} starts at ${time(firstBell)}`,
    tone: 'idle',
    meta: [],
  }
}
