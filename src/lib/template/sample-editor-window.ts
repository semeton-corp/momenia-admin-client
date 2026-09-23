import type { Invitation, SectionTypeDef, Template } from "./types"

export const SAMPLE_EDITOR_STORAGE_PREFIX = "memoria_template_sample:"

export type TemplateSampleSnapshot = {
  template: Template
  sectionTypes: Record<string, SectionTypeDef>
  invitation: Invitation
}

/**
 * Opens an intentionally isolated, browser-only sample editor. The snapshot is
 * copied into the new tab's sessionStorage; it is never sent to the API.
 */
export function openTemplateSampleEditor(snapshot: TemplateSampleSnapshot) {
  const sessionId = crypto.randomUUID()
  sessionStorage.setItem(`${SAMPLE_EDITOR_STORAGE_PREFIX}${sessionId}`, JSON.stringify(snapshot))
  // A tab gets a copy of its opener's sessionStorage at creation time. Do not use
  // `noopener` in window.open here: it prevents that one-time copy. Once the tab
  // exists, sever the opener reference so the sample workspace stays independent.
  const popup = window.open(`/templates/sample-editor?session=${encodeURIComponent(sessionId)}`, "_blank")
  if (popup) {
    popup.opener = null
    // The child already received its copy. Keep the source tab free of stale test data.
    sessionStorage.removeItem(`${SAMPLE_EDITOR_STORAGE_PREFIX}${sessionId}`)
  }
}
