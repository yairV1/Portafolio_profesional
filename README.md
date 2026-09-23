# Credencial de acceso — Portafolio

Experiencia interactiva 3D. React + Three.js + física real, con Nyx, un gato asistente.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173/#/
npm test         # pruebas del cerebro de Nyx
npm run build    # genera /dist listo para subir
```

## Editar el contenido

**Todo el texto vive en un solo archivo: `src/data/content.js`.** De ahí leen el sitio, el
cerebro local de Nyx y la IA (`api/chat.js`), así que lo que cambies ahí lo saben los tres.

| Qué cambiar | Dónde |
|---|---|
| Nombre, rol, descripción, stack del hero | `identity` |
| Textos y estadísticas de "Sobre mí" | `perfil` |
| Habilidades y niveles | `capacidades` |
| Proyectos (home y archivo) | `expedientes` |
| Hobbies | `fueraDeHorario` |
| Email, teléfono, redes | `contacto` |

- **Tu foto:** reemplaza `public/foto.png` (vertical, mínimo 620×880 px).
- **Tu CV:** pon el PDF en `public/` y cambia `identity.cv` a `'/tu-cv.pdf'`.
- **Capturas de proyectos:** `public/proyectos/<slug>.webp`; si no existe, la tarjeta usa el degradado de `tono`.
- **Imagen al compartir el enlace:** `public/og-banner.png` (1200×630).
- **Colores:** los tokens están al inicio de `src/styles/app.css`.

## Nyx, el asistente

- **Poses:** `src/assets/nyx/<estado>.webp` (fondo transparente). Para cambiar una, reemplaza el archivo con el mismo nombre.
- **Respuestas sin servidor:** `src/lib/assistantBrain.js` (reglas sobre `content.js`). Sus pruebas están en `src/lib/assistantBrain.test.js`.
- **IA real (opcional):** despliega `api/chat.js` en Vercel con `ANTHROPIC_API_KEY` y define `VITE_CHAT_API_URL` (ver `.env.example`). Si la IA falla o tarda, Nyx responde con el cerebro local.
- **Que Nyx reaccione a algo del sitio:** `nyxSay({ text, mood, key })` de `src/lib/nyxEvents.js`.

## Estructura

```
src/
  data/content.js        ← único archivo que necesitas editar
  data/knowledge.js      ← lo que sabe la IA, generado desde content.js
  three/Lanyard.jsx      ← carné con física (Rapier + meshline)
  three/Guide.jsx        ← robot guía 3D
  sections/Zones.jsx     ← las 6 zonas
  pages/Archive.jsx      ← página de expedientes con buscador
  components/AIAssistant.jsx, components/nyx/  ← Nyx
  components/            ← checkpoints, cursor, atmósfera, reveal
  styles/app.css         ← sistema de diseño completo
api/chat.js              ← función serverless para la IA de Nyx
```

## Despliegue

Cada push a `main` corre las pruebas, compila y publica en GitHub Pages (rama `gh-pages`)
con `.github/workflows/deploy.yml`. En los pull requests solo corre pruebas y build.
`npm run deploy` sigue funcionando para publicar a mano.

## Notas

- El formulario de contacto envía por Web3Forms (`contacto.web3formsKey`).
- Las rutas usan `HashRouter` (`#/expedientes`), así que no hace falta configurar redirecciones en el hosting.
- La física del carné se desactiva si el sistema pide `prefers-reduced-motion`.
