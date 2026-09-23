import { identity, perfil, capacidades, expedientes, contacto, fueraDeHorario } from '../data/content'

/* "Cerebro" local de Nyx: responde con reglas sobre el contenido real del
   portafolio, sin IA ni servidor — cero costo, funciona en GitHub Pages. El
   día que se despliegue api/chat.js con una API key real, basta con definir
   VITE_CHAT_API_URL y AIAssistant.jsx usa ese backend en su lugar.

   getLocalReply(texto, contexto) devuelve:
     text        — la respuesta
     mood        — la pose con la que Nyx la acompaña
     actions     — botones bajo la respuesta: { type: 'route' | 'anchor' | 'link' | 'copy', label, ... }
     suggestions — preguntas sugeridas para seguir la conversación
     go          — acción a ejecutar enseguida (cuando piden "llévame a…")
     ctx         — contexto actualizado (último proyecto del que se habló) */

const DIACRITICS = new RegExp('[̀-ͯ]', 'g')
const norm = (s) => s.normalize('NFD').replace(DIACRITICS, '').toLowerCase()

// frase contenida en el texto, respetando límites de palabra ("hola" no está en "holanda")
const hasWord = (text, ...terms) =>
  terms.some((t) => new RegExp(`(^|[^a-z0-9])${t.replace(/[.+?]/g, '\\$&')}([^a-z0-9]|$)`).test(text))
// raíz al inicio de alguna palabra ("contrat" está en "contratarlo")
const hasStem = (text, ...stems) => stems.some((s) => new RegExp(`(^|[^a-z0-9])${s}`).test(text))

const nombre = identity.nombre
const hasLink = (url) => Boolean(url) && url !== '#'
const whatsapp = `https://wa.me/${contacto.telefono.replace(/\D/g, '')}`

const DEFAULT_SUGGESTIONS = ['¿Qué proyectos tiene?', '¿Sabe React?', '¿Cómo lo contacto?', '¿Qué puedes hacer?']

function listaProyectos(lista = expedientes) {
  return lista.map((p) => `• ${p.nombre} (${p.anio}) — ${p.resumen}`).join('\n')
}

/* ---------- proyectos ---------- */

// palabras demasiado genéricas para identificar un proyecto puntual, aunque
// aparezcan en su nombre o slug
const STOPWORDS = new Set(['este', 'esta', 'para', 'portafolio', 'web'])

function proyectoNombrado(text) {
  if (hasWord(text, 'este portafolio', 'esta pagina', 'este sitio', 'esta web', 'tu portafolio', 'este proyecto 3d'))
    return expedientes.find((p) => p.slug === 'portafolio-3d')
  return expedientes.find((p) =>
    [...p.slug.split('-'), ...norm(p.nombre).split(' ')].some((w) => w.length > 4 && !STOPWORDS.has(w) && hasWord(text, w))
  )
}

const ASPECTS = {
  problema: ['problema', 'por que', 'para que', 'que resuelve', 'objetivo'],
  arquitectura: ['arquitectura', 'como lo hizo', 'como funciona', 'como esta hecho', 'tecnico', 'estructura'],
  aprendizajes: ['aprendio', 'aprendizaje', 'aprendizajes', 'lecciones', 'que saco'],
  enlaces: ['demo', 'link', 'enlace', 'url', 'en vivo', 'codigo', 'repo', 'repositorio', 'verlo'],
  stack: ['stack', 'tecnologias', 'tecnologia', 'con que lo hizo', 'con que'],
}
const FOLLOW_UP = ['ese', 'eso', 'esa', 'ese proyecto', 'este proyecto', 'cuentame mas', 'mas detalles', 'detalles', 'profundiza', 'y ese']

function aspectoDe(text) {
  return Object.keys(ASPECTS).find((k) => hasWord(text, ...ASPECTS[k]))
}

