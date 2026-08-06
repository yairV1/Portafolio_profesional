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

/* Solo monta el canvas cuando la sección está cerca del viewport.
   Evita dos contextos WebGL corriendo a la vez. */
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
