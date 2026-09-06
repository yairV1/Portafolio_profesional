import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { identity, capacidades, contacto } from '../data/content'

extend({ MeshLineGeometry, MeshLineMaterial })

/* ---------- textura de la cinta: "DEVELOPER" repetido ---------- */
function makeBandTexture() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 128
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, '#1b1733')
  grad.addColorStop(0.5, '#2b2352')
  grad.addColorStop(1, '#14112a')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 128)
  g.strokeStyle = 'rgba(196,181,253,0.22)'
  g.lineWidth = 2
  g.strokeRect(1, 10, 1022, 108)
  g.font = '700 54px "JetBrains Mono", monospace'
  g.textBaseline = 'middle'
  g.textAlign = 'center'
  const word = 'DEVELOPER'
  for (let i = 0; i < 4; i++) {
    const x = 128 + i * 256
    g.fillStyle = i % 2 ? '#C4B5FD' : '#8B5CF6'
    g.fillText(word, x, 64)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ---------- textura de la cara del carné (foto + datos) ---------- */
function drawCardFace(img) {
  const W = 620
  const H = 880
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })

  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#191533')
  bg.addColorStop(0.55, '#100E1F')
  bg.addColorStop(1, '#1d1640')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)

  // banda superior
  g.fillStyle = 'rgba(139,92,246,0.18)'
  g.fillRect(0, 0, W, 96)
  g.strokeStyle = 'rgba(196,181,253,0.35)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(0, 96)
  g.lineTo(W, 96)
  g.stroke()

  g.fillStyle = '#C4B5FD'
  g.font = '500 22px "JetBrains Mono", monospace'
  g.textBaseline = 'middle'
  g.fillText('ACCESO · Z-01', 44, 50)
  g.textAlign = 'right'
  g.fillStyle = '#22D3EE'
  g.fillText('2026', W - 44, 50)
  g.textAlign = 'left'

  // ranura del clip
  g.fillStyle = 'rgba(0,0,0,0.55)'
  g.beginPath()
  g.roundRect(W / 2 - 62, 24, 124, 20, 10)
  g.fill()

  // foto
  const px = 60
  const py = 140
  const pw = W - 120
  const ph = 430
  g.save()
  g.beginPath()
  g.roundRect(px, py, pw, ph, 22)
  g.clip()
  if (img) {
    const ar = img.width / img.height
    const target = pw / ph
    let sw = img.width
    let sh = img.height
    let sx = 0
    let sy = 0
    if (ar > target) {
      sw = img.height * target
      sx = (img.width - sw) / 2
    } else {
      sh = img.width / target
      sy = (img.height - sh) * 0.18
    }
    g.drawImage(img, sx, sy, sw, sh, px, py, pw, ph)
    const tint = g.createLinearGradient(0, py, 0, py + ph)
    tint.addColorStop(0, 'rgba(139,92,246,0.05)')
    tint.addColorStop(1, 'rgba(7,6,12,0.55)')
    g.fillStyle = tint
    g.fillRect(px, py, pw, ph)
  } else {
    const placeholderGrad = g.createRadialGradient(px + pw / 2, py + ph * 0.42, 10, px + pw / 2, py + ph * 0.5, pw * 0.8)
    placeholderGrad.addColorStop(0, '#2b2358')
    placeholderGrad.addColorStop(1, '#171229')
    g.fillStyle = placeholderGrad
    g.fillRect(px, py, pw, ph)

    const initials = `${identity.nombre?.[0] || ''}${(identity.apellido || '').replace(/[[\]]/g, '')[0] || ''}`.toUpperCase()
    g.fillStyle = 'rgba(196,181,253,0.85)'
    g.font = '700 130px "Clash Display", system-ui, sans-serif'
    g.textAlign = 'center'
    g.fillText(initials, px + pw / 2, py + ph * 0.5)
    g.textAlign = 'left'
  }
  g.restore()

  g.strokeStyle = 'rgba(255,255,255,0.14)'
  g.lineWidth = 2
  g.beginPath()
  g.roundRect(px, py, pw, ph, 22)
  g.stroke()

  // nombre
  g.fillStyle = '#F2F0FA'
  g.font = '600 62px "Clash Display", system-ui, sans-serif'
  g.fillText(identity.nombre, 60, 640)

  g.fillStyle = '#8B5CF6'
  g.fillRect(60, 672, 74, 3)

  g.fillStyle = '#8A87A6'
  g.font = '500 25px "Satoshi", system-ui, sans-serif'
  g.fillText(identity.rol, 60, 712)

  // código de barras
  let bx = 60
  const seed = 7
  for (let i = 0; i < 46; i++) {
    const w = ((i * seed) % 4) + 1.5
    g.fillStyle = i % 3 === 0 ? 'rgba(196,181,253,0.75)' : 'rgba(255,255,255,0.35)'
    g.fillRect(bx, 762, w, 44)
    bx += w + 5
    if (bx > W - 70) break
  }

  g.fillStyle = '#5D5A77'
  g.font = '400 19px "JetBrains Mono", monospace'
  g.fillText(identity.handle, 60, 838)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/* ---------- textura del reverso: perfil técnico + contacto ---------- */