function respuestaProyecto(p, aspecto) {
  const actions = [{ type: 'route', to: `/expedientes?p=${p.slug}`, label: 'Abrir expediente' }]
  if (hasLink(p.demo)) actions.push({ type: 'link', href: p.demo, label: 'Ver demo' })
  if (hasLink(p.repo)) actions.push({ type: 'link', href: p.repo, label: 'Código' })
  const suggestions = ['¿Qué problema resolvía?', '¿Cómo está hecho?', '¿Qué aprendió?', '¿Tiene demo?'].filter(
    (s) => !aspecto || !hasWord(norm(s), ...ASPECTS[aspecto])
  )

  let text
  switch (aspecto) {
    case 'problema':
      text = p.problema ? `${p.nombre} nació de esto: ${p.problema}` : `${p.nombre}: ${p.resumen}`
      break
    case 'arquitectura':
      text = `Así está construido ${p.nombre}:\n${p.arquitectura.map((a) => `• ${a}`).join('\n')}`
      break
    case 'aprendizajes':
      text = `Lo que le dejó ${p.nombre}:\n${p.aprendizajes.map((a) => `• ${a}`).join('\n')}`
      break
    case 'enlaces':
      text =
        hasLink(p.demo) || hasLink(p.repo)
          ? `Aquí tienes los enlaces de ${p.nombre} 👇`
          : `${p.nombre} no tiene demo ni código públicos${p.estado === 'live' ? ' (está en producción para un cliente)' : ''}. En el expediente tienes todo el detalle.`
      break
    case 'stack':
      text = `${p.nombre} está hecho con ${p.stack.join(', ')}.`
      break
    default:
      text = `${p.nombre} (${p.anio}, ${p.estado === 'live' ? 'en producción' : 'archivado'}): ${p.resumen}\nStack: ${p.stack.join(', ')}.`
  }
  return { text, mood: aspecto ? 'contento' : 'curioso', actions, suggestions, ctx: { lastProject: p.slug } }
}

/* ---------- tecnologías ---------- */

// el stack del hero, el de cada proyecto y los ítems de una sola palabra de
// las capacidades ("Git", "Docker"; no "APIs REST")
const TECHS = [
  ...new Set([
    ...identity.stackHero,
    ...expedientes.flatMap((p) => p.stack),
    ...capacidades.flatMap((c) => c.items).filter((i) => !i.includes(' ')),
  ]),
].map((n) => {
  const key = norm(n)
  return { nombre: n, key, aliases: [...new Set([key, key.replace(/\.js$/, ''), key.replace('.', '')])] }
})

function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

function tecnologiaEn(text) {
  const exacta = TECHS.find((t) => t.aliases.some((a) => hasWord(text, a)))
  if (exacta) return exacta
  // tolera un error de tipeo en nombres largos ("laravell", "tipescript")
  const palabras = text.split(/[^a-z0-9.]+/).filter((w) => w.length >= 5)
  return TECHS.find((t) => t.aliases.some((a) => a.length >= 5 && palabras.some((w) => distancia(w, a) <= 1)))
}

function respuestaTecnologia(tech, pregunta) {
  const area = capacidades.find((c) => c.items.some((i) => norm(i) === tech.key))
  const proyectos = expedientes.filter((p) => p.stack.some((s) => norm(s) === tech.key))
  const actions = proyectos.slice(0, 2).map((p) => ({ type: 'route', to: `/expedientes?p=${p.slug}`, label: p.nombre }))
  const ctx = proyectos.length === 1 ? { lastProject: proyectos[0].slug } : {}

  if (hasStem(pregunta, 'proyecto', 'hizo', 'trabajo') && proyectos.length) {
    return { text: `Proyectos con ${tech.nombre}:\n${listaProyectos(proyectos)}`, mood: 'contento', actions, ctx }
  }
  const principal = identity.stackHero.some((s) => norm(s) === tech.key)
  let text = principal
    ? `¡Sí! ${tech.nombre} es parte de su stack principal.`
    : `Sí, ${tech.nombre} está entre sus herramientas${area ? ` de ${area.titulo.toLowerCase()}` : ''}.`
  if (proyectos.length) text += `\nLo usó en:\n${listaProyectos(proyectos)}`
  return { text, mood: 'contento', actions, ctx }
}

