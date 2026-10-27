import { useEffect, useState } from 'react'

/** A `Date` that re-renders on an interval (default: every second). */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
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
