import { useEffect, useState } from 'react'

const QUERY = '(pointer: fine)'

/**
 * True when the primary pointer is precise (mouse/trackpad) rather than touch.
 *
 * Used to enable pointer-drag interactions only where they don't compete with
 * touch scrolling: a draggable element gets `touch-action: none`, so on a phone
 * a swipe starting on it would drag the element instead of scrolling the page.
 */
export default function useFinePointer() {
  const [isFine, setIsFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsFine(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isFine
}
