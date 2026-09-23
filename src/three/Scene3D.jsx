import * as THREE from 'three'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { LanyardRig } from './Lanyard'
import { GuideRig } from './Guide'
import useInView from '../lib/useInView'
import { ANCHOR_IDS, onStageEvent } from '../lib/stage3d'
import { nyxSay } from '../lib/nyxEvents'

/* Una sola escena 3D detrás de Recepción y Perfil: el carné y el robot ya no
   viven en cajas separadas que los recortan al balancearse, sino en un único
   lienzo que cubre ambas secciones, con el texto por encima.

   Las cajas del layout (#anchor-lanyard, #anchor-guide) siguen existiendo,
   vacías: marcan dónde y de qué tamaño se dibuja cada objeto, y conservan el
   teclado, el clic y la accesibilidad. Esta escena mide esas anclas y ajusta
   la cámara para que cada objeto se vea igual que en su caja original. */

const FOV = 25
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
// alto visible (en unidades de mundo) de las cámaras originales de cada caja
const LANYARD_VIEW_H = 2 * 13 * TAN // cámara del carné: fov 25 a 13 de distancia
const GUIDE_VIEW_H = 2 * 9.4 * Math.tan(THREE.MathUtils.degToRad(21)) // robot: fov 42 a 9.4

function measure(wrap) {
  const lanyard = document.getElementById(ANCHOR_IDS.lanyard)
  const guide = document.getElementById(ANCHOR_IDS.guide)
  if (!wrap || !lanyard || !guide) return null
  const W = wrap.clientWidth
  const H = wrap.clientHeight
  const base = wrap.getBoundingClientRect()
  const box = (el) => {
    const r = el.getBoundingClientRect()
    return { cx: r.left - base.left + r.width / 2, cy: r.top - base.top + r.height / 2, h: r.height }
  }
  const l = box(lanyard)
  const g = box(guide)
  if (!W || !H || !l.h || !g.h) return null

  // píxeles por unidad de mundo: los mismos que tenía el carné en su caja
  const ppu = l.h / LANYARD_VIEW_H
  const toWorld = (b) => [(b.cx - W / 2) / ppu, -(b.cy - H / 2) / ppu]
  return {
    cameraZ: H / ppu / (2 * TAN),
    lanyard: toWorld(l),
    guide: toWorld(g),
    guideScale: g.h / GUIDE_VIEW_H / ppu,
  }
}

// R3F calcula el puntero como si el lienzo empezara en la esquina de la
// pantalla; este lienzo es alto y se desplaza con la página, así que se usa su
// posición real en cada evento (si no, tras hacer scroll los clics fallan)
function computePointer(event, state) {
  const r = state.gl.domElement.getBoundingClientRect()
  state.pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1)
  state.raycaster.setFromCamera(state.pointer, state.camera)
}

function Rig({ cameraZ }) {
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    camera.fov = FOV
    camera.position.set(0, 0, cameraZ)
    camera.near = 0.1
    camera.far = cameraZ * 3
    camera.updateProjectionMatrix()
  }, [camera, cameraZ])
  return null
}

export default function Scene3D({ wrapRef, onReady }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [layout, setLayout] = useState(null)
  const [flipTrigger, setFlipTrigger] = useState(0)
  const [waveTrigger, setWaveTrigger] = useState(0)
  const scrollTilt = useRef(0)
  const visible = useInView(wrapRef, '0px')

  // medir al montar y cada vez que cambie el tamaño del contenedor o de las anclas
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let timer
    const update = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setLayout(measure(wrap)), 120)
    }
    setLayout(measure(wrap))
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    Object.values(ANCHOR_IDS).forEach((id) => {
      const el = document.getElementById(id)
      if (el) ro.observe(el)
    })
    return () => {
      ro.disconnect()
      clearTimeout(timer)
    }
  }, [wrapRef])

  useEffect(() => onStageEvent('flip', () => setFlipTrigger((n) => n + 1)), [])
  useEffect(
    () =>
      onStageEvent('wave', () => {
        setWaveTrigger((n) => n + 1)
        nyxSay({ key: 'robot', mood: 'saludando', text: '¡Hola, robot! 👋 Te dije que saludaba.' })
      }),
    []
  )

  // el robot saluda solo la primera vez que su ancla entra en pantalla, e
  // inclina la cabeza según el scroll
  useEffect(() => {
    const el = document.getElementById(ANCHOR_IDS.guide)
    if (!el) return
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      scrollTilt.current = THREE.MathUtils.clamp((vh * 0.5 - (r.top + r.height * 0.5)) / (vh * 0.7), -1, 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setWaveTrigger((n) => n + 1)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  if (!layout) return null

  return (
    <Canvas
      className="stage3d-canvas"
      // los eventos se escuchan en el contenedor: así el carné se puede
      // arrastrar aunque el puntero pase por encima del texto
      eventSource={wrapRef.current}
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ fov: FOV, position: [0, 0, layout.cameraZ] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={(state) => {
        state.setEvents({ compute: computePointer })
        onReady?.()
      }}
    >
      <Rig cameraZ={layout.cameraZ} />
      <ambientLight intensity={0.75} />

      <LanyardRig
        // la física se crea en su posición inicial: si el ancla se mueve, se monta de nuevo
        key={layout.lanyard.map((v) => v.toFixed(2)).join(':')}
        origin={layout.lanyard}
        reduced={reduced}
        active={visible}
        flipTrigger={flipTrigger}
      />
      <GuideRig origin={layout.guide} scale={layout.guideScale} reduced={reduced} scrollTilt={scrollTilt} waveTrigger={waveTrigger} />

      <Environment resolution={128}>
        <Lightformer intensity={2.4} color="#C4B5FD" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.15, 1]} />
        <Lightformer intensity={2.6} color="#8B5CF6" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.12, 1]} />
        <Lightformer intensity={2.6} color="#22D3EE" position={[1, 1, -1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.12, 1]} />
        <Lightformer intensity={3.5} color="#ffffff" position={[-8, 4, 12]} scale={[12, 12, 1]} />
        <Lightformer intensity={3} color="#8B5CF6" position={[-2, 2, 3]} scale={[8, 8, 1]} />
        <Lightformer intensity={2} color="#22D3EE" position={[3, -1, 2]} scale={[6, 6, 1]} />
      </Environment>
    </Canvas>
  )
}
