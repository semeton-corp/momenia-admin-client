import type { FieldSchema, Theme } from "./types"

/**
 * Result of parsing one of the editor's JSON panes. The editors commit into the
 * live template only on `ok`, so a half-typed document leaves the last valid
 * version on screen instead of pushing a broken shape down to the renderer.
 */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

type SchemaDoc = { fields: FieldSchema[] }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseJson(raw: string): ParseResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}` }
  }
}

/**
 * theme.json — every key is optional here on purpose: buildThemeCSS() fills the
 * gaps from FALLBACK_THEME, so a theme that's still being typed out one key at a
 * time previews fine. Only the container's shape is enforced.
 */
export function parseThemeJson(raw: string): ParseResult<Theme> {
  const parsed = parseJson(raw)
  if (!parsed.ok) return parsed
  if (!isPlainObject(parsed.value)) {
    return { ok: false, error: "theme.json must be an object, e.g. { \"color_primary\": \"#1a1a1a\" }" }
  }

  const wrongType = Object.entries(parsed.value).find(([, v]) => typeof v !== "string")
  if (wrongType) {
    return { ok: false, error: `theme.json: "${wrongType[0]}" must be a string` }
  }

  return { ok: true, value: parsed.value as unknown as Theme }
}

/**
 * schema.json — `fields` has to be a real array of objects, because the preview
 * maps over it (and would throw mid-render on anything else) and the section
 * HTML resolves {{key}} placeholders against it.
 */
export function parseSchemaJson(raw: string): ParseResult<SchemaDoc> {
  const parsed = parseJson(raw)
  if (!parsed.ok) return parsed
  if (!isPlainObject(parsed.value)) {
    return { ok: false, error: "schema.json must be an object with a \"fields\" array" }
  }

  const { fields } = parsed.value
  if (!Array.isArray(fields)) {
    return { ok: false, error: "schema.json: \"fields\" must be an array" }
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (!isPlainObject(field)) {
      return { ok: false, error: `schema.json: fields[${i}] must be an object` }
    }
    if (typeof field.key !== "string" || !field.key.trim()) {
      return { ok: false, error: `schema.json: fields[${i}] needs a non-empty "key"` }
    }
    if (typeof field.type !== "string") {
      return { ok: false, error: `schema.json: fields[${i}] ("${field.key}") needs a "type"` }
    }
    if (field.options !== undefined && !Array.isArray(field.options)) {
      return { ok: false, error: `schema.json: fields[${i}] ("${field.key}") — "options" must be an array` }
    }
  }

  return { ok: true, value: parsed.value as unknown as SchemaDoc }
}

export type TemplateJsonIssue = { pane: "theme.json" | "schema.json"; message: string }

function checkPane(
  pane: TemplateJsonIssue["pane"],
  raw: string,
  parse: (v: string) => ParseResult<unknown>,
): TemplateJsonIssue | null {
  if (!raw.trim()) return { pane, message: `${pane} is empty` }
  const result = parse(raw)
  return result.ok ? null : { pane, message: result.error }
}

/**
 * Whether the editor's JSON panes are in a state worth saving, and if not, which
 * one to blame. Save is gated on this because the panes only commit valid JSON
 * into the live template: while one is broken, `template` still holds the last
 * good version, so saving would quietly persist something other than what the
 * admin is looking at — the worst possible outcome. Returns null when fine.
 */
export function findTemplateJsonIssue(themeJson: string, schemaJson: string): TemplateJsonIssue | null {
  return checkPane("theme.json", themeJson, parseThemeJson) ?? checkPane("schema.json", schemaJson, parseSchemaJson)
}
