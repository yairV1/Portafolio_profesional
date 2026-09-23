import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/app.css'

// un enlace como ".../#z04" trae un hash que HashRouter tomaría como la ruta
// "z04" (inexistente, página en blanco): se reescribe a la home con la sección
// como parámetro, y Home hace el scroll. Se registra antes de montar el router
// para que, en un cambio de hash sin recarga, corra antes que su listener.
function rewriteAnchorHash() {
  const anchor = window.location.hash.match(/^#([\w-]+)$/)?.[1]
  if (anchor) window.history.replaceState(null, '', `#/?z=${anchor}`)
}
rewriteAnchorHash()
window.addEventListener('hashchange', rewriteAnchorHash)
window.addEventListener('popstate', rewriteAnchorHash)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
