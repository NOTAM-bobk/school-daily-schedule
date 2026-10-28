import { useEffect, useRef, useState } from 'react'

/** A `Date` that re-renders on an interval (default: every second). */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

const VISIT_KEY = 'minnetonka.siteVisits'

/** Count page visits in this browser, persisting the total locally. */
export function useVisitCount(): number {
  const countedThisMount = useRef(false)
  const [count, setCount] = useState(() => {
    try {
      const stored = window.localStorage.getItem(VISIT_KEY)
      if (stored !== null) {
        const parsed = Number(stored)
        if (Number.isSafeInteger(parsed) && parsed >= 0) return parsed
      }
    } catch {
      /* Fall back to the cookie when local storage is unavailable. */
    }

    try {
      const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${VISIT_KEY}=`))
      const parsed = Number(cookie?.slice(VISIT_KEY.length + 1) ?? 0)
      return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    if (countedThisMount.current) return
    countedThisMount.current = true

    const nextCount = count + 1
    setCount(nextCount)
    try {
      window.localStorage.setItem(VISIT_KEY, String(nextCount))
    } catch {
      /* The page-level count still works if local storage is unavailable. */
    }
    try {
      document.cookie = `${VISIT_KEY}=${nextCount}; Max-Age=31536000; Path=/; SameSite=Lax`
    } catch {
      /* Cookies can be unavailable in privacy-restricted browsers. */
    }
  }, [])

  return count
}

/** State mirrored into localStorage, so lunch and week choices survive reloads. */
export function useStoredState<T extends string>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (stored as T) : fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* storage can be unavailable in private mode — the UI still works */
    }
  }, [key, value])

  return [value, setValue]
}
