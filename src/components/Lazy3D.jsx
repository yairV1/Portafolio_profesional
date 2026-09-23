import { Suspense, lazy, useRef, useState } from 'react'
import { ANCHOR_IDS, flipCard, waveRobot } from '../lib/stage3d'

// three.js, la física y los modelos viven en este chunk diferido
const Scene3D = lazy(() => import('../three/Scene3D'))

const onActivate = (action) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    action()
  }
}

function Loading() {
  return <span className="stage-loading">Cargando escena</span>
}

/* Envuelve las secciones que comparten la escena 3D (Recepción y Perfil): el
   lienzo cubre todo este contenedor por detrás del contenido, así que el
   carné y el robot se mueven sin quedar recortados por una caja. */
export function Stage3D({ children }) {
  const wrapRef = useRef(null)
  const [ready, setReady] = useState(false)
  return (
    <div className="stage3d" ref={wrapRef} data-ready={ready || undefined}>
      {children}
      <Suspense fallback={null}>
        <Scene3D wrapRef={wrapRef} onReady={() => setReady(true)} />
      </Suspense>
    </div>
  )
}

/* Anclas: cajas vacías en el layout que marcan dónde y de qué tamaño se
   dibuja cada objeto, y que conservan teclado, clic y lectores de pantalla. */
export function LanyardAnchor() {
  return (
    <div
      id={ANCHOR_IDS.lanyard}
      className="lanyard-stage"
      role="button"
      tabIndex={0}
      aria-label="Credencial de acceso. Presiona Enter para girarla y ver el reverso."
      onKeyDown={onActivate(flipCard)}
    >
      <Loading />
      <span className="drag-hint">Arrastra la credencial · toca para girarla</span>
    </div>
  )
}

export function GuideAnchor() {
  return (
    <div
      id={ANCHOR_IDS.guide}
      className="guide-stage"
      role="button"
      tabIndex={0}
      aria-label="Robot guía. Haz clic para saludar."
      onClick={waveRobot}
      onKeyDown={onActivate(waveRobot)}
    >
      <Loading />
    </div>
  )
}
