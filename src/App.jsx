import { Routes, Route } from 'react-router-dom'
import Atmosphere from './components/Atmosphere'
import Cursor from './components/Cursor'
import Home from './pages/Home'
import Archive from './pages/Archive'
import useSmoothScroll from './lib/useSmoothScroll'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Atmosphere />
      <Cursor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/expedientes" element={<Archive />} />
      </Routes>
    </>
  )
}
