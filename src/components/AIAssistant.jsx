import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getLocalReply } from '../lib/assistantBrain'

// Sin VITE_CHAT_API_URL definida, el widget responde con reglas locales
// (assistantBrain.js) — gratis, sin servidor. En cuanto se defina esa
// variable (tras desplegar api/chat.js con una API key real), pasa a usar
// IA real automáticamente, sin tocar este componente.
const REMOTE_ENDPOINT = import.meta.env.VITE_CHAT_API_URL || ''
const GREETING = '¡Hola! Soy el asistente de Yair. Preguntame por sus proyectos, su stack o cómo contactarlo.'
const FALLBACK_ERROR = 'No pude conectar en este momento. Escríbeme directo a yandrey2007@gmail.com.'
const THINK_DELAY = [350, 700]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function AIAssistant() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    let greeted = false
    try {
      greeted = sessionStorage.getItem('ai-greeted') === '1'
    } catch {
      /* almacenamiento no disponible (modo privado, etc.) — seguimos sin recordar */
    }
    if (greeted) return

    const showId = setTimeout(() => {
      setShowBubble(true)
      try {
        sessionStorage.setItem('ai-greeted', '1')
      } catch {
        /* no-op */
      }
    }, 2200)
    return () => clearTimeout(showId)
  }, [])

  // la burbuja se cierra sola si no la tocan, para que no quede tapando
  // contenido (texto, formularios) de forma indefinida en pantallas chicas
  useEffect(() => {
    if (!showBubble) return
    const hideId = setTimeout(() => setShowBubble(false), 9000)
    return () => clearTimeout(hideId)
  }, [showBubble])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loading, open])

  const openChat = () => {
    setOpen(true)
    setShowBubble(false)
    setMessages((m) => (m.length ? m : [{ role: 'assistant', content: GREETING }]))
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      if (REMOTE_ENDPOINT) {
        const res = await fetch(REMOTE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next }),
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        setMessages((m) => [...m, { role: 'assistant', content: data.reply || FALLBACK_ERROR }])
      } else {
        // motor local: sin red, con una pequeña demora simulada para que se
        // sienta natural en vez de instantáneo
        await wait(THINK_DELAY[0] + Math.random() * (THINK_DELAY[1] - THINK_DELAY[0]))
        setMessages((m) => [...m, { role: 'assistant', content: getLocalReply(text) }])
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: FALLBACK_ERROR }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-widget">
      <AnimatePresence>
        {showBubble && !open && (
          <motion.div
            className="ai-bubble"
            initial={{ opacity: 0, y: 10, scale: reduce ? 1 : 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <button type="button" className="ai-bubble-text" onClick={openChat}>
              {GREETING}
            </button>
            <button
              type="button"
              className="ai-bubble-close"
              aria-label="Cerrar aviso"
              onClick={(e) => {
                e.stopPropagation()
                setShowBubble(false)
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, y: 24, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="ai-panel-head">
              <span>
                <i className="ai-dot" />
                Asistente de Yair
              </span>
              <button type="button" aria-label="Cerrar chat" onClick={() => setOpen(false)}>
                ✕
              </button>
            </header>

            <div className="ai-messages" ref={listRef}>
              {messages.map((m, i) => (
                <div key={i} className={`ai-msg ai-msg-${m.role}`}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="ai-msg ai-msg-assistant ai-typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <form className="ai-form" onSubmit={sendMessage}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                disabled={loading}
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
        className="ai-fab"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat con el asistente'}
        data-cursor
      >
        {open ? (
          '✕'
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
