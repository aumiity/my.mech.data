/* my.mech.data — shared core
   config · state · helpers · github i/o
   both index.html (view) and entry.html (write) run on top of this. */
window.MECH = (function () {
  'use strict';

  /* ——————————————————————————— config ——————————————————————————— */
  const REPO = { owner: 'aumiity', repo: 'my.mech.data', branch: 'main', path: 'data/keyboards.json' };
  const LS_TOKEN = 'mech.gh.token';
  const LS_CACHE = 'mech.cache.v1';

  const TYPES  = { keyboard:'Keyboard', switches:'Switches', keycaps:'Keycaps',
                   parts:'Parts', accessory:'Accessory' };
  const STATUS = { owned:'Owned', incoming:'Incoming', sold:'Sold', gifted:'Gifted' };

  /* ——————————————————————————— state ——————————————————————————— */
  let STORE = { currency: 'THB', updated_at: null, items: [] };
  let SHA = null;
  let TOKEN = '';
  try { TOKEN = localStorage.getItem(LS_TOKEN) || ''; } catch (e) {}
  let source = 'local';

  /* the page supplies these — core never touches the DOM itself */
  let renderFn = function () {};
  let statusFn = function () {};
  let LAST = { badge: 'local', cls: '', message: '' };

  function status(badge, cls, message) {
    LAST = { badge: badge, cls: cls || '', message: message == null ? LAST.message : message };
    try { statusFn(LAST); } catch (e) {}
  }

  /* ——————————————————————————— helpers ——————————————————————————— */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const money = n => '฿' + num(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const totalOf = it => num(it.cost && it.cost.item) + num(it.cost && it.cost.tax)
                      + num(it.cost && it.cost.shipping);
  const newId = () => 'kb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '0%';

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(String(b64).replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ——————————————————————————— derived data ——————————————————————————— */
  function totals(items) {
    return items.reduce((a, it) => {
      a.item += num(it.cost.item); a.tax += num(it.cost.tax);
      a.shipping += num(it.cost.shipping); a.total += totalOf(it);
      return a;
    }, { item: 0, tax: 0, shipping: 0, total: 0 });
  }
  function groupSum(items, keyFn) {
    const m = new Map();
    for (const it of items) {
      const k = keyFn(it); if (!k) continue;
      m.set(k, (m.get(k) || 0) + totalOf(it));
    }
    return [...m.entries()];
  }

  /* ——————————————————————————— github i/o ——————————————————————————— */
  async function gh(path, opts) {
    opts = opts || {};
    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;
    if (opts.body) headers['Content-Type'] = 'application/json';
    const res = await fetch('https://api.github.com' + path,
      Object.assign({}, opts, { headers: Object.assign(headers, opts.headers || {}) }));
    const text = await res.text();
    if (!res.ok) {
      let msg = res.status + ' ' + res.statusText;
      try { const j = JSON.parse(text); if (j.message) msg = res.status + ' — ' + j.message; } catch (e) {}
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return text ? JSON.parse(text) : null;
  }

  const contentsPath = () =>
    '/repos/' + REPO.owner + '/' + REPO.repo + '/contents/' + REPO.path;

  async function pullFromGitHub() {
    const j = await gh(contentsPath() + '?ref=' + encodeURIComponent(REPO.branch)
                       + '&t=' + Date.now());
    SHA = j.sha;
    return JSON.parse(b64decode(j.content));
  }

  async function pushToGitHub(message) {
    if (!TOKEN) throw new Error('no token set');
    STORE.updated_at = new Date().toISOString();
    const body = {
      message: message,
      content: b64encode(JSON.stringify(STORE, null, 2) + '\n'),
      branch: REPO.branch
    };
    // data may have been loaded without the API (public raw fetch), so there is
    // no sha yet — resolve it, otherwise GitHub rejects the update as a create
    if (!SHA) {
      try {
        const cur = await gh(contentsPath() + '?ref=' + encodeURIComponent(REPO.branch));
        SHA = cur.sha;
      } catch (e) { if (e.status !== 404) throw e; }  // 404 = file not created yet
    }
    if (SHA) body.sha = SHA;
    try {
      const j = await gh(contentsPath(), { method: 'PUT', body: JSON.stringify(body) });
      SHA = j.content.sha;
    } catch (e) {
      if (e.status !== 409 && e.status !== 422) throw e;
      // someone else (or another device) wrote first — refresh sha and retry once
      const fresh = await gh(contentsPath() + '?ref=' + encodeURIComponent(REPO.branch));
      SHA = fresh.sha; body.sha = SHA;
      const j = await gh(contentsPath(), { method: 'PUT', body: JSON.stringify(body) });
      SHA = j.content.sha;
    }
  }

  function normalize(raw) {
    const items = (raw && Array.isArray(raw.items) ? raw.items : []).map(it => ({
      id: it.id || newId(),
      name: String(it.name || 'Untitled'),
      type: TYPES[it.type] ? it.type : 'keyboard',
      vendor: String(it.vendor || ''),
      purchased_at: String(it.purchased_at || ''),
      status: STATUS[it.status] ? it.status : 'owned',
      cost: {
        item: num(it.cost && it.cost.item),
        tax: num(it.cost && it.cost.tax),
        shipping: num(it.cost && it.cost.shipping)
      },
      notes: String(it.notes || ''),
      example: !!it.example
    }));
    return { currency: 'THB', updated_at: (raw && raw.updated_at) || null, items: items };
  }

  function cacheLocal() {
    try { localStorage.setItem(LS_CACHE, JSON.stringify(STORE)); } catch (e) {}
  }

  async function persist(message) {
    cacheLocal();
    if (!TOKEN) {
      status('local only', 'warn',
        'Saved on this device, but <b>not pushed to GitHub</b> — add a token below to sync across devices.');
      return;
    }
    status('syncing…', 'warn');
    try {
      await pushToGitHub(message);
      source = 'github';
      status('synced', 'ok',
        'Connected — pushed to <code>' + REPO.owner + '/' + REPO.repo + '</code> at '
        + new Date().toLocaleString('en-GB'));
      renderFn();
    } catch (e) {
      status('sync failed', 'err',
        '<b>Push failed:</b> ' + esc(e.message)
        + '<br>Your data is still on this device — hit <b>Pull</b> and try again.');
    }
  }

  async function load() {
    // 1. github api — only path that yields the sha needed for writes
    if (TOKEN) {
      try {
        STORE = normalize(await pullFromGitHub());
        source = 'github';
        status('synced', 'ok', 'Connected — reading <code>' + REPO.owner + '/' + REPO.repo
               + '/' + REPO.path + '</code>');
        cacheLocal(); renderFn(); return;
      } catch (e) {
        status('sync failed', 'err',
          '<b>Could not read from GitHub:</b> ' + esc(e.message)
          + '<br>The token may have expired or may lack <b>Contents</b> access to this repo.');
      }
    } else {
      status('local only', 'warn',
        'Not connected to GitHub — edits stay in this browser\'s localStorage only.');
    }
    // 2. sibling file (works on a web server / GitHub Pages)
    try {
      const res = await fetch(REPO.path + '?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        STORE = normalize(await res.json());
        source = source === 'github' ? 'github' : 'file';
        renderFn(); return;
      }
    } catch (e) {}
    // 3. last write from this browser
    try {
      const c = localStorage.getItem(LS_CACHE);
      if (c) { STORE = normalize(JSON.parse(c)); source = 'cache'; renderFn(); return; }
    } catch (e) {}
    // 4. embedded seed (assets/seed.js — the only path that survives file://)
    try { STORE = normalize(window.MECH_SEED); } catch (e) {}
    source = 'seed';
    renderFn();
  }

  /* pull again from scratch — drops the cached sha so the next write re-resolves it */
  function refresh() { SHA = null; return load(); }

  /* ——————————————————————————— token ——————————————————————————— */
  function setToken(v) {
    TOKEN = v;
    try { localStorage.setItem(LS_TOKEN, v); } catch (e) {}
  }
  function clearToken() {
    TOKEN = ''; SHA = null;
    try { localStorage.removeItem(LS_TOKEN); } catch (e) {}
    status('local only', 'warn', 'Token removed — this page can still read data, but edits will not reach GitHub.');
  }

  return {
    REPO: REPO, TYPES: TYPES, STATUS: STATUS,
    get store() { return STORE; },
    set store(v) { STORE = v; },
    get source() { return source; },
    get lastStatus() { return LAST; },
    hasToken: () => !!TOKEN,
    esc: esc, num: num, money: money, totalOf: totalOf, newId: newId, pct: pct,
    totals: totals, groupSum: groupSum,
    normalize: normalize, cacheLocal: cacheLocal,
    load: load, refresh: refresh, persist: persist, status: status,
    setToken: setToken, clearToken: clearToken,
    onRender: fn => { renderFn = fn; },
    onStatus: fn => { statusFn = fn; }
  };
})();
