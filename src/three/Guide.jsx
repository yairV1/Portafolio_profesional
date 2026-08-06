import * as THREE from 'three'
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, Lightformer } from '@react-three/drei'

/* Guía de la instalación: entidad abstracta, no humanoide.
   Respira, parpadea, sigue el cursor y reacciona al scroll. */

function makeIrisTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')
  const cx = 128
  const cy = 128

  const base = g.createRadialGradient(cx, cy, 6, cx, cy, 126)
  base.addColorStop(0, '#eafcff')
  base.addColorStop(0.16, '#8fefff')
  base.addColorStop(0.45, '#22D3EE')
  base.addColorStop(0.78, '#0e7f93')
  base.addColorStop(1, '#052226')
  g.fillStyle = base
  g.beginPath()
  g.arc(cx, cy, 126, 0, Math.PI * 2)
  g.fill()

  g.save()
  g.beginPath()
  g.arc(cx, cy, 126, 0, Math.PI * 2)
  g.clip()
  g.globalCompositeOperation = 'overlay'
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const len = 34 + ((i * 37) % 60)
    g.strokeStyle = `rgba(255,255,255,${0.06 + ((i * 13) % 10) / 80})`
    g.lineWidth = 1.4
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26)
    g.lineTo(cx + Math.cos(a) * (26 + len), cy + Math.sin(a) * (26 + len))
    g.stroke()
  }
  g.globalCompositeOperation = 'source-over'
  g.restore()

  g.strokeStyle = 'rgba(4,12,16,0.65)'
  g.lineWidth = 9
  g.beginPath()
  g.arc(cx, cy, 121, 0, Math.PI * 2)
  g.stroke()

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Core({ scrollTilt }) {
  const shell = useRef()
  const lens = useRef()
  const iris = useRef()
  const glint = useRef()
  const ringA = useRef()
  const ringB = useRef()
  const halo = useRef()

  const [blink, setBlink] = useState(1)
  const target = useMemo(() => new THREE.Vector3(), [])
  const irisTex = useMemo(() => makeIrisTexture(), [])
  const saccade = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  // parpadeo con ritmo irregular, como algo vivo
  useEffect(() => {
    let id
    const schedule = () => {
      id = setTimeout(() => {
        setBlink(0.08)
        setTimeout(() => setBlink(1), 110)
        schedule()
      }, 2200 + Math.random() * 3400)
    }
    schedule()
    return () => clearTimeout(id)
  }, [])

  // saccades: pequeños desvíos de la mirada, independientes del cursor
  useEffect(() => {
    let id
    const schedule = () => {
      id = setTimeout(() => {
        saccade.current.tx = (Math.random() - 0.5) * 0.18
        saccade.current.ty = (Math.random() - 0.5) * 0.12
        setTimeout(() => {
          saccade.current.tx = 0
          saccade.current.ty = 0
        }, 260 + Math.random() * 260)
        schedule()
      }, 1800 + Math.random() * 3000)
    }
    schedule()
    return () => clearTimeout(id)
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const tilt = scrollTilt?.current || 0

    // respiración
    if (shell.current) {
      const b = 1 + Math.sin(t * 1.15) * 0.032
      shell.current.scale.setScalar(b)
      shell.current.rotation.y += delta * 0.12
      shell.current.rotation.x = THREE.MathUtils.lerp(shell.current.rotation.x, tilt * 0.35, delta * 1.5)
    }

    saccade.current.x = THREE.MathUtils.lerp(saccade.current.x, saccade.current.tx, delta * 10)
    saccade.current.y = THREE.MathUtils.lerp(saccade.current.y, saccade.current.ty, delta * 10)

    // la mirada sigue al cursor, con micro-desvíos tipo saccade
    if (lens.current) {
      target.set(state.pointer.x * 2.4 + saccade.current.x * 3, state.pointer.y * 1.5 + 0.1 + saccade.current.y * 3, 3.2)
      lens.current.lookAt(target)
      lens.current.position.x = THREE.MathUtils.lerp(lens.current.position.x, state.pointer.x * 0.13 + saccade.current.x, delta * 3)
      lens.current.position.y = THREE.MathUtils.lerp(lens.current.position.y, state.pointer.y * 0.09 + saccade.current.y, delta * 3)
    }
    if (iris.current) {
      iris.current.scale.y = THREE.MathUtils.lerp(iris.current.scale.y, blink, delta * 22)
      iris.current.material.emissiveIntensity = 1.7 + Math.sin(t * 2.6) * 0.35
    }
    if (glint.current) {
      glint.current.position.x = 0.075 + saccade.current.x * 0.4
      glint.current.position.y = 0.075 - saccade.current.y * 0.4
    }

    if (ringA.current) {
      ringA.current.rotation.z += delta * 0.42
      ringA.current.rotation.x = Math.sin(t * 0.5) * 0.32
    }
    if (ringB.current) {
      ringB.current.rotation.z -= delta * 0.26
      ringB.current.rotation.y = Math.cos(t * 0.42) * 0.5
    }
    if (halo.current) {
      halo.current.material.opacity = 0.1 + Math.sin(t * 1.6) * 0.045
      halo.current.rotation.z -= delta * 0.08
    }
  })

  return (
    <group>
      {/* núcleo */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1, 3]} />
        <meshPhysicalMaterial
          color="#1a1533"
          roughness={0.14}
          metalness={0.3}
          transmission={0.55}
          thickness={1.4}
          clearcoat={1}
          clearcoatRoughness={0.06}
          iridescence={0.7}
          iridescenceIOR={1.5}
        />
      </mesh>

      {/* lente / mirada */}
      <group ref={lens}>
        <mesh position={[0, 0, 0.94]}>
          <circleGeometry args={[0.34, 48]} />
          <meshBasicMaterial color="#07060C" />
        </mesh>
        <mesh ref={iris} position={[0, 0, 0.955]}>
          <circleGeometry args={[0.235, 48]} />
          <meshStandardMaterial
            map={irisTex}
            emissiveMap={irisTex}
            color="#ffffff"
            emissive="#22D3EE"
            emissiveIntensity={1.7}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={glint} position={[0.075, 0.075, 0.965]}>
          <circleGeometry args={[0.055, 24]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>

      {/* anillos orbitales */}
      <mesh ref={ringA}>
        <torusGeometry args={[1.62, 0.012, 8, 128]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.92, 0.007, 8, 128]} />
        <meshStandardMaterial color="#C4B5FD" emissive="#C4B5FD" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      <mesh ref={halo}>
        <ringGeometry args={[2.25, 2.55, 96]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* partículas satélite */}
      <Satellites />
    </group>
  )
}

function Satellites() {
  const ref = useRef()
  const data = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        r: 2.1 + Math.random() * 0.9,
        a: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 2.4,
        s: 0.1 + Math.random() * 0.32,
      })),
    []
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    data.forEach((d, i) => {
      const a = d.a + t * d.s * 0.35
      dummy.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * 0.6 + i) * 0.14, Math.sin(a) * d.r)
      dummy.scale.setScalar(0.028 + Math.sin(t * 2 + i) * 0.008)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, 22]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial color="#C4B5FD" emissive="#C4B5FD" emissiveIntensity={2} toneMapped={false} />
    </instancedMesh>
  )
}

export default function Guide() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const stageRef = useRef()
  const scrollTilt = useRef(0)

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

  return (
    <div className="guide-stage" ref={stageRef}>
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 4]} intensity={26} color="#C4B5FD" distance={18} />
        <pointLight position={[-4, -2, 2]} intensity={20} color="#22D3EE" distance={18} />

        {reduced ? (
          <Core scrollTilt={scrollTilt} />
        ) : (
          <Float speed={1.35} rotationIntensity={0.32} floatIntensity={0.7}>
            <Core scrollTilt={scrollTilt} />
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
