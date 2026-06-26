const $ = (sel, el = document) => el.querySelector(sel)

async function loadManifest() {
  const inline = document.getElementById('tojiru-manifest')
  if (inline) return JSON.parse(inline.textContent)
  const res = await fetch('manifest.json')
  if (!res.ok) throw new Error('manifest.json not found')
  return res.json()
}

// Returns raw bytes for a page or thumb file.
// When window.__TOJIRU_PAGES contains the key, decodes from base64 (single-file
// mode). Otherwise falls back to a network fetch (folder mode).
async function getPageBytes(key) {
  const inline = window.__TOJIRU_PAGES
  if (inline && Object.prototype.hasOwnProperty.call(inline, key)) {
    const b64 = inline[key]
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }
  const res = await fetch(key)
  return new Uint8Array(await res.arrayBuffer())
}

// Lazily resolves the search index: the inline global in single-file mode, otherwise
// search.json fetched once on first use. A missing/failed fetch yields an empty index.
let searchIndexPromise = null
function getSearchIndex() {
  if (searchIndexPromise) return searchIndexPromise
  searchIndexPromise = window.__TOJIRU_SEARCH
    ? Promise.resolve(window.__TOJIRU_SEARCH)
    : fetch('search.json').then((r) => (r.ok ? r.json() : [])).catch(() => [])
  return searchIndexPromise
}

// UTF-8-safe base64 of an SVG string (btoa is Latin1-only; accented text needs this).
function svgToBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function mimeFromExt(file) {
  const ext = file.split('.').pop().toLowerCase()
  if (ext === 'webp') return 'image/webp'
  if (ext === 'png') return 'image/png'
  return 'image/jpeg'
}

async function fetchSvg(file) {
  const buf = await getPageBytes(file)
  // If the host already applied Content-Encoding: gzip, the browser inflated it
  // and these bytes are plain SVG (no gzip magic). Only inflate when the bytes
  // are actually gzip — so the reader works on any host, no header dependency.
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))
    return new Response(stream).text()
  }
  return new TextDecoder().decode(buf)
}

async function loadPage(p) {
  if (p.type === 'vector') {
    let text = await fetchSvg(p.file)
    // pdftocairo restarts its glyph <symbol> ids at 0 on every page. Injecting all
    // pages inline into one document makes a later <use href="#glyph…"> resolve to
    // page 1's glyph (garbled text). Render each page as its own document via
    // <object> so the ids stay isolated. Strip the fixed pt width/height so the
    // SVG scales to its container through its viewBox.
    text = text.replace(/(<svg[^>]*?)\swidth="[^"]*"/i, '$1').replace(/(<svg[^>]*?)\sheight="[^"]*"/i, '$1')
    const obj = document.createElement('object')
    obj.type = 'image/svg+xml'
    if (window.__TOJIRU_PAGES) {
      // Single file opened via file:// has an opaque (null) origin, so blob: URLs
      // become blob:null/… which <object> refuses to load. A data: URL works on any
      // origin. base64 keeps the SVG bytes intact through UTF-8 (accented text).
      obj.data = `data:image/svg+xml;base64,${svgToBase64(text)}`
    } else {
      obj.data = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }))
      obj.addEventListener('load', () => URL.revokeObjectURL(obj.data), { once: true })
    }
    return obj
  }
  const img = document.createElement('img')
  const inline = window.__TOJIRU_PAGES
  if (inline && Object.prototype.hasOwnProperty.call(inline, p.file)) {
    img.src = `data:${mimeFromExt(p.file)};base64,${inline[p.file]}`
  } else {
    img.src = p.file
  }
  img.alt = `page ${p.n}`
  return img
}

