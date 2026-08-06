import { useEffect, useRef } from 'react'

export default function Cursor() {
  const ring = useRef()
  const dot = useRef()

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    let rx = window.innerWidth / 2
    let ry = window.innerHeight / 2
    let tx = rx
    let ty = ry
    let raf

    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      if (dot.current) dot.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
      const hot = e.target?.closest?.('a, button, [data-cursor], input, textarea')
      ring.current?.classList.toggle('hot', !!hot)
    }

    const loop = () => {
      rx += (tx - rx) * 0.16
      ry += (ty - ry) * 0.16
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', move, { passive: true })
    loop()
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  )
}
