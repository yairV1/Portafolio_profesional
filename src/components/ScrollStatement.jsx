import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

function Word({ children, progress, range, hot }) {
  const opacity = useTransform(progress, range, [0.1, 1])
  const y = useTransform(progress, range, [28, 0])
  const rotateX = useTransform(progress, range, [55, 0])
  const blurPx = useTransform(progress, range, [9, 0])
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`)

  return (
    <motion.span className="kt-word" style={{ opacity, y, rotateX, filter }}>
      <span className={hot ? 'kt-hot' : undefined}>{children}</span>
    </motion.span>
  )
}

/* Bloque de tránsito con tipografía cinética: cada palabra se revela según
   el progreso de scroll mientras la sección queda fija (sticky), en vez de
   dispararse toda de una vez al entrar en viewport como el resto de Reveal. */
export default function ScrollStatement({ text, highlight = [] }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = text.split(' ')
  const hotSet = new Set(highlight)

  if (reduce) {
    return (
      <section className="kt kt-static" ref={ref}>
        <div className="kt-inner">
          <p className="kt-text">
            {words.map((w, i) => (
              <span key={i} className={hotSet.has(i) ? 'kt-hot' : undefined}>
                {w}{' '}
              </span>
            ))}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="kt" ref={ref}>
      <div className="kt-inner">
        <p className="kt-text">
          {words.flatMap((w, i) => {
            const start = i / words.length
            const end = Math.min(start + 1.5 / words.length, 1)
            const word = (
              <Word key={i} progress={scrollYProgress} range={[start, end]} hot={hotSet.has(i)}>
                {w}
              </Word>
            )
            // .kt-word es inline-block: el espacio debe ir *fuera* de él (como
            // nodo de texto hermano) para que el navegador pueda partir línea ahí.
            return i < words.length - 1 ? [word, ' '] : [word]
          })}
        </p>
      </div>
    </section>
  )
}
