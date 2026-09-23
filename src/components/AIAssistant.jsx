import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import NyxCat from './nyx/NyxCat'
import { getLocalReply, DEFAULT_SUGGESTIONS } from '../lib/assistantBrain'
import { scrollToAnchor } from '../lib/useSmoothScroll'
import { onNyxEvent } from '../lib/nyxEvents'
import { expedientes } from '../data/content'

// Sin VITE_CHAT_API_URL definida, Nyx responde con reglas locales
// (assistantBrain.js) — gratis, sin servidor. En cuanto se defina esa
// variable (tras desplegar api/chat.js con una API key real), pasa a usar
// IA real automáticamente, sin tocar este componente.
const REMOTE_ENDPOINT = import.meta.env.VITE_CHAT_API_URL || ''
const REMOTE_TIMEOUT_MS = 20000
const GREETING = '¡Hola! Soy Nyx 🐾 el asistente de Yair. Pregúntame por sus proyectos, su stack o cómo contactarlo.'
const THINK_DELAY = [350, 700]
const PLAY_MS = 15000
const SLEEP_MS = 40000
const TIP_MS = 7500
const MAX_INPUT = 500
const STORED_MESSAGES = 40

// comentario de Nyx la primera vez (por sesión) que el visitante llega a cada zona
const TIPS = {
  z01: { text: '¡Hola! Soy Nyx 🐾 Arrastra el carné, o tócalo para ver el reverso.', mood: 'saludando' },
  z02: { text: 'Ese robot saluda si le haces clic. Somos amigos… creo.', mood: 'travieso' },
  z03: { text: '¿Buscas una tecnología en particular? Pregúntame y te digo dónde la usó.', mood: 'curioso' },
  z04: { text: 'Toca una tarjeta para abrir el expediente completo.', mood: 'contento' },
  z05: { text: 'Sí, también tiene vida fuera del código.', mood: 'travieso' },
  z06: { text: '¿Le vas a escribir? Normalmente responde el mismo día.', mood: 'celebrando' },
  archivo: { text: 'Aquí están todos sus proyectos. Usa el buscador… o pregúntame a mí.', mood: 'curioso' },
}

// preguntas sugeridas al abrir el chat, según la sección en la que está el visitante
const OPENING_SUGGESTIONS = {
  z03: ['¿Sabe React?', '¿Usa Docker?', '¿Qué tecnologías usa?'],
  z04: expedientes.slice(0, 3).map((p) => `Cuéntame de ${p.nombre}`),
  archivo: expedientes.slice(0, 3).map((p) => `Cuéntame de ${p.nombre}`),
  z06: ['¿Cuánto cobra?', '¿Cómo lo contacto?', '¿Tiene CV?'],
}

// poses sentadas, que se leen bien recortadas en el avatar redondo del chat
const AVATAR_MOODS = new Set(['normal', 'contento', 'curioso', 'travieso', 'pensando', 'sorprendido', 'celebrando', 'saludando'])

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const storage = (kind) => {
  try {
    return window[kind]
  } catch {
    return null // almacenamiento no disponible (modo privado, etc.)
  }
}

function readJSON(kind, key, fallback) {
  try {
    return JSON.parse(storage(kind)?.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function writeJSON(kind, key, value) {
  try {
    storage(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    /* no-op */
  }
}

// el portapapeles moderno puede estar bloqueado (iframes, permisos): en ese
// caso se prueba con el método clásico de seleccionar un textarea oculto
async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      /* sin soporte */
    }
    ta.remove()
    return ok
  }
}

// emails, URLs y teléfonos del texto como enlaces reales
const LINKABLE = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s)]*[^\s).,]|\+\d[\d ]{7,}\d)/g
function Linkified({ text }) {
  return text.split(LINKABLE).map((part, i) => {
    if (i % 2 === 0) return part
    const href = part.includes('@') ? `mailto:${part}` : part.startsWith('+') ? `tel:${part.replace(/\s/g, '')}` : part
    return (
      <a key={i} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {part}
      </a>
    )
  })
}

