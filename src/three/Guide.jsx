import * as THREE from 'three'
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, Lightformer, useGLTF } from '@react-three/drei'

/* Guía de la instalación: modelo real (CC0, Quaternius "Animated Robot Pack",
   convertido de OBJ a glb) que saluda al llegar a la sección, sigue el
   cursor con la mirada, respira mientras está inactivo y vuelve a saludar
   si le hacen clic. El OBJ no trae huesos, así que las "articulaciones"
   del hombro/codo/cuello son grupos pivote calculados a mano a partir de
   los bounding boxes reales de cada pieza del modelo. */

const MODEL_URL = `${import.meta.env.BASE_URL}models/robot.glb`
useGLTF.preload(MODEL_URL)

const ease = (t) => t * t * (3 - 2 * t) // smoothstep

// THREE.MathUtils.lerp no acota su factor: si un frame tiene un delta
// grande (p. ej. un jank de compilación de shaders), delta*velocidad puede
// pasar de 1 y el lerp se PASA del objetivo. Acotarlo a 1 evita ese overshoot.
const damp = (delta, speed) => Math.min(delta * speed, 1)

// pivotes estimados a partir de los bounding boxes reales del glb
const NECK = [0, 2.8, 0]
const SHOULDER_R = [-0.64, 2.53, -0.02]
const ELBOW_R = [-0.95, 1.75, 0.06]
const ELBOW_LOCAL = [ELBOW_R[0] - SHOULDER_R[0], ELBOW_R[1] - SHOULDER_R[1], ELBOW_R[2] - SHOULDER_R[2]]
const neg = (v) => [-v[0], -v[1], -v[2]]