/* ---------- navegación ("llévame a…") ---------- */

const DESTINOS = [
  { keys: ['contacto', 'formulario', 'escribirle'], action: { type: 'anchor', id: 'z06', label: 'Ir a contacto' }, text: 'Vamos al formulario de contacto 🐾' },
  { keys: ['todos los proyectos', 'archivo', 'expedientes', 'proyectos'], action: { type: 'route', to: '/expedientes', label: 'Ver expedientes' }, text: 'Te llevo a todos sus proyectos.' },
  { keys: ['capacidades', 'habilidades', 'skills'], action: { type: 'anchor', id: 'z03', label: 'Ver capacidades' }, text: 'Vamos a sus capacidades.' },
  { keys: ['perfil', 'sobre el', 'sobre mi'], action: { type: 'anchor', id: 'z02', label: 'Ver perfil' }, text: 'Vamos a su perfil.' },
  { keys: ['hobbies', 'fuera de horario'], action: { type: 'anchor', id: 'z05', label: 'Fuera de horario' }, text: 'Vamos a lo que hace fuera del código.' },
  { keys: ['inicio', 'arriba', 'recepcion', 'carne', 'credencial'], action: { type: 'anchor', id: 'z01', label: 'Ir al inicio' }, text: 'De vuelta a recepción.' },
]

function navegacion(text) {
  if (!hasStem(text, 'llevame', 'lleva', 'ir a', 'vamos', 'muestrame', 'abre', 'abrir', 'navega', 'ir al')) return null
  const destino = DESTINOS.find((d) => hasWord(text, ...d.keys))
  if (!destino) return null
  return { text: destino.text, mood: 'contento', actions: [destino.action], go: destino.action }
}

/* ---------- intenciones ---------- */

const contactActions = [
  { type: 'anchor', id: 'z06', label: 'Ir al formulario' },
  { type: 'copy', value: contacto.email, label: 'Copiar email' },
  { type: 'link', href: whatsapp, label: 'WhatsApp' },
]

