/* Canal para que cualquier parte del sitio le cuente algo a Nyx (el carné se
   giró, el robot saludó, el formulario se envió) sin acoplarse al widget.
   `key` hace que el comentario salga una sola vez por sesión; sin key, cada vez. */

const EVENT = 'nyx:event'

export function nyxSay({ text, mood = 'contento', key }) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, mood, key } }))
}

export function onNyxEvent(handler) {
  const listener = (e) => handler(e.detail)
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