function Robot({ scrollTilt, waveTrigger }) {
  const { nodes, materials } = useGLTF(MODEL_URL)

  const bot = useRef()
  const head = useRef()
  const shoulderR = useRef()
  const elbowR = useRef()
  const chestLight = useRef()

  const target = useMemo(() => new THREE.Vector3(), [])
  const wave = useRef({ playing: false, t: 0 })
  const tiltTarget = useRef(0)
  const headTilt = useRef(0)

  // recolorea los 3 materiales compartidos del pack (naranja/gris/negro por
  // defecto) a la paleta morado/cian del sitio. Se mutan directamente porque
  // el modelo solo se usa una vez en toda la app.
  useEffect(() => {
    materials.Main.color.set('#7C5CF0')
    materials.Main.roughness = 0.45
    materials.Main.metalness = 0.3
    materials.Grey.color.set('#4b4468')
    materials.Grey.roughness = 0.5
    materials.Grey.metalness = 0.25
    materials.Black.color.set('#0d0b18')
    materials.Black.roughness = 0.4
    materials.Black.metalness = 0.35
  }, [materials])

  // de vez en cuando inclina la cabeza, como si tuviera curiosidad
  useEffect(() => {
    let id
    const schedule = () => {
      id = setTimeout(() => {
        tiltTarget.current = (Math.random() > 0.5 ? 1 : -1) * (0.14 + Math.random() * 0.1)
        setTimeout(() => {
          tiltTarget.current = 0
        }, 900 + Math.random() * 500)
        schedule()
      }, 5000 + Math.random() * 6000)
    }
    schedule()
    return () => clearTimeout(id)
  }, [])

  // dispara el saludo cuando la sección entra en vista, o si lo tocan
  useEffect(() => {
    if (!waveTrigger) return
    wave.current.playing = true
    wave.current.t = 0
  }, [waveTrigger])

  useFrame((state, rawDelta) => {
    // acota saltos de delta (pestaña en segundo plano, hitches del navegador)
    // para que temporizadores como el saludo no se "teletransporten"
    const delta = Math.min(rawDelta, 1 / 30)
    const t = state.clock.elapsedTime
    const tilt = scrollTilt?.current || 0
    const w = wave.current

    // respiración / pequeño salto de emoción al saludar
    if (bot.current) {
      const excite = w.playing && w.t < 0.3 ? Math.sin((w.t / 0.3) * Math.PI) * 0.05 : 0
      const b = 1 + Math.sin(t * 1.15) * 0.02 + excite
      bot.current.scale.setScalar(b)
    }

    // la cabeza mira suavemente hacia el cursor y se inclina con curiosidad
    if (head.current) {
      target.set(state.pointer.x * 1.4, state.pointer.y * 0.8 + 0.1, 3)
      const lookY = Math.atan2(target.x, 3)
      const lookX = -Math.atan2(target.y, 3)
      headTilt.current = THREE.MathUtils.lerp(headTilt.current, tiltTarget.current, damp(delta, 3))
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, lookY * 0.6, damp(delta, 4))
      head.current.rotation.x = THREE.MathUtils.lerp(
        head.current.rotation.x,
        lookX * 0.4 + tilt * 0.18,
        damp(delta, 4)
      )
      head.current.rotation.z = headTilt.current
    }

    if (chestLight.current) {
      chestLight.current.material.emissiveIntensity = 1.3 + Math.sin(t * 2.2) * 0.3
    }

    // saludo: hombro levanta el brazo, codo dobla y agita la mano
    if (w.playing) {
      w.t += delta
      const dur = 2.3
      const riseIn = 0.32
      let raise
      if (w.t < riseIn) raise = ease(w.t / riseIn)
      else if (w.t < dur - riseIn) raise = 1
      else raise = ease(Math.max(0, (dur - w.t) / riseIn))

      const shakeStart = riseIn
      const shake = w.t > shakeStart ? Math.sin((w.t - shakeStart) * 12) * 0.35 * raise : 0

      if (shoulderR.current) shoulderR.current.rotation.z = THREE.MathUtils.lerp(0, -1.5, raise)
      if (elbowR.current) elbowR.current.rotation.z = THREE.MathUtils.lerp(0, -0.5, raise) + shake

      if (w.t > dur) {
        w.playing = false
        w.t = 0
      }
    } else if (shoulderR.current && elbowR.current) {
      // reposo: leve balanceo del brazo
      shoulderR.current.rotation.z = THREE.MathUtils.lerp(shoulderR.current.rotation.z, 0, damp(delta, 3))
      elbowR.current.rotation.z = THREE.MathUtils.lerp(elbowR.current.rotation.z, Math.sin(t * 0.8) * 0.04, damp(delta, 3))
    }
  })

  return (
    <group ref={bot} position={[-0.03, -1.58, -0.055]}>
      {/* torso y piernas, quietos */}
      <primitive object={nodes.Torso_Cube001} />
      <primitive object={nodes.LegL_Cylinder011} />
      <primitive object={nodes.LowerLegL_Cylinder012} />
      <primitive object={nodes.FootL_Cylinder014} />
      <primitive object={nodes.LegR_Cylinder019} />
      <primitive object={nodes.LowerLegR_Cylinder018} />
      <primitive object={nodes.FootR_Cylinder017} />

      {/* brazo izquierdo, quieto */}
      <primitive object={nodes.ShoulderL_Cylinder008} />
      <primitive object={nodes.ArmL_Cylinder010} />
      <primitive object={nodes.HandL_Cylinder022} />

      {/* luz de pecho */}
      <mesh ref={chestLight} position={[0, 2.1, 0.72]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#ffffff" emissive="#22D3EE" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>

      {/* cabeza, sigue el cursor */}
      <group ref={head} position={NECK}>
        <primitive object={nodes.Head_Cylinder} position={neg(NECK)} />
      </group>

      {/* brazo derecho, saluda: hombro -> codo -> mano */}
      <group ref={shoulderR} position={SHOULDER_R}>
        <primitive object={nodes.ShoulderR_Cylinder009} position={neg(SHOULDER_R)} />
        <primitive object={nodes.ArmR_Cylinder013} position={neg(SHOULDER_R)} />

        <group ref={elbowR} position={ELBOW_LOCAL}>
          <primitive object={nodes.HandR_Cylinder015} position={neg(ELBOW_R)} />
        </group>
      </group>

      {/* halo suave bajo el robot */}
      <mesh position={[0.03, -1.58, 0.055]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.3, 64]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function Guide() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const stageRef = useRef()
  const scrollTilt = useRef(0)
  const [waveTrigger, setWaveTrigger] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = stageRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // -1 cuando el bloque está por debajo del viewport, +1 cuando ya pasó por arriba
      const progress = THREE.MathUtils.clamp((vh * 0.5 - (r.top + r.height * 0.5)) / (vh * 0.7), -1, 1)
      scrollTilt.current = progress
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // saluda una vez cuando el robot entra en el viewport
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
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
    return () => io.disconnect()
  }, [])

  return (
    <div
      className="guide-stage"
      ref={stageRef}
      role="button"
      tabIndex={0}
      aria-label="Robot guía. Haz clic para saludar."
      style={{ cursor: 'pointer' }}
      onClick={() => setWaveTrigger((n) => n + 1)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setWaveTrigger((n) => n + 1)
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 9.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 4]} intensity={26} color="#C4B5FD" distance={18} />
        <pointLight position={[-4, -2, 2]} intensity={20} color="#22D3EE" distance={18} />

        {reduced ? (
          <Robot scrollTilt={scrollTilt} waveTrigger={waveTrigger} />
        ) : (
          <Float speed={1.35} rotationIntensity={0.06} floatIntensity={0.2}>
            <Robot scrollTilt={scrollTilt} waveTrigger={waveTrigger} />
          </Float>
        )}

        <Environment resolution={128}>
          <Lightformer intensity={3} color="#8B5CF6" position={[-2, 2, 3]} scale={[8, 8, 1]} />
          <Lightformer intensity={2} color="#22D3EE" position={[3, -1, 2]} scale={[6, 6, 1]} />
        </Environment>
      </Canvas>
    </div>
  )
}
