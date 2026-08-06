import { useEffect, useState } from 'react'
import { zones } from '../data/content'

export default function Checkpoints() {
  const [active, setActive] = useState('z01')

  useEffect(() => {
    const els = zones.map((z) => document.getElementById(z.id)).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
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
