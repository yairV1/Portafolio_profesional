import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { LazyLanyard, LazyGuide } from '../components/Lazy3D'
import { identity, perfil, capacidades, expedientes, fueraDeHorario, contacto, zones } from '../data/content'

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
            <a className="btn btn-solid" href="#z04" data-cursor>
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

          {identity.cv && identity.cv !== '#' && (
            <Reveal from="up" delay={0.2}>
              <a className="btn btn-ghost" href={identity.cv} data-cursor>
                Descargar CV ↓
              </a>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

/* ================= Z-03 CAPACIDADES ================= */
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

        <div className="cap-list">
          {capacidades.map((c, i) => (
            <Reveal key={c.titulo} from="up" delay={i * 0.06}>
              <div className="cap-row" data-cursor>
                <span className="cap-scan" aria-hidden="true" />
                <span className="cap-watermark" aria-hidden="true">
                  {c.titulo}
                </span>
                <div className="cap-row-top">
                  <div className="cap-row-id">
                    <span className="cap-idx">{`C.0${i + 1}`}</span>
                    <h4>{c.titulo}</h4>
                  </div>
                  <div className="lvl">
                    <motion.b
                      style={{ transformOrigin: 'left' }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: c.nivel / 100 }}
                      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
                      transition={{ duration: 1.1, delay: 0.15 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
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

/* ================= Z-04 EXPEDIENTES ================= */
export function FileCard({ p, onOpen }) {
  return (
    <article className="file" data-cursor onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen() } }}>
      <div className="file-shot">
        {p.imagen ? (
          <img className="sheen" src={p.imagen} alt={`Captura de pantalla de ${p.nombre}`} loading="lazy" />
        ) : (
          <div
            className="sheen"
            style={{ background: `linear-gradient(135deg, ${p.tono[0]}, ${p.tono[1]})` }}
          />
        )}
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

export function Z04() {
  const destacados = expedientes.slice(0, 2)
  return (
    <section id="z04" className="zone">
      <div className="zone-inner">
        <Reveal from="mask">
          <Tag i={3} />
          <p className="z5-intro">
            <em>Proyectos y aplicaciones</em> construidos en el camino.
          </p>
        </Reveal>

        <div className="file-grid">
          {destacados.map((p, i) => (
            <Reveal key={p.slug} from={i % 2 ? 'right' : 'left'} delay={i * 0.08}>
              <Link to={`/expedientes?p=${p.slug}`} className="file-link">
                <FileCard p={p} />
              </Link>
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

/* ================= Z-05 FUERA DE HORARIO ================= */
export function Z05() {
  return (
    <section id="z05" className="zone">
      <div className="zone-inner">
        <Reveal from="mask">
          <Tag i={4} />
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

/* ================= Z-06 CONTACTO ================= */
export function Z06() {
  const [estado, setEstado] = useState('idle')

  const enviar = async (e) => {
    e.preventDefault()
    const form = e.target
    const f = new FormData(form)
    if (f.get('botcheck')) return

    f.append('access_key', contacto.web3formsKey)
    f.append('subject', `Contacto de ${f.get('nombre')} — portafolio`)

    setEstado('enviando')
    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: f })
      const data = await res.json()
      if (data.success) {
        setEstado('ok')
        form.reset()
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  return (
    <section id="z06" className="zone">
      <div className="zone-inner z7-grid">
        <div>
          <Reveal from="mask">
            <Tag i={5} />
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
            <input type="checkbox" name="botcheck" tabIndex="-1" autoComplete="off" style={{ display: 'none' }} />
            <label>
              Nombre
              <input name="nombre" type="text" required placeholder="¿Cómo te llamas?" disabled={estado === 'enviando'} />
            </label>
            <label>
              Email
              <input name="email" type="email" required placeholder="tu@correo.com" disabled={estado === 'enviando'} />
            </label>
            <label>
              Tipo de proyecto
              <select name="tipo" required defaultValue="" disabled={estado === 'enviando'}>
                <option value="" disabled>
                  Elegí una opción
                </option>
                <option value="Proyecto web">Proyecto web</option>
                <option value="E-commerce">E-commerce</option>
                <option value="App móvil">App móvil</option>
                <option value="Sistema o plataforma">Sistema o plataforma</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <label>
              Mensaje
              <textarea name="mensaje" rows="5" required placeholder="Cuéntame en qué estás pensando..." disabled={estado === 'enviando'} />
            </label>
            <button
              className="btn btn-solid"
              type="submit"
              disabled={estado === 'enviando'}
              style={{ justifyContent: 'center' }}
              data-cursor
            >
              {estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            <p className="note">
              {estado === 'ok' && 'Mensaje enviado. Te responderé pronto — gracias por escribir.'}
              {estado === 'error' && 'Algo falló al enviar. Escríbeme directo al email de arriba, por favor.'}
            </p>
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
