import { useEffect, useState } from 'react'

/**
 * The counterpart to the header's glow at the foot of the page.
 *
 * The canvas behind the document is white, and rubber-band scrolling reveals a
 * strip of it. At the top that strip appears behind the fixed header, which is
 * translucent and blurred, so the white bleeds through as a soft bloom. Nothing
 * sat over the strip at the bottom, so it read as a hard white block instead.
 * This is the same treatment, pinned to the foot of the viewport.
 *
 * It only appears once the page is scrolled to its end, so it never blurs
 * content on the way down; the mask keeps what blur there is weighted to the
 * very edge rather than banding across the last inch of the page.
 */
export default function BottomGlow() {
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    // A page with nothing to scroll has no end to reach, and standing there
    // permanently would tint whatever the page happens to end on.
    const check = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight > window.innerHeight + 1
      setAtEnd(scrollable && doc.scrollHeight - window.scrollY - window.innerHeight < 2)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    // Navigating between pages changes the document's height without either of
    // those firing, so watch the body itself.
    const observer = new ResizeObserver(check)
    observer.observe(document.body)

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-60 h-[70px] bg-neutral-950/80 backdrop-blur-sm transition-opacity duration-300 [mask-image:linear-gradient(to_top,black_40%,transparent)] ${
        atEnd ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
