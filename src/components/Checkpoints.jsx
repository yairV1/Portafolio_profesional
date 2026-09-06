import { useEffect, useState } from 'react'
import { zones } from '../data/content'
import { getLenis } from '../lib/lenisSingleton'

// línea de activación: sección considerada "activa" es la última (en orden
// de documento) cuyo borde superior ya cruzó este % de la altura del viewport
const ACTIVE_LINE_RATIO = 0.3

export default function Checkpoints() {
  const [active, setActive] = useState('z01')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const els = zones.map((z) => document.getElementById(z.id)).filter(Boolean)
    if (!els.length) return

    const pickActive = () => {
      const lineY = window.innerHeight * ACTIVE_LINE_RATIO
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top <= lineY) current = el.id
      }

      const tops = els.map((e) => ({ id: e.id, top: Math.round(e.getBoundingClientRect().top) }))
      console.log('[pickActive] current=' + current, 'scrollY=' + window.scrollY, 'lineY=' + Math.round(lineY), 'tops=' + JSON.stringify(tops))

      if (current === 'z05') {
        const z06 = document.getElementById('z06')
        if (z06) {
          const r = z06.getBoundingClientRect()
          const heading = [...z06.querySelectorAll('h2, .zt')].find((h) => h.textContent.includes('Solicitar'))
          const hr = heading ? heading.getBoundingClientRect() : null
          console.log(
            '[pickActive][z05-but-check-z06]',
            'z06.rect=' + JSON.stringify({ top: r.top, bottom: r.bottom, height: r.height, y: r.y }),
            'headingFound=' + !!heading,
            'heading.rect=' + JSON.stringify(hr ? { top: hr.top, bottom: hr.bottom, y: hr.y } : null)
          )
        }
      }

      setActive((prev) => (prev === current ? prev : current))
    }

    pickActive()
    window.addEventListener('resize', pickActive)

    // usa el evento de scroll de Lenis (misma fuente que el resto del sitio)
    // en vez de 'scroll' nativo: Lenis emite en cada tick de su propio rAF,
    // mientras que el evento nativo puede llegar coalescido/más espaciado
    // por el navegador durante scroll inercial, lo que hacía sentir atrasado
    // el indicador respecto al contenido que ya se ve en pantalla
    const lenis = getLenis()
    if (lenis) {
      lenis.on('scroll', pickActive)
    } else {
      window.addEventListener('scroll', pickActive, { passive: true })
    }

    return () => {
      window.removeEventListener('resize', pickActive)
      if (lenis) lenis.off('scroll', pickActive)
      else window.removeEventListener('scroll', pickActive)
    }
  }, [])

  // progreso de scroll para el indicador móvil — el nav lateral se oculta
  // bajo 780px (poco espacio, gestos táctiles), esto lo reemplaza sin
  // competir por espacio en pantalla
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const activeZone = zones.find((z) => z.id === active) || zones[0]

  return (
    <>
      <nav className="checkpoints" aria-label="Zonas del portafolio">
        {zones.map((z) => (
          <a
            key={z.id}
            href={`#${z.id}`}
            className={`cp${active === z.id ? ' on' : ''}`}
            aria-label={`${z.code} ${z.name}`}
            aria-current={active === z.id ? 'true' : undefined}
          >
            <span className="cp-core" />
            <span className="cp-text">
              {z.code} · {z.name}
            </span>
          </a>
        ))}
      </nav>

      <div className="mobile-nav" aria-hidden="true">
        <span className="mobile-nav-label">
          {activeZone.code} · {activeZone.name}
        </span>
        <div className="mobile-nav-track">
          <div className="mobile-nav-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </>
  )
}