const RULES = [
  {
    test: (t) => hasWord(t, 'que puedes hacer', 'que sabes', 'ayuda', 'ayudame', 'como funcionas', 'que te puedo preguntar'),
    reply: () => ({
      text: `Puedo contarte:\n• sus proyectos y cómo están hechos\n• si maneja una tecnología y dónde la usó\n• cómo contactarlo o pedirle una cotización\n• y llevarte a cualquier sección ("llévame a contacto")`,
      mood: 'contento',
      suggestions: DEFAULT_SUGGESTIONS.filter((s) => s !== '¿Qué puedes hacer?'),
    }),
  },
  {
    test: (t) => hasWord(t, 'nyx', 'como te llamas', 'quien eres', 'que eres', 'eres un gato', 'eres real', 'eres una ia'),
    reply: () => ({
      text: `¡Soy Nyx! El gato que cuida este portafolio. No soy una IA de verdad: me sé de memoria los proyectos de ${nombre}, su stack y cómo contactarlo 🐾`,
      mood: 'travieso',
    }),
  },
  {
    test: (t) => hasStem(t, 'cobra', 'precio', 'tarifa', 'costo', 'cuesta', 'presupuest', 'cotiz', 'freelance', 'disponib', 'contrat') || hasWord(t, 'trabajar con el', 'trabajar juntos'),
    reply: () => ({
      text: `Está ${identity.disponible.toLowerCase()}. El precio depende del alcance: cuéntale tu idea por el formulario (o por email) y te responde con una propuesta, normalmente el mismo día.`,
      mood: 'celebrando',
      actions: contactActions,
    }),
  },
  {
    test: (t) => hasWord(t, 'cv', 'curriculum', 'hoja de vida', 'resume'),
    reply: () =>
      hasLink(identity.cv)
        ? { text: 'Aquí tienes su CV 👇', mood: 'contento', actions: [{ type: 'link', href: identity.cv, label: 'Descargar CV' }] }
        : {
            text: `Todavía no subió su CV al sitio, pero te lo manda si se lo pides a ${contacto.email}.`,
            mood: 'pensando',
            actions: [{ type: 'copy', value: contacto.email, label: 'Copiar email' }],
          },
  },
  {
    test: (t) => hasStem(t, 'contact', 'correo', 'email', 'mail', 'telefono', 'whatsapp', 'llamar', 'escribirle', 'numero'),
    reply: () => ({
      text: `Puedes escribirle a ${contacto.email} o por WhatsApp al ${contacto.telefono}. También está el formulario de contacto de esta página.`,
      mood: 'celebrando',
      actions: contactActions,
    }),
  },
  {
    test: (t) => hasWord(t, 'donde vive', 'donde esta', 'ubicacion', 'de donde es', 'ciudad', 'pais', 'remoto'),
    reply: () => ({ text: `${nombre} está en ${contacto.ubicacion}, Colombia, y trabaja en remoto.`, mood: 'normal' }),
  },
  {
    test: (t) => hasWord(t, 'github', 'linkedin', 'red social', 'redes', 'redes sociales'),
    reply: () => ({
      text: `Lo encuentras aquí 👇`,
      mood: 'normal',
      actions: contacto.redes.map((r) => ({ type: 'link', href: r.u, label: r.n })),
    }),
  },
  {
    test: (t) => hasStem(t, 'estudi', 'universidad', 'carrera', 'titulo', 'formacion', 'certific'),
    reply: () => ({
      text: `Eso no está en el portafolio, así que no quiero inventarte nada. Pregúntaselo directo a ${contacto.email}.`,
      mood: 'pensando',
      actions: [{ type: 'copy', value: contacto.email, label: 'Copiar email' }],
    }),
  },
  {
    test: (t) => Boolean(tecnologiaEn(t)),
    reply: (t) => respuestaTecnologia(tecnologiaEn(t), t),
  },
  {
    test: (t) => hasStem(t, 'sabe', 'maneja', 'conoce', 'domina', 'programa en', 'trabaja con', 'usa '),
    reply: () => ({
      text: `Eso no lo tengo registrado en su stack. Trabaja sobre todo con ${identity.stackHero.join(', ')} — si te interesa otra tecnología, pregúntale directo.`,
      mood: 'pensando',
      suggestions: ['¿Qué tecnologías usa?', '¿Cómo lo contacto?'],
    }),
  },
  {
    test: (t) => hasStem(t, 'stack', 'tecnolog', 'lenguaje', 'herramienta', 'framework'),
    reply: () => ({
      text: `Trabaja principalmente con ${identity.stackHero.join(', ')}. También cubre ${capacidades.map((c) => c.titulo.toLowerCase()).join(', ')}. Pregúntame por una tecnología concreta y te digo dónde la usó.`,
      mood: 'contento',
      suggestions: ['¿Sabe Laravel?', '¿Usa Docker?', '¿Proyectos con React?'],
    }),
  },
  {
    test: (t) => hasStem(t, 'hobbie', 'hobby', 'pasatiempo', 'tiempo libre', 'fuera de horario') || hasWord(t, 'que hace cuando no programa', 'le gusta hacer'),
    reply: () => ({
      text: `Fuera del código: ${fueraDeHorario.map((h) => h.t.toLowerCase()).join(', ')}. Y acariciar gatos, supongo 😼`,
      mood: 'travieso',
    }),
  },
  {
    test: (t) => hasStem(t, 'proyecto', 'trabajos', 'portafolio', 'expediente', 'aplicacion') || hasWord(t, 'que ha hecho', 'que hizo'),
    reply: () => ({
      text: `Estos son sus proyectos:\n${listaProyectos()}`,
      mood: 'contento',
      actions: [{ type: 'route', to: '/expedientes', label: 'Ver todos' }],
      suggestions: expedientes.slice(0, 3).map((p) => `Cuéntame de ${p.nombre}`),
    }),
  },
  {
    test: (t) => hasStem(t, 'experiencia', 'perfil', 'anos') || hasWord(t, 'sobre el', 'sobre yair', 'quien es', 'a que se dedica'),
    reply: () => ({
      text: `${nombre} es ${identity.rol.toLowerCase()} ${identity.especialidad}. Lleva ${perfil.stats[0].n} ${perfil.stats[0].l.toLowerCase()} y ${perfil.stats[1].n} ${perfil.stats[1].l.toLowerCase()}. Le gusta entender el problema a fondo antes de escribir la primera línea.`,
      mood: 'contento',
      suggestions: ['¿Qué proyectos tiene?', '¿Qué tecnologías usa?'],
    }),
  },
]

