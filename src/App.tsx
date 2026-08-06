import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import BottomGlow from './components/BottomGlow'
import Home from './pages/Home'
import Work from './pages/Work'
import Project from './pages/Project'
import CollectionDetail from './pages/CollectionDetail'
import About from './pages/About'
import Cellar from './pages/Cellar'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/garden" element={<Work />} />
        <Route path="/garden/collections/:slug" element={<CollectionDetail />} />
        <Route path="/garden/:slug" element={<Project />} />
        <Route path="/office" element={<About />} />
        <Route path="/cellar" element={<Cellar />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  // Safari on iOS only applies `:active` once the document is listening for
  // touch — without this, a held link never lights up there. The listener does
  // nothing and is passive, so it costs nothing to scrolling.
  useEffect(() => {
    const noop = () => {}
    document.addEventListener('touchstart', noop, { passive: true })
    return () => document.removeEventListener('touchstart', noop)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <Nav />
        <AnimatedRoutes />
        <BottomGlow />
      </div>
    </BrowserRouter>
  )
}

export default App
