export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f4f4f5; margin: 0; color: #1f2328; }
  a { color: #f6821f; }

  .topbar {
    background: white; border-bottom: 3px solid #f6821f; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 10;
  }
  .topbar .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
  .brand-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; flex-shrink: 0; }
  .topbar .brand-name { font-weight: 800; font-size: 1.15rem; color: #1f2328; letter-spacing: -0.01em; }
  .topbar .brand-tagline { font-size: 0.78rem; color: #9aa4b2; font-weight: 500; }
  .topbar nav { display: flex; align-items: center; gap: 20px; }
  .topbar nav a, .topbar nav .link-button {
    color: #4b5563; text-decoration: none; font-size: 0.9rem; font-weight: 500;
    padding: 6px 4px; border-bottom: 2px solid transparent;
  }
  .topbar nav a:hover { color: #f6821f; border-bottom-color: #f6821f; }
  .topbar nav a.signout { color: #b91c1c; }
  .topbar nav a.signout:hover { border-bottom-color: #b91c1c; }

  .page-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
  .center-wrap { max-width: 420px; margin: 8vh auto; padding: 0 24px; }

  .card { background: white; border-radius: 12px; padding: 28px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
  .center-wrap .card { padding: 32px; }

  h1 { font-size: 1.5rem; margin: 0 0 4px 0; font-weight: 700; }
  h2 { font-size: 1.05rem; margin: 0 0 12px 0; font-weight: 600; }
  p.sub { color: #6b7280; font-size: 0.9rem; margin-top: 0; }
  .page-header { margin-bottom: 24px; }
  .header-meta { font-size: 0.95rem; font-weight: 400; color: #6b7280; margin-left: 10px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; margin-bottom: 20px; }
  .two-col .card { margin-bottom: 0; }
  @media (max-width: 720px) { .two-col { grid-template-columns: 1fr; } }
  .breadcrumbs { font-size: 0.85rem; color: #6b7280; margin-bottom: 6px; }
  .breadcrumbs a { color: #6b7280; text-decoration: none; }
  .breadcrumbs a:hover { color: #f6821f; text-decoration: underline; }
  .breadcrumbs span:last-child { color: #1f2328; font-weight: 500; }
  .breadcrumb-sep { color: #d1d5db; margin: 0 2px; }

  label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 4px; color: #374151; }
  input[type=text], input[type=email], input[type=password], input[type=number], select, textarea {
    width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem;
    box-sizing: border-box; margin-bottom: 16px; font-family: inherit;
  }
  input:focus, select:focus, textarea:focus { outline: none; border-color: #f6821f; }
  input[type=date] { padding-right: 8px; }
  input[type=date]::-webkit-calendar-picker-indicator {
    cursor: pointer; padding: 5px; margin-left: 6px; border-radius: 6px; opacity: 0.55;
  }
  input[type=date]::-webkit-calendar-picker-indicator:hover { opacity: 1; background: #f1f2f4; }
  select {
    padding-right: 32px; appearance: none; -webkit-appearance: none; -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
  }
  .field-row { display: flex; gap: 12px; }
  .field-row > * { flex: 1; }

  button { padding: 9px 16px; border-radius: 8px; border: none; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
  .primary { background: #f6821f; color: white; }
  .primary:hover { background: #e07419; }
  .secondary { background: #f1f2f4; color: #333; }
  .secondary:hover { background: #e5e7eb; }
  .danger { background: #fee2e2; color: #b91c1c; }
  .danger:hover { background: #fecaca; }

  .error { color: #b91c1c; font-size: 0.9rem; margin-bottom: 12px; }
  .success { color: #15803d; font-size: 0.9rem; margin-bottom: 12px; }
  .muted { color: #6b7280; font-size: 0.85rem; }
  .row { display: flex; justify-content: flex-end; margin-top: 8px; gap: 8px; }
  .row.between { justify-content: space-between; align-items: center; }

  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef0f2; font-size: 0.88rem; }
  th { color: #6b7280; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.03em; }
  tr:last-child td { border-bottom: none; }

  body { padding-bottom: 44px; }
  .demo-disclaimer {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
    text-align: center; font-size: 0.8rem; color: #92400e; background: #fffbeb;
    border-top: 1px solid #fde68a; padding: 10px 16px;
  }
  .demo-disclaimer a { color: #92400e; font-weight: 600; text-decoration: underline; }

  .badge { display: inline-block; padding: 2px 9px; border-radius: 12px; font-size: 0.72rem; font-weight: 600; }
  .badge-active { background: #dcfce7; color: #15803d; }
  .badge-disabled { background: #fee2e2; color: #b91c1c; }
  .badge-revoked { background: #fee2e2; color: #b91c1c; }
  .badge-admin { background: #fef3c7; color: #92400e; }
  .pill { display: inline-block; background: #f1f2f4; color: #374151; border-radius: 12px; padding: 2px 10px; font-size: 0.78rem; margin: 0 4px 4px 0; }

  .link-button { background: none; border: none; color: #f6821f; cursor: pointer; padding: 0; text-decoration: underline; font-size: inherit; font-weight: 400; }
  code { background: #f1f2f4; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }

  .stat-grid { display: flex; gap: 16px; }
  .stat-card { flex: 1; text-decoration: none; color: inherit; }
  .stat-card .card { text-align: center; }
  .stat-card h2 { font-size: 2rem; margin: 0; color: #f6821f; }
  .stat-card p { margin: 4px 0 0 0; color: #6b7280; font-size: 0.85rem; }

  .admin-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .admin-tabs a {
    padding: 7px 14px; border-radius: 8px; text-decoration: none; font-size: 0.88rem; font-weight: 500;
    background: white; color: #374151; border: 1px solid #d1d5db;
  }
  .admin-tabs a:hover { background: #f9fafb; border-color: #9aa4b2; }
  .admin-tabs a.active { background: #f6821f; color: white; border-color: #f6821f; }

  /* Searchable multi-select (typeahead: pills + search box, dropdown only while searching) */
  .multiselect { position: relative; margin-bottom: 16px; }
  .multiselect-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .multiselect-chips:not(:empty) { margin-bottom: 8px; }
  .multiselect-chip { background: #f6821f; color: white; border-radius: 12px; padding: 3px 6px 3px 10px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; }
  .multiselect-chip button { background: none; border: none; color: white; padding: 0; cursor: pointer; font-size: 0.9rem; line-height: 1; }
  .multiselect-search { margin-bottom: 0 !important; }
  .multiselect-options {
    display: none; position: absolute; left: 0; right: 0; top: 100%; margin-top: 4px; z-index: 20;
    max-height: 220px; overflow-y: auto; background: white; border: 1px solid #d1d5db; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 6px;
  }
  .multiselect-options.open { display: block; }
  .multiselect-option { display: block; font-weight: 400; font-size: 0.88rem; padding: 6px 8px; margin-bottom: 0; cursor: pointer; border-radius: 6px; }
  .multiselect-option:hover { background: #f9fafb; }
  .multiselect-option input { width: auto; margin: 0 6px 0 0; display: inline; vertical-align: middle; }
  .multiselect-option.hidden { display: none; }
  .multiselect-option.selected { display: none; }

  /* Copy-to-clipboard buttons */
  .copy-btn {
    background: #f1f2f4; color: #374151; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 3px 10px; font-size: 0.78rem; cursor: pointer; white-space: nowrap;
  }
  .copy-btn:hover { background: #e5e7eb; }
  .copy-btn.copied { background: #dcfce7; color: #15803d; border-color: #86efac; }

  /* Prominent one-time secret display */
  .secret-block { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin: 14px 0; }
  .secret-block-label { font-size: 0.8rem; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 8px; }
  .secret-block-value { display: flex; align-items: center; gap: 10px; }
  .secret-block-value code { font-size: 1rem; padding: 6px 10px; background: white; }

  /* Expandable audit log rows */
  .audit-row { cursor: pointer; }
  .audit-row:hover { background: #f9fafb; }
  .audit-detail { display: none; }
  .audit-detail.open { display: table-row; }
  .audit-detail td { background: #f9fafb; padding: 10px 12px 14px 12px; }
  .audit-detail-content { font-size: 0.85rem; color: #374151; display: flex; flex-direction: column; gap: 4px; }
  .audit-detail-content code { white-space: pre-wrap; word-break: break-all; }

  /* "Saved" success confirmation banner */
  .success-banner {
    background: #dcfce7; color: #15803d; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;
    font-size: 0.9rem; font-weight: 500;
  }
`;

const MULTISELECT_SCRIPT = `
function msSync(root) {
  const chipsEl = root.querySelector('.multiselect-chips');
  const boxes = [...root.querySelectorAll('input[type=checkbox]')];
  chipsEl.innerHTML = boxes.filter(b => b.checked).map(b =>
    '<span class="multiselect-chip">' + b.dataset.label + '<button type="button" data-id="' + b.value + '">\\u00d7</button></span>'
  ).join('');
  chipsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = boxes.find(b => b.value === btn.dataset.id);
      if (box) { box.checked = false; msSync(root); }
    });
  });
  root.querySelectorAll('.multiselect-option').forEach(opt => {
    const box = opt.querySelector('input[type=checkbox]');
    opt.classList.toggle('selected', box.checked);
  });
}
function msFilter(input) {
  const root = input.closest('.multiselect');
  const term = input.value.toLowerCase();
  const optionsEl = root.querySelector('.multiselect-options');
  optionsEl.classList.toggle('open', term.length > 0);
  root.querySelectorAll('.multiselect-option').forEach(opt => {
    const matches = opt.textContent.toLowerCase().includes(term);
    opt.classList.toggle('hidden', !matches);
  });
}
document.querySelectorAll('.multiselect').forEach(root => {
  msSync(root);
  const input = root.querySelector('.multiselect-search');
  root.querySelectorAll('input[type=checkbox]').forEach(b => b.addEventListener('change', () => {
    msSync(root);
    input.value = '';
    root.querySelector('.multiselect-options').classList.remove('open');
  }));
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) root.querySelector('.multiselect-options').classList.remove('open');
  });
});
`;

const COPY_SCRIPT = `
function copyValue(btn) {
  const value = btn.dataset.copy;
  const original = btn.textContent;
  navigator.clipboard.writeText(value).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1500);
  });
}
`;

/** A small inline "Copy" button that copies `value` to the clipboard on click. */
export function copyButton(value: string, label = "Copy"): string {
  return `<button type="button" class="copy-btn" data-copy="${escapeHtml(value)}" onclick="copyValue(this)">${escapeHtml(label)}</button>`;
}

/**
 * A prominent, highlighted box for a secret that's only ever shown once
 * (client secrets, temp passwords, backup codes) - impossible to miss, with
 * a one-click copy button right next to the value.
 */
export function secretBlock(label: string, value: string): string {
  return `
    <div class="secret-block">
      <div class="secret-block-label">${escapeHtml(label)} - copy this now, it won't be shown again</div>
      <div class="secret-block-value">
        <code>${escapeHtml(value)}</code>
        ${copyButton(value)}
      </div>
    </div>
  `;
}

/** A dismissible green success banner, e.g. for showing "Saved" after a redirect-on-save. */
export function successBanner(message: string): string {
  return `<div class="success-banner">${escapeHtml(message)}</div>`;
}

/** A searchable, chip-based multi-select built from plain checkboxes (no build step, works everywhere). */
export function multiSelect(
  name: string,
  options: { id: number | string; label: string }[],
  selectedIds: Set<number | string>,
  placeholder = "Search..."
): string {
  return `
    <div class="multiselect">
      <div class="multiselect-chips"></div>
      <input type="text" class="multiselect-search" placeholder="${escapeHtml(placeholder)}" oninput="msFilter(this)" />
      <div class="multiselect-options">
        ${options
          .map(
            (o) =>
              `<label class="multiselect-option ${selectedIds.has(o.id) ? "selected" : ""}"><input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(String(o.id))}" data-label="${escapeHtml(o.label)}" ${selectedIds.has(o.id) ? "checked" : ""} /> ${escapeHtml(o.label)}</label>`
          )
          .join("")}
      </div>
    </div>
  `;
}

/** Page-size <select> that auto-submits its enclosing GET form (resetting to page 1). */
export function pageSizeSelect(current: number, options: number[] = [20, 50, 100]): string {
  return `<select name="pageSize" onchange="this.closest('form').querySelector('input[name=page]') && (this.closest('form').querySelector('input[name=page]').value = 1); this.form.submit();" style="width:auto; display:inline-block; margin-bottom:0;">
    ${options.map((n) => `<option value="${n}" ${n === current ? "selected" : ""}>${n} / page</option>`).join("")}
  </select>`;
}

/** Prev/Next + page indicator, preserving any extra query params (e.g. search, pageSize). */
export function paginationControls(basePath: string, page: number, totalPages: number, extraParams: Record<string, string | number> = {}): string {
  if (totalPages <= 1) return "";
  const qs = (p: number) => {
    const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(extraParams).map(([k, v]) => [k, String(v)])), page: String(p) });
    return `${basePath}?${params.toString()}`;
  };
  return `<div class="row between" style="margin-top:12px;">
    <span class="muted">Page ${page} of ${totalPages}</span>
    <div style="display:flex; gap:8px;">
      ${page > 1 ? `<a href="${qs(page - 1)}"><button class="secondary" type="button">Previous</button></a>` : `<button class="secondary" type="button" disabled>Previous</button>`}
      ${page < totalPages ? `<a href="${qs(page + 1)}"><button class="secondary" type="button">Next</button></a>` : `<button class="secondary" type="button" disabled>Next</button>`}
    </div>
  </div>`;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export function breadcrumbs(items: Breadcrumb[]): string {
  return `<div class="breadcrumbs">
    ${items
      .map((item, i) => {
        const isLast = i === items.length - 1;
        const crumb = item.href && !isLast ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>` : `<span>${escapeHtml(item.label)}</span>`;
        return i === 0 ? crumb : ` <span class="breadcrumb-sep">/</span> ${crumb}`;
      })
      .join("")}
  </div>`;
}

export function nav(appName: string, isAdmin: boolean): string {
  return `<header class="topbar">
    <a href="/" class="brand">
      <img src="/FlareID_Icon.png" alt="" class="brand-logo" onerror="this.style.display='none'" />
      <span class="brand-name">${escapeHtml(appName)}</span>
      <span class="brand-tagline">Open source, Cloudflare hosted IDP</span>
    </a>
    <nav>
      <a href="/account">My account</a>
      ${isAdmin ? '<a href="/admin">Admin</a>' : ""}
      <form method="POST" action="/logout" style="display:inline"><button class="link-button signout" type="submit">Sign out</button></form>
    </nav>
  </header>`;
}

/**
 * Shown at the bottom of every page. Canonical copy lives in
 * shared-ui/flareid/about-demo.ts - see shared-ui/README.md before editing
 * this directly, since it's duplicated (not imported) across every app.
 */
const DEMO_DISCLAIMER_FOOTER = `
  <footer class="demo-disclaimer">
    <span>⚠️ This is a demo application with fake data - not for production use.</span>
    <a href="/about-demo">Why?</a>
  </footer>
`;

export function page(
  title: string,
  bodyHtml: string,
  appName: string,
  wide = false,
  navHtml = "",
  extraStyles = "",
  extraBodyHtml = ""
): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} - ${escapeHtml(appName)}</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
  <style>${STYLES}</style>
  ${extraStyles ? `<style>${extraStyles}</style>` : ""}
</head>
<body>
  ${navHtml}
  ${extraBodyHtml}
  ${wide ? `<div class="page-wrap">${bodyHtml}</div>` : `<div class="center-wrap"><div class="card">${bodyHtml}</div></div>`}
  ${DEMO_DISCLAIMER_FOOTER}
  <script>${MULTISELECT_SCRIPT}</script>
  <script>${COPY_SCRIPT}</script>
</body>
</html>`;
}

/** Wraps admin/account page bodies in the standard "card" container. */
export function cardSection(innerHtml: string): string {
  return `<div class="card">${innerHtml}</div>`;
}