// la respuesta nueva se escribe de a poco, como en un chat real; dura como
// mucho ~1.4 s aunque el texto sea largo. Para lectores de pantalla el texto
// completo va en un span oculto y la animación queda fuera del árbol accesible.
function Typewriter({ text, onDone, onTick }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const step = Math.max(1, Math.ceil(text.length / 90))
    const id = setInterval(() => {
      setN((prev) => {
        const next = Math.min(text.length, prev + step)
        if (next === text.length) clearInterval(id)
        return next
      })
    }, 16)
    return () => clearInterval(id)
  }, [text])
  useEffect(() => {
    onTick?.()
    if (n >= text.length) onDone?.()
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}</span>
    </>
  )
}

export default function AIAssistant() {
  const reduce = useReducedMotion()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tip, setTip] = useState(null)
  const [messages, setMessages] = useState(() => readJSON('sessionStorage', 'nyx-chat', []))
  const [ctx, setCtx] = useState(() => readJSON('sessionStorage', 'nyx-ctx', {}))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [flash, setFlash] = useState(null) // expresión temporal: { mood, until }
  const [idle, setIdle] = useState('awake') // awake | playing | sleeping
  const [hover, setHover] = useState(false)
  const [ducked, setDucked] = useState(false)
  const [muted, setMuted] = useState(() => readJSON('localStorage', 'nyx-muted', 0) === 1)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const zoneRef = useRef(null)
  const tipsSeen = useRef(new Set(readJSON('sessionStorage', 'nyx-tips', [])))
  const openRef = useRef(open)
  openRef.current = open

  const react = useCallback((mood, ms = 4500) => setFlash({ mood, until: Date.now() + ms }), [])

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), Math.max(0, flash.until - Date.now()))
    return () => clearTimeout(id)
  }, [flash])

  // la conversación sobrevive a recargas y cambios de página durante la sesión
  useEffect(() => {
    writeJSON('sessionStorage', 'nyx-chat', messages.slice(-STORED_MESSAGES).map(({ fresh, ...m }) => m))
  }, [messages])
  useEffect(() => {
    writeJSON('sessionStorage', 'nyx-ctx', ctx)
  }, [ctx])

  const mood = loading
    ? 'trabajando'
    : flash
      ? flash.mood
      : ducked && !open
        ? 'asoma'
        : idle === 'sleeping'
          ? 'durmiendo'
          : idle === 'playing'
            ? 'jugando'
            : open && input.trim()
              ? 'curioso'
              : hover
                ? 'contento'
                : 'normal'

  // si nadie hace nada se pone a jugar, y un rato después se duerme; al
  // volver la actividad se despierta sobresaltado
  useEffect(() => {
    let state = 'awake'
    let timers = []
    const set = (next) => {
      state = next
      setIdle(next)
    }
    const schedule = () => {
      timers.forEach(clearTimeout)
      timers = [setTimeout(() => set('playing'), PLAY_MS), setTimeout(() => set('sleeping'), SLEEP_MS)]
    }
    let last = 0
    const onActivity = () => {
      const woke = state !== 'awake'
      if (state === 'sleeping') react('sorprendido', 1400)
      if (woke) set('awake')
      // pointermove llega decenas de veces por segundo: reprograma como mucho 2 veces/s
      const now = Date.now()
      if (!woke && now - last < 500) return
      last = now
      schedule()
    }
    schedule()
    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }))
    return () => {
      timers.forEach(clearTimeout)
      events.forEach((ev) => window.removeEventListener(ev, onActivity))
    }
  }, [react])

  // se agacha mientras hay scroll y se vuelve a asomar cuando para
  useEffect(() => {
    let timer
    const onScroll = () => {
      if (openRef.current) return
      setDucked(true)
      clearTimeout(timer)
      timer = setTimeout(() => setDucked(false), 650)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [])

  // un comentario de Nyx en la burbuja. Con `key` sale una sola vez por
  // sesión; silenciado (o con el chat abierto) solo cambia de pose
  const say = useCallback(
    ({ key, text, mood }) => {
      if (key && tipsSeen.current.has(key)) return
      react(mood, 3000)
      if (muted || openRef.current) return
      if (key) {
        tipsSeen.current.add(key)
        writeJSON('sessionStorage', 'nyx-tips', [...tipsSeen.current])
      }
      setTip({ text, mood })
    },
    [muted, react]
  )
  const showTip = useCallback((key) => TIPS[key] && say({ key, ...TIPS[key] }), [say])

  // eventos del resto del sitio: carné girado, robot saludado, formulario enviado
  useEffect(() => onNyxEvent(say), [say])

  // detecta la zona en la que está el visitante (la que cruza el centro de la
  // pantalla) y, si se queda un momento, Nyx comenta algo sobre ella
  useEffect(() => {
    let pending
    if (pathname.startsWith('/expedientes')) {
      zoneRef.current = 'archivo'
      pending = setTimeout(() => showTip('archivo'), 1800)
      return () => clearTimeout(pending)
    }
    const els = Object.keys(TIPS)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting)
        if (!hit) return
        zoneRef.current = hit.target.id
        clearTimeout(pending)
        pending = setTimeout(() => showTip(hit.target.id), hit.target.id === 'z01' ? 2200 : 1200)
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      clearTimeout(pending)
    }
  }, [pathname, showTip])

  useEffect(() => {
    if (!tip) return
    const id = setTimeout(() => setTip(null), TIP_MS)
    return () => clearTimeout(id)
  }, [tip])

  const scrollToEnd = useCallback(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [])
  useEffect(scrollToEnd, [messages, loading, open, scrollToEnd])

  // la respuesta terminó de escribirse: pasa a texto normal (con enlaces) y
  // aparecen sus botones y sugerencias
  const settle = useCallback((index) => {
    setMessages((ms) => (ms[index]?.fresh ? ms.map((m, i) => (i === index ? { ...m, fresh: false } : m)) : ms))
  }, [])

  // al abrir (o tras cada respuesta) el foco vuelve al campo de texto; en
  // pantallas táctiles no, para no sacar el teclado sin que lo pidan
  useEffect(() => {
    if (open && !loading && !window.matchMedia('(pointer: coarse)').matches) inputRef.current?.focus()
  }, [open, loading])

  const closeChat = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closeChat()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeChat])

  const greeting = () => ({
    role: 'assistant',
    content: GREETING,
    suggestions: OPENING_SUGGESTIONS[zoneRef.current] || DEFAULT_SUGGESTIONS,
  })

  const openChat = () => {
    setOpen(true)
    setTip(null)
    setDucked(false)
    react('saludando', 1800)
    setMessages((m) => (m.length ? m : [greeting()]))
  }

  const resetChat = () => {
    setMessages([greeting()])
    setCtx({})
    react('contento', 1500)
  }

  const toggleMuted = () => {
    setMuted((m) => {
      writeJSON('localStorage', 'nyx-muted', m ? 0 : 1)
      return !m
    })
  }

  const runAction = useCallback(
    async (action) => {
      // al navegar el chat se cierra para dejar ver el destino (la
      // conversación queda guardada y sigue ahí al reabrirlo)
      if (action.type === 'route' || action.type === 'anchor') setOpen(false)
      if (action.type === 'route') {
        navigate(action.to)
      } else if (action.type === 'anchor') {
        // Home recibe ?z=<sección> y hace el scroll al montarse (ver Home.jsx)
        if (pathname === '/') scrollToAnchor(action.id)
        else navigate(`/?z=${action.id}`)
      } else if (action.type === 'copy') {
        const ok = await copyText(action.value)
        setCopied({ value: action.value, ok })
        if (ok) react('contento', 1500)
        setTimeout(() => setCopied(null), 1800)
      }
    },
    [navigate, pathname, react]
  )

  const ask = async (raw) => {
    const text = raw.trim().slice(0, MAX_INPUT)
    if (!text || loading) return

    const history = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setInput('')
    setLoading(true)

    // el cerebro local siempre corre: da la respuesta sin servidor, y con
    // servidor aporta la pose, los botones y el plan B si la red falla
    const local = getLocalReply(text, ctx)
    let reply = { role: 'assistant', content: local.text, actions: local.actions, suggestions: local.suggestions }

    try {
      if (REMOTE_ENDPOINT) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS)
        try {
          const res = await fetch(REMOTE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
            signal: controller.signal,
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.reply) {
            reply = { ...reply, content: data.reply }
          } else if (res.status === 429) {
            reply = { ...reply, content: `${data.error || 'Muchas preguntas seguidas.'} Mientras tanto: ${local.text}` }
          }
          // cualquier otro error: se queda la respuesta local
        } finally {
          clearTimeout(timeout)
        }
      } else {
        // pequeña demora simulada para que se sienta natural en vez de instantáneo
        await wait(THINK_DELAY[0] + Math.random() * (THINK_DELAY[1] - THINK_DELAY[0]))
      }
    } catch {
      /* red caída o timeout: se queda la respuesta local */
    }

    setMessages((m) => [...m, { ...reply, fresh: !reduce }])
    setCtx(local.ctx || ctx)
    setLoading(false)
    react(local.mood)
    if (local.go) setTimeout(() => runAction(local.go), 700)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    ask(input)
  }

  const last = messages[messages.length - 1]
  const suggestions = !loading && last?.role === 'assistant' && !last.fresh ? last.suggestions : null

  return (
    <div className="ai-widget">
      <AnimatePresence>
        {tip && !open && (
          <motion.div
            className="ai-bubble"
            initial={{ opacity: 0, y: 10, scale: reduce ? 1 : 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <button type="button" className="ai-bubble-text" onClick={openChat}>
              {tip.text}
            </button>
            <button type="button" className="ai-bubble-close" aria-label="Cerrar aviso" onClick={() => setTip(null)}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-panel"
            role="dialog"
            aria-label="Chat con Nyx"
            initial={{ opacity: 0, y: 24, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="ai-panel-head">
              <span className="ai-id">
                <span className="ai-avatar">
                  <NyxCat mood={AVATAR_MOODS.has(mood) ? mood : mood === 'trabajando' ? 'pensando' : 'normal'} />
                </span>
                <span>
                  <b>Nyx</b>
                  <small>
                    <i className="ai-dot" /> {loading ? 'Escribiendo…' : 'Asistente de Yair'}
                  </small>
                </span>
              </span>
              <span className="ai-head-actions">
                <button type="button" onClick={resetChat} aria-label="Nueva conversación" title="Nueva conversación">
                  ↺
                </button>
                <button
                  type="button"
                  onClick={toggleMuted}
                  aria-label={muted ? 'Activar los comentarios de Nyx' : 'Silenciar los comentarios de Nyx'}
                  title={muted ? 'Activar los comentarios de Nyx' : 'Silenciar los comentarios de Nyx'}
                >
                  {muted ? '🔕' : '🔔'}
                </button>
                <button type="button" aria-label="Cerrar chat" onClick={closeChat}>
                  ✕
                </button>
              </span>
            </header>

            <div className="ai-messages" ref={listRef} role="log" aria-live="polite" data-lenis-prevent>
              {messages.map((m, i) => (
                <div key={i} className={`ai-turn ai-turn-${m.role}`}>
                  <div className={`ai-msg ai-msg-${m.role}`}>
                    {m.fresh ? (
                      <Typewriter text={m.content} onDone={() => settle(i)} onTick={scrollToEnd} />
                    ) : (
                      <Linkified text={m.content} />
                    )}
                  </div>
                  {!m.fresh && m.actions?.length > 0 && (
                    <div className="ai-actions">
                      {m.actions.map((a) =>
                        a.type === 'link' ? (
                          <a key={a.label} className="ai-action" href={a.href} target="_blank" rel="noreferrer">
                            {a.label} ↗
                          </a>
                        ) : (
                          <button key={a.label} type="button" className="ai-action" onClick={() => runAction(a)}>
                            {a.type === 'copy' && copied?.value === a.value ? (copied.ok ? '¡Copiado!' : 'No se pudo copiar') : a.label}
                            {a.type === 'route' || a.type === 'anchor' ? ' →' : ''}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="ai-msg ai-msg-assistant ai-typing" aria-label="Nyx está escribiendo">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            {suggestions?.length > 0 && (
              <div className="ai-suggestions" data-lenis-prevent>
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form className="ai-form" onSubmit={onSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escríbele a Nyx..."
                aria-label="Mensaje para Nyx"
                disabled={loading}
                maxLength={MAX_INPUT}
                autoComplete="off"
              />
              <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar">
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        ref={launcherRef}
        className={`nyx-launcher${ducked && !open ? ' is-ducked' : ''}${open ? ' is-open' : ''}`}
        onClick={() => (open ? closeChat() : openChat())}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-label={open ? 'Cerrar chat con Nyx' : 'Abrir chat con Nyx, el asistente'}
        aria-expanded={open}
        data-cursor
      >
        <NyxCat mood={mood} />
      </button>
    </div>
  )
}
