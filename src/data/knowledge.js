import { identity, perfil, capacidades, expedientes, fueraDeHorario, contacto } from './content.js'

/* Lo que Nyx sabe de Yair, en texto, generado desde content.js — la misma
   fuente que usa el sitio y el cerebro local. La función api/chat.js lo pone
   en el system prompt de la IA, así las dos versiones de Nyx nunca se
   contradicen: para enseñarle algo nuevo basta con editar content.js. */

const hasLink = (url) => Boolean(url) && url !== '#'

export function buildKnowledge() {
  const proyectos = expedientes
    .map((p) => {
      const enlaces = [hasLink(p.demo) && `demo: ${p.demo}`, hasLink(p.repo) && `código: ${p.repo}`].filter(Boolean)
      return [
        `- ${p.nombre} (${p.anio}, ${p.estado === 'live' ? 'en producción' : 'archivado'}, ${p.categoria}): ${p.resumen}`,
        `  Stack: ${p.stack.join(', ')}.`,
        p.problema && `  Problema: ${p.problema}`,
        `  Arquitectura: ${p.arquitectura.join('; ')}.`,
        `  Aprendizajes: ${p.aprendizajes.join('; ')}.`,
        enlaces.length ? `  Enlaces: ${enlaces.join(' · ')}.` : '  Sin demo ni código públicos.',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return `Sobre ${identity.nombre} ${identity.apellido}: ${identity.rol} ${identity.especialidad}, de ${contacto.ubicacion} (Colombia). ${identity.disponible}.
${perfil.parrafos.join(' ')}
Datos: ${perfil.stats.map((s) => `${s.n} ${s.l.toLowerCase()}`).join(', ')}.

Stack principal: ${identity.stackHero.join(', ')}.
Capacidades:
${capacidades.map((c) => `- ${c.titulo} (nivel ${c.nivel}/100): ${c.items.join(', ')}`).join('\n')}

Proyectos:
${proyectos}

Fuera del código: ${fueraDeHorario.map((h) => `${h.t} (${h.d})`).join('; ')}

Contacto: ${contacto.email} · ${contacto.telefono} (también WhatsApp). ${contacto.redes.map((r) => `${r.n}: ${r.u}`).join(' · ')}. Hay un formulario de contacto al final de la página.
CV: ${hasLink(identity.cv) ? identity.cv : 'todavía no está publicado en el sitio; se puede pedir por email'}.`
}
