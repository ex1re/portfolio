import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import FlagMark from '../components/FlagMark'

// three.js is heavy relative to the rest of the site, so it's split into its own
// chunk that only downloads when someone opens this page. The garden, which
// carries the photographs, never pays for it.
const PoemCylinder = lazy(() => import('../components/PoemCylinder'))

// Wraps continuously around the drum, so the line breaks are marked rather than
// implied.
const poem = [
  'At twilight, the lonely rock juts',
  'Like a defiant fist from the swishing sea.',
  'Beneath the monolith I stand,',
  'Drinking my doubts in daybreak’s haze.',
  'My rugged feet embrace jagged precipices,',
  'Below which milky torrents clash with salt-tinged air.',
  'I reverberate in this bittersweet limbo',
  'Between a monk’s supposed peace and tempestuous uncertainty,',
  'Wondering if I really want to be this alone.',
  'Atop the rock, my moss-clad monastery lies,',
  'Pulsating with Gregorian morning chants like the songs of ancient murrelets.',
  'A solitary cloud rests above its clay tiles — softening in the glow of dawn.',
  'I am wedded to abstinence — to this solitary confinement of a life,',
  'And I wonder if I really want to be this alone with my thoughts.',
  'My heart slowly falls down a spiraling whirlpool',
  'As I converse with me, myself, and I.',
  'Yet, even as I wrestle with my aloneness,',
  'The ambrosial honey of a heavenly hymn',
  'Tumbles down the granite cliff',
  'To spill into my ears.',
  'My brothers’ voices tug my soul into being',
  'And clothe me in courage,',
  'Reminding me family comes in different guises',
  'And I am not alone.',
].join(' · ')

/** Newest first. The year is dimmed against the title, so the column of dates
    reads as a second layer rather than competing with the names. */
const publications = [
  {
    title: 'Visual Poetry Journal',
    year: '2025',
    country: 'dk' as const,
    href: 'https://visualpoetryjournal.com/issue-8-october-2025/',
  },
  {
    title: 'Chania International Photo Festival',
    year: '2024',
    country: 'gr' as const,
    href: 'https://www.cipfestival.com/participating-artists-2024/',
  },
  {
    title: 'Architecture MasterPrize',
    year: '2023',
    country: 'us' as const,
    href: 'https://architectureprize.com/winners/2023_photo_s.php',
  },
  {
    title: 'Communication Arts',
    year: '2023',
    country: 'us' as const,
    href: 'https://www.commarts.com/gallery?d=photography&y=2023',
  },
  {
    title: 'The Glasgow Gallery of Photography',
    year: '2023',
    country: 'sct' as const,
    href: 'https://www.glasgowgalleryofphotography.com/exhibition2023/environment',
  },
]

/** The home photograph's entrance, so the two pages open at the same pace. */
const ENTRANCE_DELAY = 1.9
const ENTRANCE_DURATION = 1.6
/** Shown regardless after this long, rather than leaving the column empty. */
const ENTRANCE_LATEST = 4000

/** Sized to sit with the email beside it, and inheriting its colour. */
function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * LinkedIn's own mark, at the size of the Instagram one beside it.
 *
 * The letterforms are the brand's, not an approximation: an "in" set in
 * geometric sans has square terminals and a flat shoulder, and drawing it with
 * round-capped strokes turns it into handwriting. The badge is filled, which is
 * how LinkedIn draws it — it carries a little more weight than the outlined
 * camera next to it, and that's the trade for the letters being right.
 */
function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      {/* Sized against its neighbour rather than to the box, which they don't
          use alike: LinkedIn's mark fills its whole viewBox, while the camera's
          square is inset to 2 and drawn with a 2-wide stroke — so what you see
          of it runs 1 to 23, twenty-two units across. This is scaled to exactly
          that and centred, so the two squares are the same square. */}
      <g transform="translate(1 1) scale(0.91667)">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </g>
    </svg>
  )
}