function drawCardBack() {
  const W = 620
  const H = 880
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')

  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#191533')
  bg.addColorStop(0.55, '#100E1F')
  bg.addColorStop(1, '#1d1640')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)

  // banda superior, igual que el frente
  g.fillStyle = 'rgba(139,92,246,0.18)'
  g.fillRect(0, 0, W, 96)
  g.strokeStyle = 'rgba(196,181,253,0.35)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(0, 96)
  g.lineTo(W, 96)
  g.stroke()

  g.fillStyle = '#C4B5FD'
  g.font = '500 22px "JetBrains Mono", monospace'
  g.textBaseline = 'middle'
  g.fillText('PERFIL TÉCNICO', 44, 50)
  g.textAlign = 'right'
  g.fillStyle = '#22D3EE'
  g.fillText('REVERSO', W - 44, 50)
  g.textAlign = 'left'

  // ranura del clip, igual posición que el frente
  g.fillStyle = 'rgba(0,0,0,0.55)'
  g.beginPath()
  g.roundRect(W / 2 - 62, 24, 124, 20, 10)
  g.fill()

  // nombre completo + rol
  g.fillStyle = '#F2F0FA'
  g.font = '600 46px "Clash Display", system-ui, sans-serif'
  g.fillText(`${identity.nombre} ${identity.apellido || ''}`.trim(), 60, 170)

  g.fillStyle = '#8B5CF6'
  g.fillRect(60, 198, 74, 3)

  g.fillStyle = '#8A87A6'
  g.font = '500 22px "Satoshi", system-ui, sans-serif'
  g.fillText(identity.rol, 60, 234)

  // nivel por área, tomado de las mismas capacidades que ya se muestran en Z-03
  g.fillStyle = '#5D5A77'
  g.font = '500 15px "JetBrains Mono", monospace'
  g.fillText('NIVEL DE ACCESO POR ÁREA', 60, 284)

  capacidades.slice(0, 4).forEach((cap, i) => {
    const rowY = 326 + i * 60
    g.fillStyle = '#C4B5FD'
    g.font = '600 23px "Clash Display", system-ui, sans-serif'
    g.fillText(cap.titulo, 60, rowY)

    const barX = 60
    const barY = rowY + 18
    const barW = W - 120
    const barH = 6
    g.fillStyle = 'rgba(255,255,255,0.08)'
    g.beginPath()
    g.roundRect(barX, barY, barW, barH, 3)
    g.fill()
    const grad = g.createLinearGradient(barX, 0, barX + barW, 0)
    grad.addColorStop(0, '#8B5CF6')
    grad.addColorStop(1, '#22D3EE')
    g.fillStyle = grad
    g.beginPath()
    g.roundRect(barX, barY, barW * (cap.nivel / 100), barH, 3)
    g.fill()
  })

  // contacto
  g.fillStyle = '#5D5A77'
  g.font = '500 15px "JetBrains Mono", monospace'
  g.fillText('CONTACTO', 60, 572)

  contacto.redes.slice(0, 2).forEach((r, i) => {
    const ly = 610 + i * 36
    g.fillStyle = '#F2F0FA'
    g.font = '500 21px "Satoshi", system-ui, sans-serif'
    g.fillText(r.n, 60, ly)
    g.fillStyle = '#5D5A77'
    g.font = '400 15px "JetBrains Mono", monospace'
    g.fillText(r.u.replace('https://', '').replace('www.', ''), 190, ly)
  })

  // código de barras, misma posición que el frente para simetría visual
  let bx = 60
  const seed = 11
  for (let i = 0; i < 46; i++) {
    const w = ((i * seed) % 4) + 1.5
    g.fillStyle = i % 3 === 0 ? 'rgba(196,181,253,0.75)' : 'rgba(255,255,255,0.35)'
    g.fillRect(bx, 762, w, 44)
    bx += w + 5
    if (bx > W - 70) break
  }

  g.fillStyle = '#5D5A77'
  g.font = '400 19px "JetBrains Mono", monospace'
  g.fillText(identity.handle, 60, 838)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function useCardTexture(src) {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    let alive = true
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error('foto no encontrada')
        return res.blob()
      })
      .then((blob) => createImageBitmap(blob))
      .then((bitmap) => {
        if (!alive) return
        setTex(drawCardFace(bitmap))
      })
      .catch(() => {
        if (!alive) return
        setTex(drawCardFace(null))
      })
    return () => {
      alive = false
    }
  }, [src])
  return tex
}

