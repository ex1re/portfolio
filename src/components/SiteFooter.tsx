/**
 * The last line of a page, in the same quiet grey as the photo counts.
 *
 * The bottom padding is deliberate: the foot glow stands over the last 70px of
 * the screen once a page is scrolled to its end, and would otherwise blur this.
 */
export default function SiteFooter() {
  return (
    <footer className="px-6 pt-4 pb-24 text-center text-sm text-neutral-500">
      © 2026 Eric Xie | All Rights Reserved
    </footer>
  )
}
