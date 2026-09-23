import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Checkpoints from '../components/Checkpoints'
import ScrollStatement from '../components/ScrollStatement'
import { Z01, Z02, Z03, Z04, Z05, Z06 } from '../sections/Zones'
import { scrollToAnchor } from '../lib/useSmoothScroll'
import { Stage3D } from '../components/Lazy3D'

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()

  // llegada desde un enlace a una sección (ver main.jsx): baja hasta ella y
  // limpia el parámetro para que la URL quede como la home normal
  useEffect(() => {
    const z = searchParams.get('z')
    if (!z) return
    requestAnimationFrame(() => scrollToAnchor(z))
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  return (
    <>
      <Checkpoints />
      <main>
        <Stage3D>
          <Z01 />
          <Z02 />
        </Stage3D>
        <Z03 />
        <ScrollStatement
          text="A partir de ahora vas a ver todos los proyectos que construí."
          highlight={[7, 8, 9]}
        />
        <Z04 />
        <Z05 />
        <Z06 />
      </main>
    </>
  )
}
