import { motion, useReducedMotion } from 'framer-motion'

const presets = {
  up: { y: 46, opacity: 0 },
  down: { y: -40, opacity: 0 },
  left: { x: -60, opacity: 0 },
  right: { x: 60, opacity: 0 },
  scale: { scale: 0.9, opacity: 0 },
  mask: { y: 60, opacity: 0, filter: 'blur(10px)' },
}

export default function Reveal({ children, from = 'up', delay = 0, className, as = 'div', once = true }) {
  const reduce = useReducedMotion()
  const M = motion[as] || motion.div
  const hidden = reduce ? { opacity: 0 } : presets[from] || presets.up

  return (
    <M
      className={className}
      initial={hidden}
      whileInView={{ x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-12% 0px -12% 0px' }}
      transition={{ duration: reduce ? 0.01 : 0.95, delay: reduce ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </M>
  )
}
