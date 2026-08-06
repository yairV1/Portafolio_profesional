import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import { FileCard } from '../sections/Zones'
import { expedientes } from '../data/content'

export default function Archive() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todos')
  const [open, setOpen] = useState(null)

  const cats = useMemo(() => ['Todos', ...new Set(expedientes.map((p) => p.categoria))], [])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return expedientes.filter((p) => {
      const okCat = cat === 'Todos' || p.categoria === cat
      const okQ =
        !t ||
        p.nombre.toLowerCase().includes(t) ||
        p.resumen.toLowerCase().includes(t) ||
        p.stack.join(' ').toLowerCase().includes(t)
      return okCat && okQ
    })
  }, [q, cat])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  return (
    <div className="archive">
      <Link to="/" className="back" data-cursor>
        ← Volver a recepción
      </Link>

      <Reveal from="mask">
        <span className="zone-tag">
          <i />
          <b>ARCHIVO</b> Expedientes completos
        </span>
        <h2 className="zt">
          Todo lo que he <em>construido</em>
        </h2>
      </Reveal>

      <div className="filters">
        <div className="search">
          <span>BUSCAR</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, tecnología o descripción..."
            aria-label="Buscar expedientes"
          />
        </div>
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)} data-cursor>
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="count">
        {list.length} {list.length === 1 ? 'expediente' : 'expedientes'}
      </p>

      {list.length ? (
        <div className="archive-grid">
          {list.map((p, i) => (
            <Reveal key={p.slug} from="up" delay={Math.min(i, 6) * 0.06}>
              <FileCard p={p} onOpen={() => setOpen(p)} />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="empty">Sin resultados para esa búsqueda</p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="sheet-bg" onClick={() => setOpen(null)} />
            <motion.div
              className="sheet-body"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label={open.nombre}
            >
              <button className="sheet-close" onClick={() => setOpen(null)} aria-label="Cerrar">
                ✕
              </button>
              <span className="zone-tag">
                <i />
                <b>{open.anio}</b> {open.categoria}
              </span>
              <h3>{open.nombre}</h3>
              <p className="lede">{open.resumen}</p>

              <div className="file-tags" style={{ marginTop: 18 }}>
                {open.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>

              <div className="sheet-cols">
                <div>
                  <h5>Arquitectura</h5>
                  <ul>
                    {open.arquitectura.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5>Aprendizajes</h5>
                  <ul>
                    {open.aprendizajes.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="sheet-links">
                <a className="btn btn-solid" href={open.demo} target="_blank" rel="noreferrer" data-cursor>
                  Ver demo ↗
                </a>
                <a className="btn btn-ghost" href={open.repo} target="_blank" rel="noreferrer" data-cursor>
                  Código en GitHub
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
