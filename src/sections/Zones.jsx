import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Reveal from '../components/Reveal'
import { LazyLanyard, LazyGuide } from '../components/Lazy3D'
import { identity, perfil, capacidades, trayectoria, expedientes, fueraDeHorario, contacto, zones } from '../data/content'

gsap.registerPlugin(ScrollTrigger)

function Tag({ i }) {
  const z = zones[i]
  return (
    <span className="zone-tag">
      <i />
      <b>{z.code}</b> {z.name}
    </span>
  )
}

/* ================= Z-01 RECEPCIÓN ================= */
export function Z01() {
  const reduce = useReducedMotion()
  const letters = identity.nombre.split('')

  return (
    <section id="z01" className="zone z1">
      <div className="zone-inner z1-grid">
        <div>
          <motion.span
            className="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="pulse" /> {identity.disponible}
          </motion.span>

          <motion.p
            className="hello"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            Credencial de acceso
          </motion.p>

          <h1 aria-label={identity.nombre}>
            {letters.map((c, i) => (
              <motion.span
                key={i}
                className="ch"
                aria-hidden="true"
                initial={{ y: reduce ? 0 : '105%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 + i * 0.055, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
              >
                {c}
              </motion.span>
            ))}
          </h1>

          <motion.div
            className="rol"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {identity.rol} <s>/ {identity.especialidad}</s>
          </motion.div>

          <motion.p
            className="desc"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.98, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {identity.descripcion}
          </motion.p>

          <motion.div
            className="z1-cta"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <a className="btn btn-solid" href="#z05" data-cursor>
              Ver expedientes
            </a>
            <a className="btn btn-ghost" href="#z02" data-cursor>
              Sobre mí
            </a>
          </motion.div>

          <motion.div
            className="stack-strip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
          >
            {identity.stackHero.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1.2 }}
        >
          <LazyLanyard />
        </motion.div>
      </div>
    </section>
  )
}

/* ================= Z-02 PERFIL ================= */
export function Z02() {
  return (
    <section id="z02" className="zone">
      <div className="zone-inner z2-grid">
        <Reveal from="scale">
          <LazyGuide />
        </Reveal>

        <div>
          <Reveal from="mask">
            <Tag i={1} />
            <h2 className="zt">
              Detrás de <em>la credencial</em>
            </h2>
          </Reveal>

          {perfil.parrafos.map((p, i) => (
            <Reveal key={i} from="mask" delay={0.1 + i * 0.12}>
              <p className="lede" style={{ marginBottom: 16 }}>
                {p}
              </p>
            </Reveal>
          ))}

          <div className="stat-row">
            {perfil.stats.map((s, i) => (
              <Reveal key={s.l} from="up" delay={0.08 * i}>
                <div className="stat">
                  <b>{s.n}</b>
                  <i>{s.l}</i>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal from="up" delay={0.2}>
            <a className="btn btn-ghost" href={identity.cv} data-cursor>
              Descargar CV ↓
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ================= Z-03 CAPACIDADES ================= */
const dirs = ['left', 'up', 'right', 'right', 'down', 'left']

export function Z03() {
  return (
    <section id="z03" className="zone">
      <div className="zone-inner">
        <Reveal from="mask">
          <Tag i={2} />
          <h2 className="zt">
            Lo que puedo <em>construir</em>
          </h2>
          <p className="lede">
            Seis áreas, un mismo criterio: entender el problema antes de escribir la primera línea.
          </p>
        </Reveal>

        <div className="cap-grid">
          {capacidades.map((c, i) => (
            <Reveal key={c.titulo} from={dirs[i % dirs.length]} delay={i * 0.07}>
              <div className="cap" data-cursor>
                <h4>{c.titulo}</h4>
                <div className="lvl">
                  <b style={{ width: `${c.nivel}%` }} />
                </div>
                <ul>
                  {c.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================= Z-04 TRAYECTORIA (scroll horizontal) ================= */
export function Z04() {
  const pin = useRef(null)
  const rail = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth < 780) return

    const ctx = gsap.context(() => {
      const r = rail.current
      if (!r) return
      const distance = () => Math.max(0, r.scrollWidth - window.innerWidth + 120)

      gsap.to(r, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin.current,
          start: 'top top',
          end: () => '+=' + distance(),
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, pin)

    return () => ctx.revert()
  }, [])

  return (
    <section id="z04" className="zone track-pin" ref={pin}>
      <div className="zone-inner">
        <Reveal from="mask">
          <Tag i={3} />
          <h2 className="zt">
            El registro de <em>acceso</em>
          </h2>
        </Reveal>
      </div>

      <div
        className="track-rail"
        ref={rail}
        style={{ paddingLeft: 'max(0px, calc((100vw - 1240px)/2))', overflowX: 'auto' }}
      >
        {trayectoria.map((t) => (
          <article className="track-card" key={t.cuando} data-cursor>
            <span className="track-when">{t.cuando}</span>
            <h4>{t.cargo}</h4>
            <span className="track-where">{t.donde}</span>
            <p>{t.texto}</p>
            <div className="track-tags">
              {t.tags.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ================= Z-05 EXPEDIENTES ================= */
export function FileCard({ p, onOpen }) {
  return (
    <article className="file" data-cursor onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen() } }}>
      <div className="file-shot">
        <div
          className="sheen"
          style={{ background: `linear-gradient(135deg, ${p.tono[0]}, ${p.tono[1]})` }}
        />
        <div className="file-meta">
          <span className={`st ${p.estado === 'live' ? 'live' : 'arch'}`}>
            {p.estado === 'live' ? 'En producción' : 'Archivado'}
          </span>
          <span className="yr">{p.anio}</span>
        </div>
      </div>
      <div className="file-body">
        <h4>{p.nombre}</h4>
        <p>{p.resumen}</p>
        <div className="file-tags">
          {p.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <span className="file-open">
          Abrir expediente <i>↗</i>
        </span>
      </div>
    </article>
  )
}

export function Z05() {
  const destacados = expedientes.slice(0, 4)
  return (
    <section id="z05" className="zone">
      <div className="zone-inner">
        <Reveal from="mask">
          <Tag i={4} />
          <h2 className="zt">
            Trabajo <em>archivado</em>
          </h2>
          <p className="lede">Cuatro expedientes destacados. El archivo completo está una puerta más allá.</p>
        </Reveal>

        <div className="file-grid">
          {destacados.map((p, i) => (
            <Reveal key={p.slug} from={i % 2 ? 'right' : 'left'} delay={i * 0.08}>
              <FileCard p={p} />
            </Reveal>
          ))}
        </div>

        <Reveal from="up" delay={0.1}>
          <Link to="/expedientes" className="reader" data-cursor>
            <span className="reader-line" />
            <div>
              <small>Lector de credencial</small>
              <h3>Explorar todos mis proyectos</h3>
            </div>
            <span className="btn btn-solid">Pasar la credencial →</span>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ================= Z-06 FUERA DE HORARIO ================= */
export function Z06() {
  return (
    <section id="z06" className="zone">
      <div className="zone-inner">
        <Reveal from="mask">
          <Tag i={5} />
          <h2 className="zt">
            Cuando la credencial <em>se guarda</em>
          </h2>
          <p className="lede">Lo que hago cuando no estoy frente a un editor. También cuenta.</p>
        </Reveal>

        <div className="off-grid">
          {fueraDeHorario.map((h, i) => (
            <Reveal key={h.k} from="scale" delay={i * 0.06}>
              <div className="off" data-cursor>
                <span className="k">{h.k}</span>
                <b>{h.t}</b>
                <p>{h.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================= Z-07 CONTACTO ================= */
export function Z07() {
  const [nota, setNota] = useState('')

  const enviar = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const asunto = encodeURIComponent(`Contacto de ${f.get('nombre')}`)
    const cuerpo = encodeURIComponent(`${f.get('mensaje')}\n\n— ${f.get('nombre')} (${f.get('email')})`)
    window.location.href = `mailto:${contacto.email}?subject=${asunto}&body=${cuerpo}`
    setNota('Abriendo tu cliente de correo. Si no ocurre nada, escríbeme directo al email de arriba.')
  }

  return (
    <section id="z07" className="zone">
      <div className="zone-inner z7-grid">
        <div>
          <Reveal from="mask">
            <Tag i={6} />
            <h2 className="zt">
              Solicitar <em>acceso</em>
            </h2>
            <p className="lede">
              ¿Un proyecto, una idea o solo saludar? Escríbeme y respondo — normalmente el mismo día.
            </p>
          </Reveal>

          <Reveal from="up" delay={0.12}>
            <ul className="cx">
              <li>
                <span className="k">Email</span>
                <a href={`mailto:${contacto.email}`} data-cursor>
                  {contacto.email}
                </a>
              </li>
              <li>
                <span className="k">Teléfono</span>
                <a href={`tel:${contacto.telefono.replace(/[^+\d]/g, '')}`} data-cursor>
                  {contacto.telefono}
                </a>
              </li>
              <li>
                <span className="k">Ubicación</span>
                <span className="v">{contacto.ubicacion}</span>
              </li>
              <li>
                <span className="k">Redes</span>
                <span style={{ display: 'flex', gap: 18 }}>
                  {contacto.redes.map((r) => (
                    <a key={r.n} href={r.u} target="_blank" rel="noreferrer" data-cursor>
                      {r.n}
                    </a>
                  ))}
                </span>
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal from="right" delay={0.1}>
          <form className="form glass" onSubmit={enviar}>
            <label>
              Nombre
              <input name="nombre" type="text" required placeholder="¿Cómo te llamas?" />
            </label>
            <label>
              Email
              <input name="email" type="email" required placeholder="tu@correo.com" />
            </label>
            <label>
              Mensaje
              <textarea name="mensaje" rows="5" required placeholder="Cuéntame en qué estás pensando..." />
            </label>
            <button className="btn btn-solid" type="submit" style={{ justifyContent: 'center' }} data-cursor>
              Enviar solicitud
            </button>
            <p className="note">{nota}</p>
          </form>
        </Reveal>
      </div>

      <footer className="foot">
        <span>
          © {new Date().getFullYear()} {identity.nombre} {identity.apellido}
        </span>
        <span>Credencial de acceso · v1.0</span>
      </footer>
    </section>
  )
}
