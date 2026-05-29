import { useNavigate } from "react-router-dom"

export function TemplatesHeader() {
  const navigate = useNavigate()

  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-foreground">Template List</h1>
      <div className="flex items-center gap-2">
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
