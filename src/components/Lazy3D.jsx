import { Suspense, lazy, useEffect, useRef, useState } from 'react'

const Lanyard = lazy(() => import('../three/Lanyard'))
const Guide = lazy(() => import('../three/Guide'))

function Placeholder({ tall }) {
  return (
    <div
      className={tall ? 'lanyard-stage' : 'guide-stage'}
      style={{ display: 'grid', placeItems: 'center' }}
      aria-hidden="true"
    >
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: 'var(--dust-2)',
        }}
      >
        Cargando escena
      </span>
    </div>
  )
}

/* Solo monta cada canvas cuando su propia sección está cerca del viewport,
   en vez de arrancar los dos contextos WebGL desde la carga inicial. Cada
   instancia decide por su cuenta (no hay exclusión mutua entre ellas): si
   Z-01 y Z-02 están cerca del viewport a la vez, ambas escenas pueden
   quedar montadas juntas — es intencional, evita que una de las dos
   desaparezca mientras el usuario todavía la tiene a la vista. */
function WhenNear({ children, tall }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px 400px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {near ? <Suspense fallback={<Placeholder tall={tall} />}>{children}</Suspense> : <Placeholder tall={tall} />}
    </div>
  )
}

export function LazyLanyard() {
  return (
    <WhenNear tall>
      <Lanyard />
    </WhenNear>
  )
}

export function LazyGuide() {
  return (
    <WhenNear>
      <Guide />
    </WhenNear>
  )
}
