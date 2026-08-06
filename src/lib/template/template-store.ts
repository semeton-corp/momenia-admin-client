import type { Template, SectionTypeDef } from "./types"
import { MOCK_TEMPLATE, SECTION_TYPES, SIMPLICITY_TEMPLATE, SIMPLICITY_SECTIONS } from "./mock-data"

const TEMPLATES_KEY = "tm:templates"

export type StoredTemplate = {
  template: Template
  sectionTypes: Record<string, SectionTypeDef>
  updatedAt: string
}

function load(): Record<string, StoredTemplate> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? "{}") as Record<string, StoredTemplate>
  } catch {
    return {}
  }
}

function save(all: Record<string, StoredTemplate>) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all))
}

export function listTemplates(): StoredTemplate[] {
  const all = load()
  // Always include built-in templates if not overridden
  if (!all[MOCK_TEMPLATE.id]) {
    all[MOCK_TEMPLATE.id] = {
      template: MOCK_TEMPLATE,
      sectionTypes: SECTION_TYPES,
      updatedAt: new Date().toISOString(),
    }
  }
  if (!all[SIMPLICITY_TEMPLATE.id]) {
    all[SIMPLICITY_TEMPLATE.id] = {
      template: SIMPLICITY_TEMPLATE,
      sectionTypes: SIMPLICITY_SECTIONS,
      updatedAt: new Date().toISOString(),
    }
  }
  return Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getTemplate(id: string): StoredTemplate | null {
  if (id === MOCK_TEMPLATE.id) {
    const all = load()
    return all[id] ?? { template: MOCK_TEMPLATE, sectionTypes: SECTION_TYPES, updatedAt: new Date().toISOString() }
  }
  if (id === SIMPLICITY_TEMPLATE.id) {
    const all = load()
    return all[id] ?? { template: SIMPLICITY_TEMPLATE, sectionTypes: SIMPLICITY_SECTIONS, updatedAt: new Date().toISOString() }
  }
  return load()[id] ?? null
}

export function saveTemplate(template: Template, sectionTypes: Record<string, SectionTypeDef>) {
  const all = load()
  all[template.id] = { template, sectionTypes, updatedAt: new Date().toISOString() }
  save(all)
}

export function deleteTemplate(id: string) {
  const all = load()
  delete all[id]
  save(all)
}

export function createBlankTemplate(id: string, name: string): StoredTemplate {
  const template: Template = {
    id,
    name,
    theme_defaults: {
      color_primary: "#1a1a1a",
      color_accent: "#c9a96e",
      color_background: "#fafaf8",
      font_title: "Playfair Display",
      font_body: "Inter",
    },
    pages: [
      {
        id: "cover",
        label: "Cover",
        sections: [],
      },
      {
        id: "main",
        label: "Main Invitation",
        sections: [],
      },
    ],
    schema: { fields: [] },
  }

  const sectionTypes: Record<string, SectionTypeDef> = {}

  return { template, sectionTypes, updatedAt: new Date().toISOString() }
}

export function exportTemplate(template: Template, sectionTypes: Record<string, SectionTypeDef>): string {
  return JSON.stringify({ template, sectionTypes }, null, 2)
}
