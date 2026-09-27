export type SectionConfig = {
  id: string
  section_type_id: string
}

export type PageDef = {
  id: string
  label: string
  sections: SectionConfig[]
}

export type FieldType = "text" | "date" | "time" | "image" | "audio" | "color" | "textarea" | "select"

export type FieldSchema = {
  key: string
  label: string
  type: FieldType
  section: string
  required: boolean
  placeholder?: string
  // Only meaningful when type === "select" — the choices the editor renders in the
  // dropdown. Saved as a plain string into fieldValues, same as any other field.
  options?: string[]
}

export type Theme = {
  color_primary: string
  color_accent: string
  color_background: string
  font_title: string
  font_body: string
}

export type Template = {
  id: string
  name: string
  theme_defaults: Theme
  pages: PageDef[]
  schema: {
    fields: FieldSchema[]
  }
}

export type SectionTypeDef = {
  id: string
  html: string
  css: string
  js: string
  schema: {
    slots: string[]
    styles: string[]
  }
}

export type UserData = Record<string, string>

export type Invitation = {
  id: string
  templateId: string
  theme: Theme
  sectionOrder: string[]
  userData: UserData
}
