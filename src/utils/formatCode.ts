// Prettier's standalone build + plugins run entirely in the browser (no Node
// APIs), and are dynamically imported so they only load when actually needed
// — e.g. when a template is imported — instead of bloating the main bundle.

async function loadFormatter() {
  const [{ default: prettier }, html, postcss, babel, estree] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/html"),
    import("prettier/plugins/postcss"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
  ])
  return { prettier, plugins: [html.default, postcss.default, babel.default, estree.default] }
}

let formatterPromise: ReturnType<typeof loadFormatter> | null = null
function getFormatter() {
  formatterPromise ??= loadFormatter()
  return formatterPromise
}

async function format(code: string, parser: "html" | "css" | "babel" | "json"): Promise<string> {
  if (!code.trim()) return code
  try {
    const { prettier, plugins } = await getFormatter()
    return await prettier.format(code, { parser, plugins, printWidth: 100 })
  } catch {
    // Malformed/partial snippets (e.g. a template fragment) fail to parse —
    // fall back to the original rather than losing the user's content.
    return code
  }
}

export const formatHtml = (code: string) => format(code, "html")
export const formatCss = (code: string) => format(code, "css")
export const formatJs = (code: string) => format(code, "babel")
export const formatJson = (code: string) => format(code, "json")
