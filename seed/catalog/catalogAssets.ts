export const CATALOG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #f5f7fa;
    --surface: #ffffff;
    --surface-alt: #f8fafc;
    --border: #e2e8f0;
    --border-strong: #cbd5e1;
    --text: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --accent: #10b981;
    --accent-light: #d1fae5;
    --accent-text: #065f46;
    --primary: #4f46e5;
    --primary-light: #eef2ff;
    --primary-hover: #4338ca;
    --primary-text: #ffffff;
    --warning-bg: #fffbeb;
    --warning-border: #fcd34d;
    --warning-text: #92400e;
    --section-header-bg: #f1f5f9;
    --section-t0-accent: #4f46e5;
    --section-lec-accent: #0891b2;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --shadow-sm: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
    --shadow-md: 0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── TOP BAR ── */
  .topbar {
    background: #ffffff;
    border-bottom: 1px solid var(--border);
    padding: 0 2rem;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-sm);
  }
  .topbar-logo {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .topbar-logo svg { width: 18px; height: 18px; fill: #fff; }
  .topbar-titles { flex: 1; }
  .topbar h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text);
  }
  .topbar-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 400;
    letter-spacing: 0;
  }
  .topbar-badge {
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    border: 1px solid #c7d2fe;
    letter-spacing: 0.02em;
  }

  /* ── LAYOUT ── */
  .layout {
    max-width: 1160px;
    margin: 0 auto;
    padding: 1.75rem 2rem 3rem;
  }

  /* ── TOOLBAR ── */
  .toolbar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    align-items: center;
  }
  .search-wrap {
    flex: 1;
    position: relative;
  }
  .search-wrap svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--text-muted);
    pointer-events: none;
  }
  .toolbar input {
    width: 100%;
    padding: 0.6rem 0.875rem 0.6rem 2.25rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-family: inherit;
    color: var(--text);
    background: var(--surface);
    box-shadow: var(--shadow-sm);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .toolbar input::placeholder { color: var(--text-muted); }
  .toolbar input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  }

  /* ── SECTION GROUPING ── */
  .section-group {
    margin-bottom: 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    background: var(--surface);
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.9rem 1.25rem;
    background: var(--section-header-bg);
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    user-select: none;
    transition: background 0.12s;
  }
  .section-header:hover { background: #e8edf5; }
  .section-pip {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .section-group[data-section="t0"] .section-pip { background: var(--section-t0-accent); }
  .section-group[data-section="lectures"] .section-pip { background: var(--section-lec-accent); }
  .section-title {
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--text-secondary);
    flex: 1;
  }
  .section-group[data-section="t0"] .section-title { color: var(--section-t0-accent); }
  .section-group[data-section="lectures"] .section-title { color: var(--section-lec-accent); }
  .section-count {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 0.1rem 0.5rem;
  }
  .section-chevron {
    color: var(--text-muted);
    transition: transform 0.2s ease;
    width: 16px;
    height: 16px;
  }
  .section-group.is-collapsed .section-chevron { transform: rotate(-90deg); }
  .section-body { display: flex; flex-direction: column; gap: 0; }
  .section-group.is-collapsed .section-body { display: none; }

  /* ── FLOW ITEM ── */
  .flow-list { display: flex; flex-direction: column; gap: 0.65rem; }
  .flow-item {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    overflow: hidden;
    transition: background 0.1s;
  }
  .flow-item:last-child { border-bottom: none; }
  .flow-row { display: flex; align-items: stretch; }
  .flow-item.is-open .flow-row { border-bottom: 1px solid var(--border); }

  .flow-toggle {
    flex: 1;
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    gap: 0.875rem;
    align-items: center;
    padding: 0.875rem 1.25rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    transition: background 0.12s;
    min-width: 0;
  }
  .flow-toggle:hover { background: #f8fafc; }
  .flow-item.is-open .flow-toggle { background: #f8fafc; }

  .flow-badge {
    background: var(--accent-light);
    color: var(--accent-text);
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    border: 1px solid #a7f3d0;
  }
  .flow-badge.lec {
    background: #e0f2fe;
    color: #0c4a6e;
    border-color: #bae6fd;
  }

  .flow-id {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .flow-summary {
    color: var(--text-secondary);
    font-size: 0.8375rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
  }

  .chevron {
    color: var(--text-muted);
    transition: transform 0.18s ease;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .flow-item.is-open .chevron { transform: rotate(90deg); }

  /* ── LOGIN BUTTON ── */
  .btn {
    border: none;
    border-radius: var(--radius-sm);
    font-family: inherit;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  }
  .btn-login {
    margin: 0.625rem 1rem 0.625rem 0;
    padding: 0.4rem 0.875rem;
    background: var(--primary);
    color: var(--primary-text);
    align-self: center;
    white-space: nowrap;
    letter-spacing: 0.01em;
    box-shadow: 0 1px 3px rgba(79,70,229,0.3);
  }
  .btn-login:hover:not(:disabled) {
    background: var(--primary-hover);
    box-shadow: 0 2px 8px rgba(79,70,229,0.35);
    transform: translateY(-1px);
  }
  .btn-login:active:not(:disabled) { transform: translateY(0); }
  .btn-login:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
  .btn-login-user {
    padding: 0.25rem 0.5rem;
    font-size: 0.72rem;
    box-shadow: 0 1px 2px rgba(79,70,229,0.2);
  }

  /* ── FLOW PANEL ── */
  .flow-panel {
    padding: 1.5rem;
    background: var(--surface-alt);
    border-top: 0;
  }
  .flow-panel:not([hidden]) {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }
  .panel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.75rem;
    align-items: start;
  }
  .panel-section { margin-bottom: 0; }

  .panel-section h3 {
    margin: 0 0 0.875rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .panel-section h3::before {
    content: '';
    display: block;
    width: 4px;
    height: 14px;
    background: var(--primary);
    border-radius: 4px;
    flex-shrink: 0;
  }

  .panel-section pre {
    margin: 0;
    padding: 0.75rem 1rem;
    background: #1e293b;
    color: #e2e8f0;
    border-radius: var(--radius-md);
    overflow-x: auto;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.78rem;
    line-height: 1.7;
    box-shadow: var(--shadow-sm);
  }
  .panel-section pre code {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    background: none;
    padding: 0;
    border-radius: 0;
  }

  /* ── SEED COMMAND BLOCKS ── */
  .cmd-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .cmd-block {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .cmd-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-muted);
    padding-left: 0.25rem;
    letter-spacing: 0.01em;
  }
  .cmd-row {
    display: flex;
    align-items: center;
    gap: 0;
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .cmd-text {
    flex: 1;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 500;
    color: #0f172a;
    background: none;
    border: none;
    padding: 0.6rem 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }
  .cmd-copy {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-left: 1px solid var(--border);
    cursor: pointer;
    color: var(--text-muted);
    transition: background 0.12s, color 0.12s;
    border-radius: 0;
  }
  .cmd-copy:hover {
    background: var(--primary-light);
    color: var(--primary);
  }
  .cmd-copy.copied {
    color: var(--accent);
    background: var(--accent-light);
  }
  .cmd-copy svg {
    width: 14px;
    height: 14px;
  }

  /* ── TABLES ── */
  .table-wrap {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.825rem;
  }
  th, td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  th {
    background: #f1f5f9;
    font-weight: 600;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  td { color: var(--text); }
  tr:hover td { background: #f8fafc; }

  /* ── INLINE CODE ── */
  code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.78em;
    background: #f1f5f9;
    color: #be123c;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  /* ── MISC ── */
  .note {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0 0 0.625rem;
    line-height: 1.5;
  }
  .muted { color: var(--text-muted); }
  .empty {
    text-align: center;
    color: var(--text-muted);
    padding: 3rem 1rem;
    font-size: 0.875rem;
  }
  .warn {
    background: var(--warning-bg);
    border: 1px solid var(--warning-border);
    color: var(--warning-text);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1.25rem;
    font-size: 0.8375rem;
    line-height: 1.5;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .warn::before { content: '⚠️'; flex-shrink: 0; font-size: 1em; line-height: 1.6; }

  /* ── ROLE BADGE ── */
  .role-pill {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .role-pill.student { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  .role-pill.admin { background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8; }
  .role-pill.default { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

  /* ── ANIMATIONS ── */
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .flow-panel:not([hidden]) {
    animation: fadeSlideIn 0.18s ease;
  }
`

export const CATALOG_SCRIPT = `
  const TOKEN = window.__SEED_CATALOG__.secretLoginToken;
  const API_BASE = window.__SEED_CATALOG__.apiBase || '';

  // ── Copy-to-clipboard for seed command blocks ──
  const COPY_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="9" rx="1.2"/><path d="M3 11H2.5A1.5 1.5 0 0 1 1 9.5v-7A1.5 1.5 0 0 1 2.5 1h7A1.5 1.5 0 0 1 11 2.5V3"/></svg>';
  const CHECK_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 8 6 12 14 4"/></svg>';

  document.querySelectorAll('.cmd-copy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cmd = btn.getAttribute('data-cmd') || '';
      navigator.clipboard.writeText(cmd).then(() => {
        btn.innerHTML = CHECK_ICON;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove('copied');
        }, 1500);
      }).catch(() => {
        // Fallback: select text in adjacent code element
        const row = btn.closest('.cmd-row');
        const text = row && row.querySelector('.cmd-text');
        if (text) {
          const range = document.createRange();
          range.selectNodeContents(text);
          const sel = window.getSelection();
          sel && sel.removeAllRanges();
          sel && sel.addRange(range);
        }
      });
    });
  });

  function secretLoginUrl(userId, email) {
    if (!TOKEN) return null;
    const params = new URLSearchParams({ token: TOKEN });
    const id = String(userId || '').trim();
    const mail = String(email || '').trim();
    if (id) params.set('userId', id);
    else if (mail) params.set('email', mail);
    else return null;
    return API_BASE + '/api/secret-login?' + params.toString();
  }

  function handleLogin(btn) {
    const url = secretLoginUrl(btn.getAttribute('data-user-id'), btn.getAttribute('data-user-email'));
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function wireLoginButtons(root) {
    root.querySelectorAll('.btn-login').forEach((btn) => {
      if (btn.dataset.wired === '1') return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        handleLogin(btn);
      });
    });
  }

  function applySeedState(state) {
    if (!state || typeof state !== 'object') return;
    document.querySelectorAll('.flow-item').forEach((item) => {
      const flowId = item.getAttribute('data-flow-id');
      const flowState = state[flowId];
      if (!flowState || !Array.isArray(flowState.testUsers)) return;

      const byRole = new Map(flowState.testUsers.map((user) => [user.role, user]));
      item.querySelectorAll('[data-user-role]').forEach((el) => {
        const role = el.getAttribute('data-user-role');
        const user = byRole.get(role);
        if (!user) return;
        if (el.classList.contains('btn-login')) {
          el.setAttribute('data-user-id', String(user.userId));
          el.disabled = !TOKEN;
        }
        const row = el.closest('tr');
        const idCell = row && row.querySelector('.user-id-cell');
        if (idCell) {
          idCell.textContent = String(user.userId);
          idCell.classList.remove('muted');
        }
      });
    });
  }

  async function hydrateFromSeedState() {
    try {
      const res = await fetch('seed-state.json', { cache: 'no-store' });
      if (!res.ok) return;
      applySeedState(await res.json());
    } catch {
      // seed-state.json is optional until first seed run
    }
  }

  // Wire section collapse toggles
  document.querySelectorAll('.section-header').forEach((header) => {
    header.addEventListener('click', () => {
      const group = header.closest('.section-group');
      group.classList.toggle('is-collapsed');
      const isCollapsed = group.classList.contains('is-collapsed');
      header.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    });
  });

  // Wire flow item toggles
  wireLoginButtons(document);
  document.querySelectorAll('.flow-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const item = toggle.closest('.flow-item');
      const panel = item.querySelector('.flow-panel');
      const open = item.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
    });
  });

  // Search — searches across all sections, shows/hides section group if no matches
  const search = document.getElementById('flow-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    document.querySelectorAll('.section-group').forEach((group) => {
      let anyVisible = false;
      group.querySelectorAll('.flow-item').forEach((item) => {
        const hay = item.getAttribute('data-search') || '';
        const match = !q || hay.includes(q);
        item.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });
      group.style.display = anyVisible ? '' : 'none';
      // Auto-expand sections when searching
      if (q && anyVisible) {
        group.classList.remove('is-collapsed');
      }
    });
  });

  if (window.location.protocol === 'file:') {
    const warn = document.createElement('div');
    warn.className = 'warn';
    warn.innerHTML = 'Opened as a local file — Login will not work. Use <code>http://localhost:3002/seed-catalog/</code> while the dev server is running.';
    document.querySelector('.layout')?.prepend(warn);
  }

  hydrateFromSeedState();
`
