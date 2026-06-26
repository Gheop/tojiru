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
    obj.data = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }))
    obj.addEventListener('load', () => URL.revokeObjectURL(obj.data), { once: true })
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

  const thumbs = manifest.pages.map((p) => {
    const t = document.createElement('img')
    const inlinePages = window.__TOJIRU_PAGES
    if (inlinePages && Object.prototype.hasOwnProperty.call(inlinePages, p.thumb)) {
      t.src = `data:${mimeFromExt(p.thumb)};base64,${inlinePages[p.thumb]}`
    } else {
      t.src = p.thumb
    }
    t.loading = 'lazy'
    t.alt = `page ${p.n}`
    t.addEventListener('click', () => goTo(p.n))
    const num = document.createElement('span')
    num.className = 'num'
    num.textContent = String(p.n)
    menu.append(t, num)
    return t
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

  $('#reduce').addEventListener('click', () => {
    const hidden = menu.classList.toggle('hidden')
    resize.classList.toggle('hidden', hidden)
    pageEl.classList.toggle('full', hidden)
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
    if (['ArrowDown', 'ArrowRight', ' ', 'PageDown', 'n'].includes(ev.key)) { goTo(current + 1); ev.preventDefault() }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp', 'p'].includes(ev.key)) { goTo(current - 1); ev.preventDefault() }
    else if (ev.key === 'Home') goTo(1)
    else if (ev.key === 'End') goTo(manifest.pages.length)
  })

  const fromHash = location.hash.match(/page=(\d+)/)
  const saved = (() => { try { return Number(localStorage.getItem(key)) } catch { return 0 } })()
  goTo(fromHash ? Number(fromHash[1]) : saved || 1)
}

loadManifest().then(init).catch((e) => {
  document.body.innerHTML = `<p style="padding:1rem">Load error: ${e.message}</p>`
})
