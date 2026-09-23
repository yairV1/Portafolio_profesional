/* Nyx, el gato asistente. Cada estado es una ilustración recortada del arte
   de referencia, en src/assets/nyx/<mood>.webp — para cambiar una pose basta
   con reemplazar ese archivo (fondo transparente, mismo nombre). */

const sprites = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/nyx/*.webp', { eager: true, query: '?url', import: 'default' })).map(
    ([path, url]) => [path.split('/').pop().replace('.webp', ''), url]
  )
)

export default function NyxCat({ mood = 'normal', className = '' }) {
  const src = sprites[mood] || sprites.normal
  return (
    // key: al cambiar de estado se monta una imagen nueva y entra con su animación
    <img key={mood} className={`nyx nyx-${mood} ${className}`.trim()} src={src} alt="" aria-hidden="true" draggable="false" />
  )
}
