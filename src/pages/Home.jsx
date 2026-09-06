import Checkpoints from '../components/Checkpoints'
import ScrollStatement from '../components/ScrollStatement'
import { Z01, Z02, Z03, Z04, Z05, Z06 } from '../sections/Zones'

export default function Home() {
  return (
    <>
      <Checkpoints />
      <main>
        <Z01 />
        <Z02 />
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
