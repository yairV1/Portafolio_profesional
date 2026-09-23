import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis, destroyLenis } from './lenisSingleton'

gsap.registerPlugin(ScrollTrigger)

export function scrollToAnchor(id) {
  const el = document.getElementById(id)
  if (!el) return
  const lenis = getLenis()
  if (lenis) {
    // tras un cambio de ruta Lenis puede tener cacheada la altura de la página
    // anterior y cortaría el scroll antes de llegar: se actualiza primero
    lenis.resize()
    lenis.scrollTo(el, { offset: 0, duration: 1.4 })
  } else el.scrollIntoView()
}

export default function useSmoothScroll() {
  // marca <html> mientras hay scroll activo — evita que filas que quedan
  // bajo el cursor (quieto) disparen :hover solo por el reflow del scroll
  useEffect(() => {
    const root = document.documentElement
    let timer
    const onScroll = () => {
      root.classList.add('is-scrolling')
      clearTimeout(timer)
      timer = setTimeout(() => root.classList.remove('is-scrolling'), 120)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
      root.classList.remove('is-scrolling')
    }
  }, [])

  // anclas simples ("#z04") — siempre interceptadas, haya Lenis o no: con
  // HashRouter, dejar que el navegador cambie el hash a "#z04" lo interpreta
  // como la ruta "z04", que no existe, y la página queda en blanco
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute('href')
      // los links de ruta también empiezan con "#" (ej. "#/expedientes?p=slug")
      // — solo interceptamos anclas de la misma página, no rutas
      if (!/^#[\w-]+$/.test(id)) return
      e.preventDefault()
      scrollToAnchor(id.slice(1))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const lenis = getLenis()
    if (!lenis) return

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      destroyLenis()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])
}
