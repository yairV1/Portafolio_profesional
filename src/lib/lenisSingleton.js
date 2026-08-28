import Lenis from 'lenis'

let instance

// singleton: Checkpoints (scrollspy) y useSmoothScroll necesitan la misma
// instancia de Lenis — cualquiera de los dos puede crearla primero, sin
// importar el orden de montaje de sus efectos (los hijos corren antes que
// el padre en React)
export function getLenis() {
  if (instance !== undefined) return instance
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    instance = null
    return instance
  }
  instance = new Lenis({ duration: 1.15, lerp: 0.085, smoothWheel: true })
  return instance
}

export function destroyLenis() {
  instance?.destroy()
  instance = undefined
}
