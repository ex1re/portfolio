import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import Home from './pages/Home'
import Work from './pages/Work'
import Project from './pages/Project'
import About from './pages/About'
import Cellar from './pages/Cellar'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/garden" element={<Work />} />
        <Route path="/garden/:slug" element={<Project />} />
        <Route path="/office" element={<About />} />
        <Route path="/cellar" element={<Cellar />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <Nav />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  )
}

export default App
