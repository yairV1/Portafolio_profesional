import { useEffect, useState } from 'react'

// true mientras el elemento esté (casi) en pantalla — lo usan las escenas 3D
// para dejar de renderizar cuando el visitante ya pasó de largo
export default function useInView(ref, rootMargin = '120px 0px') {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}