/* ---------- el carné colgante ---------- */
function Band({ maxSpeed = 50, minSpeed = 10, reduced, flipTrigger }) {
  const band = useRef()
  const fixed = useRef()
  const j1 = useRef()
  const j2 = useRef()
  const j3 = useRef()
  const card = useRef()

  const vec = useMemo(() => new THREE.Vector3(), [])
  const ang = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const euler = useMemo(() => new THREE.Euler(), [])

  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 1.8, linearDamping: 1.8 }

  const { width, height } = useThree((s) => s.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const downPos = useRef({ x: 0, y: 0 })

  const bandTex = useMemo(() => makeBandTexture(), [])
  const faceTex = useCardTexture(identity.foto)
  const backTex = useMemo(() => drawCardBack(), [])

  // el mismo giro se puede disparar por teclado (ver Lanyard(), más abajo,
  // que sube flipTrigger en el wrapper accesible) o con un tap/click corto
  // sobre el carné — ambos caminos convergen en este estado
  useEffect(() => {
    if (!flipTrigger) return
    setFlipped((f) => !f)
  }, [flipTrigger])

  // con reduced-motion la física está en pausa (paused={reduced} en
  // <Physics>, en Lanyard()) así que un torque no movería nada: en ese caso
  // el giro se aplica una sola vez, directo, sin animar el balanceo
  useEffect(() => {
    if (!reduced || !card.current) return
    q.setFromEuler(euler.set(0, flipped ? Math.PI : 0, 0))
    card.current.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true)
  }, [flipped, reduced])

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 0, -0.05]])

  useEffect(() => {
    if (hovered) document.body.style.cursor = dragged ? 'grabbing' : 'grab'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered, dragged])

  // impulso inicial: el carné entra cayendo y se balancea solo
  useEffect(() => {
    const t = setTimeout(() => {
      card.current?.applyImpulse({ x: -1.2, y: 0, z: 0.55 }, true)
    }, 700)
    return () => clearTimeout(t)
  }, [])

  useFrame((state, delta) => {
    if (!fixed.current || !card.current) return

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((r) => r.current?.wakeUp())
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      })
    }

    ;[j1, j2].forEach((ref) => {
      if (!ref.current) return
      if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
      const clamped = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
      ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clamped * (maxSpeed - minSpeed)))
    })

    if (!j1.current?.lerped || !j2.current?.lerped || !j3.current) return

    curve.points[0].copy(j3.current.translation())
    curve.points[1].copy(j2.current.lerped)
    curve.points[2].copy(j1.current.lerped)
    curve.points[3].copy(fixed.current.translation())
    band.current?.geometry.setPoints(curve.getPoints(32))

    ang.copy(card.current.angvel())
    if (reduced) {
      card.current.setAngvel({ x: ang.x, y: 0, z: ang.z }, true)
    } else {
      // resorte angular hacia 0° o 180° según `flipped` — reemplaza el
      // antiguo "vuelve siempre al frente" para poder sostener también el
      // reverso como destino estable
      const r = card.current.rotation()
      q.set(r.x, r.y, r.z, r.w)
      euler.setFromQuaternion(q, 'YXZ')
      const target = flipped ? Math.PI : 0
      let diff = target - euler.y
      diff -= Math.PI * 2 * Math.round(diff / (Math.PI * 2))
      card.current.setAngvel({ x: ang.x, y: ang.y + diff * 0.32, z: ang.z }, true)
    }
  })

  curve.curveType = 'chordal'

  return (
    <>
      <group position={[0, 4.2, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.02]} position={[0, -1.2, -0.05]} />
          <group
            scale={1}
            position={[0, -1.2, -0.05]}
            onPointerOver={(e) => {
              e.stopPropagation()
              hover(true)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              hover(false)
            }}
            onPointerUp={(e) => {
              // el grupo tiene varias mallas apiladas en el mismo eje (caja,
              // cara, reverso, halo) — sin esto, un solo click dispara el
              // handler una vez por cada malla que atraviesa el rayo
              e.stopPropagation()
              e.target?.releasePointerCapture?.(e.pointerId)
              drag(false)
              // un tap (poco movimiento entre down y up) gira el carné; si
              // hubo arrastre real, no — evita que soltar el drag dispare
              // un giro accidental
              const dx = e.clientX - downPos.current.x
              const dy = e.clientY - downPos.current.y
              if (Math.hypot(dx, dy) < 6) setFlipped((f) => !f)
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              downPos.current = { x: e.clientX, y: e.clientY }
              e.target?.setPointerCapture?.(e.pointerId)
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}
          >
            {/* cuerpo del carné */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.6, 2.25, 0.035]} />
              <meshPhysicalMaterial
                color="#0f0d1c"
                roughness={0.35}
                metalness={0.15}
                clearcoat={1}
                clearcoatRoughness={0.12}
              />
            </mesh>

            {/* cara impresa */}
            <mesh position={[0, 0, 0.019]}>
              <planeGeometry args={[1.56, 2.21]} />
              <meshPhysicalMaterial
                key={faceTex ? 'photo' : 'placeholder'}
                map={faceTex || undefined}
                color={faceTex ? '#ffffff' : '#221c45'}
                roughness={0.55}
                metalness={0.05}
                clearcoat={0.35}
                clearcoatRoughness={0.45}
                envMapIntensity={0.5}
                transparent
              />
            </mesh>

            {/* reverso: perfil técnico + contacto. Rotado 180° en su propio
                espacio local para que, al sumarse al giro físico del carné,
                el texto quede legible (no espejado) cuando queda de frente
                a cámara — dos giros de 180° se cancelan entre sí. Va a
                -0.021 (más lejos que el halo, ver abajo) porque un giro de
                180° invierte el eje z local: lo más "hacia atrás" hoy es lo
                que termina más cerca de cámara una vez que la tarjeta gira. */}
            <mesh position={[0, 0, -0.021]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[1.56, 2.21]} />
              <meshPhysicalMaterial
                map={backTex}
                color="#ffffff"
                roughness={0.55}
                metalness={0.05}
                clearcoat={0.35}
                clearcoatRoughness={0.45}
                envMapIntensity={0.5}
                transparent
              />
            </mesh>

            {/* borde luminoso — queda igual que antes de agregar el
                reverso; por la misma inversión de eje explicada arriba,
                dejarlo en -0.019 hace que asome como halo detrás del
                reverso en vez de taparlo */}
            <mesh position={[0, 0, -0.019]}>
              <planeGeometry args={[1.68, 2.33]} />
              <meshBasicMaterial color="#8B5CF6" transparent opacity={0.16} />
            </mesh>

            {/* clip metálico */}
            <mesh position={[0, 1.2, 0]}>
              <torusGeometry args={[0.13, 0.028, 16, 48]} />
              <meshPhysicalMaterial
                color="#d8d5e8"
                roughness={0.1}
                metalness={1}
                clearcoat={1}
                clearcoatRoughness={0.04}
                envMapIntensity={1.8}
              />
            </mesh>
          </group>
        </RigidBody>
      </group>

      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#ffffff"
          depthTest={false}
          resolution={[width, height]}
          useMap={1}
          map={bandTex}
          repeat={[-4, 1]}
          lineWidth={0.72}
        />
      </mesh>
    </>
  )
}

