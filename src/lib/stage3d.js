/* Canal entre los "anclas" del DOM (las cajas donde van el carné y el robot,
   que conservan teclado, clic y accesibilidad) y la escena 3D única que los
   dibuja. Sin dependencias de three.js, para no arrastrarlo al bundle inicial. */

export const ANCHOR_IDS = { lanyard: 'anchor-lanyard', guide: 'anchor-guide' }

const FLIP = 'stage3d:flip'
const WAVE = 'stage3d:wave'

export const flipCard = () => window.dispatchEvent(new Event(FLIP))
export const waveRobot = () => window.dispatchEvent(new Event(WAVE))

export function onStageEvent(name, handler) {
  const type = name === 'flip' ? FLIP : WAVE
  window.addEventListener(type, handler)
  return () => window.removeEventListener(type, handler)
}
