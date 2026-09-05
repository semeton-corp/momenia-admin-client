import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Keeps a throw inside the live preview from taking the whole editor route down.
 *
 * The template maker holds a lot of unsaved work — section HTML/CSS/JS, theme and
 * schema JSON — and without a boundary any render-phase error (a malformed schema
 * shape, a renderer bug) escapes to the router's full-page error screen and all of
 * it is gone. Failing to just this pane means the code the admin typed is still
 * there to fix.
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Preview render failed:", error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
          <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Preview failed to render</p>
          <p className="mt-1 text-xs text-muted-foreground">Your template code is safe — fix the input and try again.</p>
        </div>
        <p className="max-w-xs break-words rounded-lg bg-muted p-2 font-mono text-[11px] text-muted-foreground">
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          Retry preview
        </button>
      </div>
    )
  }
}
