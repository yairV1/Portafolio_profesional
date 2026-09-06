import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis, destroyLenis } from './lenisSingleton'

gsap.registerPlugin(ScrollTrigger)

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

  useEffect(() => {
    const lenis = getLenis()
    if (!lenis) return

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute('href')
      // con HashRouter, los links de ruta también empiezan con "#" (ej.
      // "#/expedientes?p=slug") — solo interceptamos anclas simples de la
      // misma página, no rutas, para no pasarle eso a querySelector
      if (!/^#[\w-]+$/.test(id)) return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: 0, duration: 1.4 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      destroyLenis()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])
}
