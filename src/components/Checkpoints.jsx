import { useEffect, useState } from 'react'
import { zones } from '../data/content'
import { getLenis } from '../lib/lenisSingleton'

// línea de activación: sección considerada "activa" es la última (en orden
// de documento) cuyo borde superior ya cruzó este % de la altura del viewport
const ACTIVE_LINE_RATIO = 0.3

export default function Checkpoints() {
  const [active, setActive] = useState('z01')

  useEffect(() => {
    const els = zones.map((z) => document.getElementById(z.id)).filter(Boolean)
    if (!els.length) return

    const pickActive = () => {
      const lineY = window.innerHeight * ACTIVE_LINE_RATIO
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top <= lineY) current = el.id
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

  return (
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
  )
}
