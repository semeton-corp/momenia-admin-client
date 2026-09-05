import type { Theme, UserData } from "./types"

/**
 * Full-page template preview, mirroring the user client's `openInvitationPreview`
 * (memoria-user-client/src/lib/invitation-preview.ts) and its `/[locale]/preview`
 * route — same storage handoff, same phone-card-on-wallpaper framing, same
 * postMessage bootstrap. An admin previewing a template sees what a guest sees.
 *
 * The old approach (`window.open("", "_blank")` + `document.write`) painted the
 * invitation across the entire browser window, which is a viewport no guest ever
 * gets: templates switch to their desktop layout above 768px, so a full-width
 * window rendered a layout the phone-shaped real thing never uses.
 */

// Same key the user client uses; the two apps never share an origin, so there's
// no collision — keeping the name identical just makes the pair easy to find.
export const PREVIEW_STORAGE_KEY = "momenia_preview"

// Fallback wallpaper behind the phone-shaped invitation when a template doesn't
// declare its own. Kept byte-identical to the user client's copy so the admin
// preview and the live invitation don't drift apart.
export const DEFAULT_DESKTOP_BACKGROUND = "/background-default-desktop.png"

// Reserved schema-field key: a template opts into a custom desktop wallpaper by
// declaring an image field with exactly this key. Its value flows through
// userData like any other field — no separate theme plumbing.
export const DESKTOP_BACKGROUND_FIELD_KEY = "desktop_background"

// Card width for every "phone-on-a-desktop-wallpaper" surface. Must stay well
// under 768px, where a template's own CSS can switch to a desktop layout that a
// narrow card would clip. Matches DESKTOP_CARD_WIDTH in the user client.
export const DESKTOP_CARD_WIDTH = 440

export type PreviewSnapshot = {
  html: string
  userData: UserData
  theme: Theme
  activePage: string
}

/**
 * Hands the rendered template to the preview tab through sessionStorage rather
 * than a query string — the document runs to hundreds of KB, far past any URL
 * length a browser will accept.
 */
export function openTemplatePreview(
  html: string,
  { userData, theme, activePage }: { userData: UserData; theme: Theme; activePage: string },
): void {
  const snapshot: PreviewSnapshot = { html, userData, theme, activePage }
  sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(snapshot))
  window.open("/templates/preview", "_blank")
}
