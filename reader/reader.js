const $ = (sel, el = document) => el.querySelector(sel)

async function loadManifest() {
  const inline = document.getElementById('tojiru-manifest')
  if (inline) return JSON.parse(inline.textContent)
  const res = await fetch('manifest.json')
  if (!res.ok) throw new Error('manifest.json introuvable')
  return res.json()
}

async function inflate(file) {
  const res = await fetch(file)
  const stream = res.body.pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

async function loadPage(p) {
  if (p.type === 'vector') {
    const text = await inflate(p.file)
    const tpl = document.createElement('template')
    tpl.innerHTML = text.trim()
    return tpl.content.firstElementChild
  }
  const img = document.createElement('img')
  img.src = p.file
  img.alt = `page ${p.n}`
  return img
}

function init(manifest) {
  document.title = manifest.title
  const menu = $('#menu')
  const pagesEl = $('#pages')
  const key = `tojiru:${manifest.title}`
  let current = 0

  const thumbs = manifest.pages.map((p) => {
    const t = document.createElement('img')
    t.src = p.thumb
    t.loading = 'lazy'
    t.alt = `page ${p.n}`
    t.addEventListener('click', () => goTo(p.n))
    const num = document.createElement('span')
    num.className = 'num'
    num.textContent = String(p.n)
    menu.append(t, num)
    return t
  })

  const io = new IntersectionObserver(onIntersect, { root: pagesEl, rootMargin: '800px 0px' })
  const containers = manifest.pages.map((p) => {
    const c = document.createElement('div')
    c.className = 'page'
    c.style.aspectRatio = `${p.w} / ${p.h}`
    c.dataset.n = String(p.n)
    io.observe(c)
    pagesEl.append(c)
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
    thumbs[current - 1]?.classList.remove('current')
    current = n
    thumbs[current - 1]?.classList.add('current')
    thumbs[current - 1]?.scrollIntoView({ block: 'nearest' })
    history.replaceState(null, '', `#page=${n}`)
    try { localStorage.setItem(key, String(n)) } catch {}
  }

  function goTo(n) {
    n = Math.min(Math.max(1, n), manifest.pages.length)
    containers[n - 1].scrollIntoView()
    setCurrent(n)
  }

  pagesEl.addEventListener('scroll', () => {
    const mid = pagesEl.scrollTop + pagesEl.clientHeight / 2
    for (let i = 0; i < containers.length; i++) {
      const c = containers[i]
      if (c.offsetTop <= mid && c.offsetTop + c.offsetHeight > mid) { setCurrent(i + 1); break }
    }
  }, { passive: true })

  $('#toggle').addEventListener('click', () => menu.classList.toggle('hidden'))

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
  document.body.innerHTML = `<p style="padding:1rem">Erreur de chargement : ${e.message}</p>`
})
