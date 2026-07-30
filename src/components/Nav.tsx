import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/', label: 'foyer' },
  { to: '/garden', label: 'garden' },
  { to: '/office', label: 'office' },
  { to: '/cellar', label: 'cellar' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 z-70 w-full bg-neutral-950/80 backdrop-blur-sm">
      {/* Full width with the same px-6 as every page section, so the logo lines up
          with page headings and the nav ends the same distance from the opposite
          edge. A max-width here would inset both toward the middle. */}
      <div className="flex items-center justify-between px-6 py-5">
        <NavLink to="/" className="font-logo text-3xl leading-none text-neutral-100">
          exire
        </NavLink>

        <nav className="hidden gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `font-nav text-sm transition-colors ${
                  isActive ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`h-px w-6 bg-neutral-100 transition-transform ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
          <span className={`h-px w-6 bg-neutral-100 transition-transform ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 pb-6">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `font-nav text-lg ${isActive ? 'text-neutral-100' : 'text-neutral-500'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
