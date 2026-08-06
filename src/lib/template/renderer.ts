import type {
  SectionTypeDef,
  SectionConfig,
  Template,
  Invitation,
  Theme,
} from "./types"

const FALLBACK_THEME: Theme = {
  color_primary: "#1a1a1a",
  color_accent: "#d4af37",
  color_background: "#ffffff",
  font_title: "Playfair Display",
  font_body: "Inter",
}

/**
 * Standalone document shown in the preview pane when rendering blows up, so a
 * bad paste degrades to a visible message instead of crashing the editor.
 */
export function renderPreviewError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const safe = message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font:13px/1.6 ui-monospace,monospace;background:#1a1a1a;color:#f87171">
  <strong>Preview failed to render</strong>
  <p style="margin-top:12px;color:#d4d4d4;white-space:pre-wrap">${safe}</p>
</body></html>`
}

export function renderSection(
  sectionDef: SectionTypeDef,
  _sectionConfig: SectionConfig,
  userData: Record<string, string>,
): { html: string; css: string; js: string } {
  let html = sectionDef.html ?? ""

  Object.entries(userData).forEach(([key, val]) => {
    html = html.replaceAll(`{{${key}}}`, val ?? "")
  })

  return { html, css: sectionDef.css ?? "", js: sectionDef.js ?? "" }
}

export function buildThemeCSS(theme: Theme): string {
  // The editor lets users paste arbitrary JSON into theme.json, so the parsed
  // value may be null or missing keys — fall back instead of throwing.
  const t = { ...FALLBACK_THEME, ...(theme ?? {}) }

  return `:root {
    --color-primary: ${t.color_primary};
    --color-accent: ${t.color_accent};
    --color-background: ${t.color_background};
    --font-title: '${t.font_title}', serif;
    --font-body: '${t.font_body}', sans-serif;
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
  // ── Guest interaction preview (data-momenia-*) ───────────────────────────
  // In production the real invitation posts these submits up to the app, which
  // owns the endpoints. There is no host here, so this stub fakes a signed-in
  // guest with sample messages — enough for an author to see and style RSVP and
  // guestbook sections. Nothing is sent anywhere.
  var MOCK_GUEST = 'Haidai';
  var MOCK_MESSAGES = [
    { name: 'Haidai',       message: 'Selamat menempuh hidup baru! Bahagia selalu.', messageAt: '2 jam lalu' },
    { name: 'Rina Astuti',  message: 'Turut berbahagia, semoga samawa ya!',          messageAt: 'Kemarin' }
  ];

  function when(root, name, on){
    root.querySelectorAll('[data-momenia-when="'+name+'"]').forEach(function(el){
      el.style.display = on ? '' : 'none';
    });
  }

  function initGuestPreview(){
    // Preview always behaves as though the link carries a guestInvitationId,
    // otherwise the author would only ever see the "no-guest" fallback.
    when(document, 'guest', true);
    when(document, 'no-guest', false);
    document.querySelectorAll('[data-momenia-text="guestName"]').forEach(function(el){
      el.textContent = MOCK_GUEST;
    });

    document.querySelectorAll('[data-momenia-form]').forEach(function(form){
      when(form, 'sending', false);
      when(form, 'success', false);
      when(form, 'error', false);
    });

    document.querySelectorAll('[data-momenia-list="messages"]').forEach(function(list){
      when(list, 'empty', MOCK_MESSAGES.length === 0);
      var tpl = list.querySelector('template[data-momenia-item]');
      if(!tpl) return;
      MOCK_MESSAGES.forEach(function(item){
        var node = tpl.content.cloneNode(true).firstElementChild;
        if(!node) return;
        node.querySelectorAll('[data-momenia-text]').forEach(function(el){
          var val = item[el.getAttribute('data-momenia-text')];
          if(val === undefined || val === null || val === ''){ el.style.display = 'none'; return; }
          el.textContent = val;
        });
        list.appendChild(node);
      });
    });

    document.addEventListener('submit', function(e){
      var form = e.target && e.target.closest ? e.target.closest('[data-momenia-form]') : null;
      if(!form) return;
      e.preventDefault();
      when(form, 'error', false);
      when(form, 'sending', true);
      setTimeout(function(){
        when(form, 'sending', false);
        when(form, 'success', true);
        reportHeight();
      }, 500);
    }, true);

    reportHeight();
  }

  if(document.readyState==='complete'){ init(); initGuestPreview(); }
  else{ window.addEventListener('load', function(){ init(); initGuestPreview(); }); }
  try{ new ResizeObserver(reportHeight).observe(document.body); }catch(e){}
})();`

export function renderInvitation(
  template: Template,
  invitation: Invitation,
  sectionTypes: Record<string, SectionTypeDef>,
  guestName?: string
): string {
  const pages = Array.isArray(template?.pages) ? template.pages : []
  const { theme, userData, sectionOrder } = invitation

  const effectiveUserData = { ...userData }
  if (guestName) effectiveUserData.guest_name = guestName

  const themeCSS = buildThemeCSS(theme)
  const safeTheme = { ...FALLBACK_THEME, ...(theme ?? {}) }
  const allCSS: string[] = []
  const allJS: string[] = []
  const pageBlocks: string[] = []

  for (const page of pages) {
    const isMain = page.id === "main"

    const pageSections = Array.isArray(page?.sections) ? page.sections : []

    const orderedSections = isMain
      ? (sectionOrder ?? [])
          .map((id) => pageSections.find((s) => s.id === id))
          .filter((s): s is (typeof pageSections)[number] => Boolean(s))
      : pageSections

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

  const fontTitle = encodeURIComponent(safeTheme.font_title)
  const fontBody = encodeURIComponent(safeTheme.font_body)

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
