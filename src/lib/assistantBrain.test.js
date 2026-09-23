import { describe, expect, it } from 'vitest'
import { getLocalReply } from './assistantBrain'
import { contacto, expedientes } from '../data/content'

// conversación: cada respuesta pasa su contexto a la siguiente, como en el widget
function conversar(...preguntas) {
  let ctx = {}
  return preguntas.map((q) => {
    const r = getLocalReply(q, ctx)
    ctx = r.ctx || ctx
    return r
  })
}

describe('cerebro local de Nyx', () => {
  it('no deja que el saludo se coma la pregunta', () => {
    const r = getLocalReply('hola, ¿qué proyectos tiene?')
    expect(r.text).toMatch(/^¡Hola! Estos son sus proyectos/)
    expect(r.actions).toContainEqual(expect.objectContaining({ type: 'route', to: '/expedientes' }))
  })

  it('agradece y responde lo que viene después', () => {
    const r = getLocalReply('gracias! y cuál es su correo?')
    expect(r.text).toMatch(/^¡De nada!/)
    expect(r.text).toContain(contacto.email)
  })

  it('un saludo solo es solo un saludo', () => {
    expect(getLocalReply('hola').mood).toBe('saludando')
    expect(getLocalReply('Holanda').mood).not.toBe('saludando')
  })

  it('reconoce tecnologías, incluso con un error de tipeo', () => {
    expect(getLocalReply('¿sabe React?').text).toMatch(/React es parte de su stack principal/)
    expect(getLocalReply('¿le gusta React?').text).toMatch(/React/)
    expect(getLocalReply('sabe laravell?').text).toMatch(/Laravel/)
    expect(getLocalReply('usa docker?').text).toMatch(/Docker está entre sus herramientas/)
  })

  it('filtra proyectos por tecnología', () => {
    const r = getLocalReply('proyectos con laravel')
    expect(r.text).toMatch(/^Proyectos con Laravel/)
    const conLaravel = expedientes.filter((p) => p.stack.includes('Laravel'))
    conLaravel.forEach((p) => expect(r.text).toContain(p.nombre))
    expedientes.filter((p) => !p.stack.includes('Laravel')).forEach((p) => expect(r.text).not.toContain(p.nombre))
  })

  it('no inventa tecnologías que no están en su stack', () => {
    expect(getLocalReply('sabe angular?').mood).toBe('pensando')
  })

  it('sigue el hilo de un proyecto', () => {
    const [, mas, demo, aprendio] = conversar('háblame de vetwilling', 'cuéntame más de ese', '¿tiene demo?', '¿qué aprendió?')
    expect(mas.text).toMatch(/^VetWilling/)
    expect(demo.text).toMatch(/VetWilling no tiene demo/)
    expect(aprendio.text).toMatch(/^Lo que le dejó VetWilling/)
  })

  it('una pregunta nueva no queda atrapada en el proyecto anterior', () => {
    const [, porQue] = conversar('háblame de vetwilling', '¿por qué usa Laravel?')
    expect(porQue.text).toMatch(/Laravel es parte de su stack/)
  })

  it('"este portafolio" es el proyecto del portafolio', () => {
    expect(getLocalReply('cuéntame de este portafolio').text).toMatch(/^Este portafolio/)
  })

  it('lleva a las secciones cuando se lo piden', () => {
    expect(getLocalReply('llévame al formulario').go).toEqual(expect.objectContaining({ type: 'anchor', id: 'z06' }))
    expect(getLocalReply('muéstrame todos los proyectos').go).toEqual(expect.objectContaining({ type: 'route', to: '/expedientes' }))
  })

  it('responde CV, precios, estudios y ayuda sin inventar', () => {
    expect(getLocalReply('me pasas su cv?').actions).toContainEqual(expect.objectContaining({ type: 'copy' }))
    expect(getLocalReply('cuánto cobra?').mood).toBe('celebrando')
    expect(getLocalReply('¿qué estudió?').text).toMatch(/no quiero inventarte/)
    expect(getLocalReply('qué puedes hacer?').text).toMatch(/^Puedo contarte/)
  })

  it('lo desconocido cae en la respuesta honesta con sugerencias', () => {
    const r = getLocalReply('cuál es su comida favorita')
    expect(r.text).toMatch(/eso no lo sé/)
    expect(r.suggestions?.length).toBeGreaterThan(0)
  })

  it('cada acción de ruta apunta a un expediente que existe', () => {
    const slugs = new Set(expedientes.map((p) => p.slug))
    for (const p of expedientes) {
      const r = getLocalReply(`cuéntame de ${p.nombre}`)
      const to = r.actions?.find((a) => a.type === 'route')?.to
      expect(to).toBe(`/expedientes?p=${p.slug}`)
      expect(slugs.has(to.split('=')[1])).toBe(true)
    }
  })
})
