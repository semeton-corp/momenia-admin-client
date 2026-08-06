export type SectionConfig = {
  id: string
  section_type_id: string
}

export type PageDef = {
  id: string
  label: string
  sections: SectionConfig[]
}

export type FieldType = "text" | "date" | "time" | "image" | "audio" | "color" | "textarea"

export type FieldSchema = {
  key: string
  label: string
  type: FieldType
  section: string
  required: boolean
  placeholder?: string
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
