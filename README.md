# Credencial de acceso — Portafolio

Experiencia interactiva 3D. React + Three.js + física real.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist listo para subir
```

## Editar el contenido

**Todo el texto vive en un solo archivo: `src/data/content.js`.**
Los placeholders están marcados con corchetes: `[Apellido]`, `[tucorreo@ejemplo.com]`, etc.

| Qué cambiar | Dónde |
|---|---|
| Nombre, rol, descripción, stack del hero | `identity` |
| Textos y estadísticas de "Sobre mí" | `perfil` |
| Habilidades y niveles | `capacidades` |
| Experiencia laboral | `trayectoria` |
| Proyectos (home y archivo) | `expedientes` |
| Hobbies | `fueraDeHorario` |
| Email, teléfono, redes | `contacto` |

- **Tu foto:** reemplaza `public/foto.png` (vertical, mínimo 620×880 px).
- **Tu CV:** pon el PDF en `public/` y cambia `identity.cv` a `'/tu-cv.pdf'`.
- **Colores:** los tokens están al inicio de `src/styles/app.css`.

## Estructura

```
src/
  data/content.js      ← único archivo que necesitas editar
  three/Lanyard.jsx    ← carné con física (Rapier + meshline)
  three/Guide.jsx      ← guía 3D estilizado
  sections/Zones.jsx   ← las 7 zonas
  pages/Archive.jsx    ← página de expedientes con buscador
  components/          ← checkpoints, cursor, atmósfera, reveal
  styles/app.css       ← sistema de diseño completo
```

## Notas

- El formulario de contacto abre el cliente de correo del visitante. Para recibir mensajes
  en un servidor, conéctalo a Formspree o EmailJS.
- La página `/expedientes` necesita redirección SPA en el hosting. Ya están incluidos
  `vercel.json` y `_redirects` (Netlify) en `public/`.
- La física del carné se desactiva si el sistema pide `prefers-reduced-motion`.