export default function About() {
  const openedAt = useRef(performance.now())
  const settled = useRef(false)
  const [shown, setShown] = useState(false)
  const [delay, setDelay] = useState(ENTRANCE_DELAY)

  // The drum is the slowest thing on the site to arrive — its own chunk, then a
  // model, then a texture painted to match it — and it used to simply appear.
  // It now waits for the same beat the home photograph takes, measured from the
  // page opening: if it was ready sooner it holds until then, and if it took
  // longer than that it comes in as soon as there is something to show.
  const reveal = useCallback(() => {
    if (settled.current) return
    settled.current = true
    const elapsed = (performance.now() - openedAt.current) / 1000
    setDelay(Math.max(0, ENTRANCE_DELAY - elapsed))
    setShown(true)
  }, [])

  useEffect(() => {
    const id = setTimeout(reveal, ENTRANCE_LATEST)
    return () => clearTimeout(id)
  }, [reveal])

  return (
    <PageTransition>
      {/* The text column is capped at a comfortable measure; the drum's column
          takes whatever is left and centres it there, so the drum sits exactly
          halfway between the words and the edge of the screen at any width. The
          negative margin cancels the section's right padding, so "the edge" is
          the real one rather than the padded one. */}
      <section className="flex min-h-screen flex-col justify-center gap-16 px-6 pt-32 pb-20 md:flex-row md:items-center md:gap-0 md:pt-20">
        <div className="md:w-2/5 md:shrink-0 lg:w-1/3 lg:max-w-lg">
          {/* The mark read aloud, then what it means. `lang` keeps a screen
              reader from spelling the brackets and stress marks out as
              punctuation, and only covers the pronunciation — the gloss beside
              it is English and carries its own. */}
          <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-semibold tracking-tight text-neutral-100">
            <span lang="la-fonipa">[ɛkˈsiːrɛ]</span>
            {/* Set at the same size, and told apart by weight and colour alone.
                The two greys are the ones the publications list uses: the bio's
                for the language, a step down for what follows the dot. */}
            <span lang="en" className="font-normal text-neutral-400">
              Latin <span className="text-neutral-500">· to go out</span>
            </span>
          </h1>
          {/* Even spacing down the block: the name, the bio and the contact row
              sit the same distance apart, so only the publications heading
              below reads as a break. */}
          <p className="mt-8 max-w-xl leading-relaxed text-neutral-400">
            <strong className="font-semibold">Eric Xie</strong> is a
            California-based photographer born in Haikou, the "Coconut City." 
            He works with immediacy and chance, photographing whatever comes his way. 
            His images, like visual prose, try to highlight the unguarded moments of daily life.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a
              href="mailto:exire.art@gmail.com"
              className="border-b border-neutral-100 pb-1 text-sm text-neutral-100 transition-opacity hover:opacity-70"
            >
              exire.art@gmail.com
            </a>
            <a
              href="https://instagram.com/e.xire"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram: e.xire"
              // Padding grows the tap target to a thumb-friendly size; the
              // matching negative margin keeps the icon where it sits visually.
              className="-m-3 p-3 text-neutral-100 transition-opacity hover:opacity-70"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.linkedin.com/in/zhilin-xie/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn: Zhilin Xie"
              className="-m-3 p-3 text-neutral-100 transition-opacity hover:opacity-70"
            >
              <LinkedInIcon />
            </a>
          </div>

          {/* Same measure and rhythm as the bio above it, a step down in scale
              so it reads as a second block rather than a second page title. */}
          <h2 className="mt-20 text-xl font-semibold tracking-tight text-neutral-100">
            Publications &amp; Exhibitions
          </h2>
          {/* Set in the same grey as the bio, so the heading above stays the
              only bright line and the entries read as its contents. The gap
              between entries is wider than the leading inside one, so a title
              that wraps on a narrow screen still reads as a single item. */}
          <ul className="mt-4 space-y-1.5 leading-snug text-neutral-400">
            {publications.map(({ title, year, href, country }) => (
              <li key={`${title}${year}`}>
                {/* Each entry lifts a step on hover, year included, so the whole
                    line answers rather than just the words under the cursor. */}
                {/* `active` is the hover of a touchscreen: it holds while the
                    finger is down, so an entry answers a press the way it
                    answers a cursor. */}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group transition-colors hover:text-neutral-100 active:text-neutral-100"
                >
                  {title}{' '}
                  {/* Year and flag stay together: they're the tail of the line,
                      and a title that wraps should take them with it rather
                      than leave the flag stranded on its own. */}
                  <span className="whitespace-nowrap text-neutral-500 transition-colors group-hover:text-neutral-300 group-active:text-neutral-300">
                    {/* The extra hair of margin is the dot's own side bearing:
                        a word space either side measures the same, but the
                        flag's circle touches the edge of its box where the dot
                        sits back from its own, so it read as the tighter gap. */}
                    · {year} <FlagMark country={country} className="ml-[0.07em]" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: ENTRANCE_DURATION, delay, ease: 'easeOut' }}
          className="md:-mr-6 md:flex md:flex-1 md:justify-center"
        >
          {/* Reserves the drum's footprint while its chunk loads, so the column
              doesn't jump once it arrives. */}
          <Suspense fallback={<div aria-hidden className="mx-auto h-[320px] w-[240px] md:h-[500px] md:w-[400px]" />}>
            <PoemCylinder text={poem} onReady={reveal} />
          </Suspense>
        </motion.div>
      </section>
    </PageTransition>
  )
}
