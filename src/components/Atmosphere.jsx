import { useEffect, useRef } from 'react'

/* Tres capas de polvo a distintas velocidades = parallax real,
   sin un tercer contexto WebGL corriendo todo el tiempo. */

export default function Atmosphere() {
  const cv = useRef()
  const beam = useRef()
  const fogs = useRef([])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = cv.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let raf
    let w = 0
    let h = 0
    let layers = []
    let scrollY = window.scrollY
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6)

    const build = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const density = w < 700 ? 0.45 : 1
      layers = [
        { depth: 0.12, n: Math.round(34 * density), r: [0.4, 1], a: [0.1, 0.26], sp: 0.05 },
        { depth: 0.3, n: Math.round(22 * density), r: [0.8, 1.7], a: [0.16, 0.4], sp: 0.11 },
        { depth: 0.62, n: Math.round(12 * density), r: [1.4, 2.6], a: [0.24, 0.5], sp: 0.2 },
      ].map((L) => ({
        ...L,
        pts: Array.from({ length: L.n }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: L.r[0] + Math.random() * (L.r[1] - L.r[0]),
          a: L.a[0] + Math.random() * (L.a[1] - L.a[0]),
          v: 0.06 + Math.random() * 0.22,
        })),
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const L of layers) {
        const off = scrollY * L.depth * 0.35
        for (const p of L.pts) {
          if (!reduced) p.y -= p.v
          if (p.y < -6) {
            p.y = h + 6
            p.x = Math.random() * w
          }
          let y = p.y - (off % (h + 12))
          if (y < -6) y += h + 12
          ctx.beginPath()
          ctx.arc(p.x, y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(196,181,253,${p.a})`
          ctx.fill()
        }
      }
      raf = requestAnimationFrame(draw)
    }

    const onScroll = () => {
      scrollY = window.scrollY
      const list = fogs.current
      if (!reduced && list.length) {
        list.forEach((el, i) => {
          if (el) el.style.transform = `translate3d(0, ${scrollY * (0.04 + i * 0.045)}px, 0)`
        })
      }
    }

    const onMove = (e) => {
      if (reduced || !beam.current) return
      beam.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    }

    build()
    draw()
    window.addEventListener('resize', build)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <>
      <div className="atmosphere" aria-hidden="true">
        <div className="fog fog-a" ref={(el) => (fogs.current[0] = el)} />
        <div className="fog fog-b" ref={(el) => (fogs.current[1] = el)} />
        <div className="fog fog-c" ref={(el) => (fogs.current[2] = el)} />
        <div className="beam-cursor" ref={beam} />
        <canvas className="atmos-canvas" ref={cv} />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