function init(manifest) {
  document.title = manifest.title
  const menu = $('#menu')
  const pageEl = $('#page')
  const resize = $('#resize')
  const key = `tojiru:${manifest.title}`
  let current = 0

  // Table of contents, when the document carries an outline. It sits at the top of the
  // thumbnail column; each entry jumps to its page (goTo is hoisted, defined below).
  if (manifest.outline && manifest.outline.length) {
    const toc = document.createElement('div')
    toc.id = 'toc'
    const head = document.createElement('div')
    head.className = 'toc-head'
    head.textContent = 'Contents'
    toc.append(head)
    for (const e of manifest.outline) {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'toc-item'
      item.textContent = e.title
      item.title = e.title
      item.style.paddingLeft = `${8 + Math.min(e.depth, 5) * 12}px`
      item.addEventListener('click', () => goTo(e.page))
      toc.append(item)
    }
    menu.append(toc)
  }

  // Each thumbnail is a real <button> so it can be reached and activated by
  // keyboard, not just clicked. The .select class lives on the button.
  const thumbs = manifest.pages.map((p) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'thumb'
    btn.setAttribute('aria-label', `Go to page ${p.n}`)
    const t = document.createElement('img')
    const inlinePages = window.__TOJIRU_PAGES
    if (inlinePages && Object.prototype.hasOwnProperty.call(inlinePages, p.thumb)) {
      t.src = `data:${mimeFromExt(p.thumb)};base64,${inlinePages[p.thumb]}`
    } else {
      t.src = p.thumb
    }
    t.loading = 'lazy'
    t.alt = ''
    const num = document.createElement('span')
    num.className = 'num'
    num.textContent = String(p.n)
    btn.append(t, num)
    btn.addEventListener('click', () => goTo(p.n))
    menu.append(btn)
    return btn
  })

  const io = new IntersectionObserver(onIntersect, { root: pageEl, rootMargin: '800px 0px' })
  const containers = manifest.pages.map((p) => {
    const c = document.createElement('div')
    c.className = 'page'
    c.style.aspectRatio = `${p.w} / ${p.h}`
    c.dataset.n = String(p.n)
    io.observe(c)
    pageEl.append(c)
    return c
  })

  async function onIntersect(entries) {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const c = e.target
      if (!c.dataset.loaded) {
        c.dataset.loaded = '1'
        c.append(await loadPage(manifest.pages[Number(c.dataset.n) - 1]))
      }
    }
  }

  function setCurrent(n) {
    if (n === current) return
    thumbs[current - 1]?.classList.remove('select')
    containers[current - 1]?.classList.remove('select')
    current = n
    thumbs[current - 1]?.classList.add('select')
    containers[current - 1]?.classList.add('select')
    thumbs[current - 1]?.scrollIntoView({ block: 'nearest' })
    history.replaceState(null, '', `#page=${n}`)
    try { localStorage.setItem(key, String(n)) } catch {}
  }

  function goTo(n) {
    n = Math.min(Math.max(1, n), manifest.pages.length)
    containers[n - 1].scrollIntoView()
    setCurrent(n)
  }

  pageEl.addEventListener('scroll', () => {
    const mid = pageEl.scrollTop + pageEl.clientHeight / 2
    for (let i = 0; i < containers.length; i++) {
      const c = containers[i]
      if (c.offsetTop <= mid && c.offsetTop + c.offsetHeight > mid) { setCurrent(i + 1); break }
    }
  }, { passive: true })

  const isNarrow = () => matchMedia('(max-width: 640px)').matches

  $('#reduce').addEventListener('click', () => {
    const hidden = menu.classList.toggle('hidden')
    // On phones the column overlays the page (CSS keeps #page full width), so the
    // divider and the page offset only matter on wide screens.
    if (!isNarrow()) {
      resize.classList.toggle('hidden', hidden)
      pageEl.classList.toggle('full', hidden)
    }
  })

  // Dark-mode toggle. The current theme is data-theme on <html> (set early by the
  // inline head script for saved overrides); with no override we follow the system.
  $('#theme').addEventListener('click', () => {
    const root = document.documentElement
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches
    const current = root.dataset.theme || (sysDark ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try { localStorage.setItem('tojiru:theme', next) } catch {}
  })

  // --- Full-text search (only when the build shipped an index) ---
  const searchBox = $('#search')
  const searchInput = $('#search-input')
  const searchResults = $('#search-results')
  let searchTimer = 0

  const openSearch = () => { searchBox.classList.remove('hidden'); searchInput.focus(); searchInput.select() }
  // preventScroll: focusing the scroll container must not yank it back and cancel the
  // goTo() jump that runs just before closing.
  const closeSearch = () => { searchBox.classList.add('hidden'); pageEl.focus({ preventScroll: true }) }

  // Builds a one-line excerpt around the first match in `text` for query `q` (lowercase).
  function snippet(text, q) {
    const idx = text.toLowerCase().indexOf(q)
    if (idx < 0) return null
    const start = Math.max(0, idx - 30)
    const end = Math.min(text.length, idx + q.length + 60)
    return {
      pre: (start > 0 ? '… ' : '') + text.slice(start, idx),
      match: text.slice(idx, idx + q.length),
      post: text.slice(idx + q.length, end) + (end < text.length ? ' …' : ''),
    }
  }

  async function runSearch() {
    const q = searchInput.value.trim().toLowerCase()
    searchResults.replaceChildren()
    if (q.length < 2) return
    const index = await getSearchIndex()
    const hits = []
    for (const e of index) {
      const s = snippet(e.t, q)
      if (s) hits.push({ n: e.n, s })
      if (hits.length >= 60) break
    }
    if (hits.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty'
      empty.textContent = 'No matches'
      searchResults.append(empty)
      return
    }
    for (const h of hits) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'hit'
      const pno = document.createElement('span')
      pno.className = 'pno'
      pno.textContent = `p.${h.n}`
      const mark = document.createElement('mark')
      mark.textContent = h.s.match
      // textContent/createTextNode keep page text inert — no HTML injection from the PDF.
      btn.append(pno, document.createTextNode(h.s.pre), mark, document.createTextNode(h.s.post))
      btn.addEventListener('click', () => { goTo(h.n); closeSearch() })
      searchResults.append(btn)
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(runSearch, 120)
  })
  searchInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { closeSearch(); ev.preventDefault() }
    else if (ev.key === 'Enter') { searchResults.querySelector('.hit')?.click(); ev.preventDefault() }
  })

  // Draggable divider between the thumbnail column and the page area.
  resize.addEventListener('pointerdown', (ev) => {
    ev.preventDefault()
    resize.setPointerCapture(ev.pointerId)
    const move = (e) => {
      const w = Math.max(60, Math.min(e.clientX, 400))
      menu.style.width = `${w}px`
      resize.style.left = `${w}px`
      pageEl.style.left = `${w + 5}px`
    }
    const up = () => {
      resize.removeEventListener('pointermove', move)
      resize.removeEventListener('pointerup', up)
    }
    resize.addEventListener('pointermove', move)
    resize.addEventListener('pointerup', up)
  })

  document.addEventListener('keydown', (ev) => {
    // Open search on Ctrl/Cmd+F or "/", but only when a search index shipped — without
    // one, leave the browser's native find untouched.
    if (manifest.searchable && ((ev.key === 'f' && (ev.ctrlKey || ev.metaKey)) ||
        (ev.key === '/' && !(ev.target instanceof HTMLInputElement)))) {
      openSearch(); ev.preventDefault(); return
    }
    // Don't let page navigation steal keys while typing in the search box.
    if (ev.target instanceof HTMLInputElement) return
    if (['ArrowDown', 'ArrowRight', ' ', 'PageDown', 'n'].includes(ev.key)) { goTo(current + 1); ev.preventDefault() }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp', 'p'].includes(ev.key)) { goTo(current - 1); ev.preventDefault() }
    else if (ev.key === 'Home') goTo(1)
    else if (ev.key === 'End') goTo(manifest.pages.length)
  })

  // On phones, start with the thumbnail column collapsed so the page gets the full
  // width; the ☰ button reveals it as an overlay.
  if (isNarrow()) {
    menu.classList.add('hidden')
    resize.classList.add('hidden')
    pageEl.classList.add('full')
  }

  const fromHash = location.hash.match(/page=(\d+)/)
  const saved = (() => { try { return Number(localStorage.getItem(key)) } catch { return 0 } })()
  goTo(fromHash ? Number(fromHash[1]) : saved || 1)
}

loadManifest().then(init).catch((e) => {
  document.body.innerHTML = `<p style="padding:1rem">Load error: ${e.message}</p>`
})
