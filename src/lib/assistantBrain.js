import { identity, perfil, capacidades, expedientes, contacto, fueraDeHorario } from '../data/content'

/* "Cerebro" local del widget de chat: responde con reglas sobre el contenido
   real del portafolio, sin IA ni servidor — cero costo, funciona en GitHub
   Pages. El día que se despliegue api/chat.js con una API key real, basta con
   definir VITE_CHAT_API_URL y AIAssistant.jsx usa ese backend en su lugar sin
   tocar este archivo. */

const DIACRITICS = new RegExp('[̀-ͯ]', 'g')

const norm = (s) => s.normalize('NFD').replace(DIACRITICS, '').toLowerCase()

const has = (text, ...keywords) => keywords.some((k) => text.includes(k))

function listaProyectos() {
  return expedientes
    .map((p) => `• ${p.nombre} (${p.anio}) — ${p.resumen}`)
    .join('\n')
}

// palabras demasiado genéricas para identificar un proyecto puntual, aunque
// aparezcan en su nombre o slug (evita falsos positivos con "este", "web", etc.)
const STOPWORDS = new Set(['este', 'esta', 'para', 'portafolio', 'web'])

function proyectoPorNombre(text) {
  return expedientes.find((p) => {
    const slugWords = p.slug.split('-')
    const nombreWords = norm(p.nombre).split(' ')
    return [...slugWords, ...nombreWords].some(
      (w) => w.length > 4 && !STOPWORDS.has(w) && text.includes(w)
    )
  })
}

const RULES = [
  {
    test: (t) => has(t, 'hola', 'buenas', 'hey', 'hi ', 'que tal', 'saludos'),
    reply: () => `¡Hola! Soy el asistente de ${identity.nombre}. Puedo contarte sobre sus proyectos, su stack o cómo contactarlo. ¿Qué quieres saber?`,
  },
  {
    test: (t) => has(t, 'gracias', 'genial', 'perfecto', 'excelente'),
    reply: () => '¡De nada! Si tienes otra pregunta, aquí estoy.',
  },
  {
    test: (t) => has(t, 'adios', 'chao', 'bye', 'hasta luego', 'nos vemos'),
    reply: () => `¡Hasta luego! Si quieres retomar el contacto directo, escribe a ${contacto.email}.`,
  },
  {
    test: (t) => has(t, 'contrat', 'contacto', 'contactar', 'correo', 'email', 'telefono', 'whatsapp', 'llamar', 'presupuesto', 'cotiz'),
    reply: () =>
      `Puedes escribirle a ${contacto.email} o llamar/whatsapp al ${contacto.telefono}. También hay un formulario en la sección de contacto de esta página. Está ${identity.disponible.toLowerCase()}.`,
  },
  {
    test: (t) => has(t, 'donde vive', 'donde esta', 'ubicacion', 'de donde es', 'ciudad', 'pais'),
    reply: () => `${identity.nombre} está en ${contacto.ubicacion}.`,
  },
  {
    test: (t) => has(t, 'github', 'linkedin', 'red social', 'redes'),
    reply: () => contacto.redes.map((r) => `${r.n}: ${r.u}`).join(' · '),
  },
  {
    test: (t) => has(t, 'quien es', 'quien eres', 'sobre ti', 'sobre yair', 'experiencia', 'cuantos anos', 'perfil'),
    reply: () => `${perfil.parrafos[0]} Lleva ${perfil.stats[0].n} ${perfil.stats[0].l.toLowerCase()} y ${perfil.stats[1].n} ${perfil.stats[1].l.toLowerCase()}.`,
  },
  {
    test: (t) => has(t, 'hobbie', 'hobby', 'tiempo libre', 'fuera de horario', 'que haces', 'le gusta'),
    reply: () => `Fuera del código: ${fueraDeHorario.map((h) => h.t).join(', ')}.`,
  },
  {
    test: (t) => has(t, 'stack', 'tecnologia', 'tecnologias', 'lenguaje', 'herramientas', 'framework', 'con que trabaja'),
    reply: () =>
      `Trabaja principalmente con ${identity.stackHero.join(', ')}. También: ${capacidades.map((c) => c.titulo).join(', ')} — cada una con varias herramientas específicas si quieres el detalle.`,
  },
  {
    // nombre de un proyecto puntual (ej. "cuéntame de vetwilling"), sin necesidad
    // de que aparezca la palabra "proyecto"
    test: (t) => Boolean(proyectoPorNombre(t)),
    reply: (t) => {
      const match = proyectoPorNombre(t)
      return `${match.nombre} (${match.anio}): ${match.resumen} Stack: ${match.stack.join(', ')}.`
    },
  },
  {
    test: (t) => has(t, 'proyecto', 'proyectos', 'trabajos', 'portafolio', 'expediente', 'aplicacion', 'que has hecho', 'que hizo'),
    reply: () => `Estos son algunos de sus proyectos:\n${listaProyectos()}\n\nPregúntame por alguno en específico o mira la sección de Expedientes más abajo.`,
  },
]

const FALLBACK =
  'No estoy seguro de eso — puedo contarte sobre sus proyectos, su stack de tecnologías o cómo contactarlo. También puedes escribirle directo a ' +
  contacto.email +
  '.'

export function getLocalReply(userText) {
  const t = norm(userText)
  const rule = RULES.find((r) => r.test(t))
  return rule ? rule.reply(t) : FALLBACK
}
