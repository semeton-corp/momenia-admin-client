import { useEffect, useState } from "react"

/**
 * Returns `value` only after it has stopped changing for `delayMs`.
 *
 * Used by the template preview: writing a large `srcdoc` reloads the iframe,
 * which is far too expensive to run on every keystroke or paste.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
