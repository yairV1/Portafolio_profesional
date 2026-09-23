import { describe, expect, it } from 'vitest'
import { buildKnowledge } from './knowledge'
import { identity, expedientes, contacto, capacidades } from './content'

describe('conocimiento de Nyx para la IA', () => {
  const k = buildKnowledge()

  it('incluye cada proyecto con su stack', () => {
    for (const p of expedientes) {
      expect(k).toContain(p.nombre)
      p.stack.forEach((s) => expect(k).toContain(s))
    }
  })

  it('incluye stack, capacidades y contacto', () => {
    identity.stackHero.forEach((s) => expect(k).toContain(s))
    capacidades.forEach((c) => expect(k).toContain(c.titulo))
    expect(k).toContain(contacto.email)
  })

  it('no filtra placeholders ni valores vacíos', () => {
    expect(k).not.toMatch(/undefined|\[object Object\]|demo: #|código: #/)
  })
})
