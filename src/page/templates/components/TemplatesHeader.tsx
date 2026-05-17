import { useNavigate } from "react-router-dom"
import { type InvitationTemplate } from "@/api/cms/invitation-templates"

export function TemplatesHeader({ templates }: { templates: InvitationTemplate[] }) {
  const navigate = useNavigate()

  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-foreground">Template List</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={() => console.log("Templates data:", templates)}
          className="flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Log Templates
        </button>
        <button
          onClick={() => navigate("/templates/add")}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Template
        </button>
      </div>
    </div>
  )
}
