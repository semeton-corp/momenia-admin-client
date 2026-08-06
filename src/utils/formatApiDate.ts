const EMPTY_API_DATE_PREFIX = "0001-01-01"
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T/
const TIME_ZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/

function parseApiDate(value?: string | null) {
  if (!value || value.startsWith(EMPTY_API_DATE_PREFIX)) {
    return null
  }

  const normalizedValue = ISO_DATE_TIME.test(value) && !TIME_ZONE_SUFFIX.test(value) ? `${value}Z` : value
  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatApiDateTime(value?: string | null) {
  const date = parseApiDate(value)

  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatApiDate(value?: string | null) {
  const date = parseApiDate(value)

  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}