export default function Lanyard() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [flipTrigger, setFlipTrigger] = useState(0)
  const flip = () => setFlipTrigger((n) => n + 1)

  return (
    <div
      className="lanyard-stage"
      role="button"
      tabIndex={0}
      aria-label="Credencial de acceso. Presiona Enter para girarla y ver el reverso."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          flip()
        }
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 13], fov: 25 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} castShadow />
        <pointLight position={[-4, -2, 3]} intensity={18} color="#8B5CF6" distance={16} />
        <pointLight position={[5, 1, 4]} intensity={12} color="#22D3EE" distance={16} />

        <Physics gravity={[0, -30, 0]} timeStep={1 / 60} paused={reduced}>
          <Band reduced={reduced} flipTrigger={flipTrigger} />
        </Physics>

        <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={12} blur={2.8} far={6} resolution={512} color="#050308" />

        <Environment resolution={128}>
          <Lightformer intensity={2.4} color="#C4B5FD" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.15, 1]} />
          <Lightformer intensity={2.6} color="#8B5CF6" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.12, 1]} />
          <Lightformer intensity={2.6} color="#22D3EE" position={[1, 1, -1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.12, 1]} />
          <Lightformer intensity={3.5} color="#ffffff" position={[-8, 4, 12]} scale={[12, 12, 1]} />
        </Environment>
      </Canvas>
      <span className="drag-hint">Arrastra la credencial · toca para girarla</span>
    </div>
  )
}
