import type {
  SectionTypeDef,
  SectionConfig,
  Template,
  Invitation,
  Theme,
} from "./types"

export function renderSection(
  sectionDef: SectionTypeDef,
  _sectionConfig: SectionConfig,
  userData: Record<string, string>,
): { html: string; css: string; js: string } {
  let html = sectionDef.html

  Object.entries(userData).forEach(([key, val]) => {
    html = html.replaceAll(`{{${key}}}`, val ?? "")
  })

  return { html, css: sectionDef.css, js: sectionDef.js }
}

export function buildThemeCSS(theme: Theme): string {
  return `:root {
    --color-primary: ${theme.color_primary};
    --color-accent: ${theme.color_accent};
    --color-background: ${theme.color_background};
    --font-title: '${theme.font_title}', serif;
    --font-body: '${theme.font_body}', sans-serif;
  }`
}

// Runtime script embedded in every rendered invitation.
// Responsibilities:
//   - window.__memoriaGoTo(pageId) — show a page by id, hide all others
//   - postMessage "memoriaGoTo" { pageId } — same, triggered from parent (admin preview)
//   - postMessage "memoriaUpdate" — live-update data-field slots and CSS vars
//   - postMessage "memoriaResize" — reports body height back to parent
const RUNTIME_SCRIPT = `(function(){
  function getPages(){
    return Array.from(document.querySelectorAll('[data-memoria-page]'));
  }
  function reportHeight(){
    var pages = getPages();
    var active = pages.find(function(el){ return el.style.display !== 'none'; }) || pages[0];
    // First page is always fullscreen — report fixed height to avoid resize loop
    var isFirst = active && active === pages[0];
    var h = isFirst ? 812 : (active ? active.scrollHeight : document.body.scrollHeight);
    window.parent.postMessage({type:'memoriaResize', height: h}, '*');
  }
  window.__memoriaGoTo = function(pageId){
    getPages().forEach(function(el){
      el.style.display = el.dataset.memoriaPage === pageId ? 'block' : 'none';
    });
    setTimeout(reportHeight, 40);
  };
  function init(){
    // Show only the first page on load
    var pages = getPages();
    pages.forEach(function(el, i){ el.style.display = i === 0 ? 'block' : 'none'; });
    reportHeight();
  }
  window.addEventListener('message', function(e){
    if(!e.data) return;
    var d = e.data;
    if(d.type === 'memoriaGoTo' && d.pageId){
      window.__memoriaGoTo(d.pageId);
    }
    if(d.type === 'memoriaUpdate'){
      var u = d.userData || {};
      Object.keys(u).forEach(function(k){
        document.querySelectorAll('[data-field="'+k+'"]').forEach(function(el){
          el.textContent = u[k] || '';
        });
        document.querySelectorAll('[data-field-img="'+k+'"]').forEach(function(el){
          var v = u[k] || '';
          el.src = v;
          if(v){ el.style.display = ''; el.style.opacity = ''; }
        });
      });
      if(d.theme){
        var r = document.documentElement, t = d.theme;
        if(t.color_primary)    r.style.setProperty('--color-primary',    t.color_primary);
        if(t.color_accent)     r.style.setProperty('--color-accent',     t.color_accent);
        if(t.color_background) r.style.setProperty('--color-background', t.color_background);
        if(t.font_title)       r.style.setProperty('--font-title',       "'"+t.font_title+"', serif");
        if(t.font_body)        r.style.setProperty('--font-body',        "'"+t.font_body+"', sans-serif");
      }
      reportHeight();
    }
  });
  if(document.readyState==='complete'){ init(); }
  else{ window.addEventListener('load', init); }
  try{ new ResizeObserver(reportHeight).observe(document.body); }catch(e){}
})();`

export function renderInvitation(
  template: Template,
  invitation: Invitation,
  sectionTypes: Record<string, SectionTypeDef>,
  guestName?: string
): string {
  const { pages } = template
  const { theme, userData, sectionOrder } = invitation

  const effectiveUserData = { ...userData }
  if (guestName) effectiveUserData.guest_name = guestName

  const themeCSS = buildThemeCSS(theme)
  const allCSS: string[] = []
  const allJS: string[] = []
  const pageBlocks: string[] = []

  for (const page of pages) {
    const isMain = page.id === "main"

    const orderedSections = isMain
      ? sectionOrder
          .map((id) => page.sections.find((s) => s.id === id))
          .filter((s): s is (typeof page.sections)[number] => Boolean(s))
      : page.sections

    const sectionsHTML: string[] = []
    for (const sectionConfig of orderedSections) {
      const sectionDef = sectionTypes[sectionConfig.section_type_id]
      if (!sectionDef) continue
      const rendered = renderSection(sectionDef, sectionConfig, effectiveUserData)
      allCSS.push(rendered.css)
      sectionsHTML.push(rendered.html)
      if (rendered.js) allJS.push(rendered.js)
    }

    pageBlocks.push(
      `<div data-memoria-page="${page.id}">${sectionsHTML.join("\n")}</div>`
    )
  }

  const fontTitle = encodeURIComponent(theme.font_title)
  const fontBody = encodeURIComponent(theme.font_body)

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=${fontTitle}:ital,wght@0,300;0,400;0,500;0,600;1,300&family=${fontBody}:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    ${themeCSS}
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { background: var(--color-background); color: var(--color-primary); font-family: var(--font-body); }
    ${allCSS.join("\n")}
  </style>
</head>
<body>
  ${pageBlocks.join("\n")}
  ${allJS.length > 0 ? `<script>${allJS.join("\n")}</script>` : ""}
  <script>${RUNTIME_SCRIPT}</script>
</body>
</html>`
}