/* ---------- saludos y cortesías ---------- */

const GREETING = /^(hola+|holi|buenas( tardes| noches| dias)?|buenos dias|hey|hi|hello|que tal|saludos)\b[\s,!.¡]*/
const THANKS = /^(muchas gracias|gracias|genial|perfecto|excelente|super|vale|ok|listo)\b[\s,!.¡]*/
const BYE = /^(adios|chao|chau|bye|hasta luego|nos vemos)\b/

const FALLBACK = {
  text: 'Mmm, eso no lo sé 🐾 Puedo contarte sobre sus proyectos, las tecnologías que usa o cómo contactarlo.',
  mood: 'curioso',
  suggestions: DEFAULT_SUGGESTIONS,
}

export { DEFAULT_SUGGESTIONS }

export function getLocalReply(userText, ctx = {}) {
  let t = norm(userText).replace(/[¿?¡!]/g, ' ').replace(/\s+/g, ' ').trim()

  // "hola, ¿qué proyectos tiene?" → el saludo no se come la pregunta
  let prefix = ''
  if (GREETING.test(t)) {
    t = t.replace(GREETING, '').trim()
    prefix = '¡Hola! '
  } else if (THANKS.test(t)) {
    t = t.replace(THANKS, '').replace(/^(y|e)\s+/, '').trim()
    prefix = '¡De nada! '
  }

  if (!t) {
    return prefix === '¡Hola! '
      ? { text: `¡Hola! Soy Nyx, el asistente de ${nombre}. ¿Qué quieres saber?`, mood: 'saludando', suggestions: DEFAULT_SUGGESTIONS, ctx }
      : { text: '¡De nada! Si tienes otra pregunta, aquí sigo, ronroneando.', mood: 'contento', ctx }
  }
  if (BYE.test(t)) return { text: `¡Hasta luego! Si quieres retomar, escríbele a ${contacto.email}.`, mood: 'saludando', ctx }

  const reply = responder(t, ctx)
  return { ...reply, text: prefix + reply.text, ctx: { ...ctx, ...reply.ctx } }
}

function responder(t, ctx) {
  const nav = navegacion(t)
  if (nav) return nav

  // un proyecto nombrado, o una pregunta de seguimiento sobre el último
  const aspecto = aspectoDe(t)
  const nombrado = proyectoNombrado(t)
  if (nombrado) return respuestaProyecto(nombrado, aspecto)
  const rule = RULES.find((r) => r.test(t))
  // seguimiento sobre el último proyecto: "cuéntame más de ese", o "¿tiene
  // demo?" cuando la pregunta no encaja en ningún otro tema
  const anterior = ctx.lastProject && expedientes.find((p) => p.slug === ctx.lastProject)
  if (anterior && (hasWord(t, ...FOLLOW_UP) || (aspecto && !rule))) return respuestaProyecto(anterior, aspecto)

  return rule ? rule.reply(t) : FALLBACK
}
