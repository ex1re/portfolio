import { Suspense, lazy } from 'react'
import PageTransition from '../components/PageTransition'

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
  { title: 'Visual Poetry Journal', year: '2025' },
  { title: 'Chania International Photo Festival', year: '2024' },
  { title: 'Architecture MasterPrize', year: '2023' },
  { title: 'Communication Arts', year: '2023' },
  { title: 'The Glasgow Gallery of Photography', year: '2023' },
]

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

export default function About() {
  return (
    <PageTransition>
      {/* The text column is capped at a comfortable measure; the drum's column
          takes whatever is left and centres it there, so the drum sits exactly
          halfway between the words and the edge of the screen at any width. The
          negative margin cancels the section's right padding, so "the edge" is
          the real one rather than the padded one. */}
      <section className="flex min-h-screen flex-col justify-center gap-16 px-6 pt-32 pb-20 md:flex-row md:items-center md:gap-0 md:pt-20">
        <div className="md:w-2/5 md:shrink-0 lg:w-1/3 lg:max-w-lg">
          {/* The mark read aloud. `lang` keeps a screen reader from spelling the
              brackets and stress marks out as punctuation. */}
          <h1 lang="la-fonipa" className="text-3xl font-semibold tracking-tight text-neutral-100">
            [ekˈziːre]
          </h1>
          {/* Even spacing down the block: the name, the bio and the contact row
              sit the same distance apart, so only the publications heading
              below reads as a break. */}
          <p className="mt-8 max-w-xl leading-relaxed text-neutral-400">
            <strong className="font-semibold">Eric Xie</strong> is a
            California-based photographer. He works with immediacy and chance,
            photographing whatever comes his way. His images highlight the impact of unguarded
            moments in ordinary settings.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a
              href="mailto:z4@berkeley.edu"
              className="border-b border-neutral-100 pb-1 text-sm text-neutral-100 transition-opacity hover:opacity-70"
            >
              z4@berkeley.edu
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
            {publications.map(({ title, year }) => (
              <li key={`${title}${year}`}>
                {title} <span className="whitespace-nowrap text-neutral-500">· {year}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:flex md:flex-1 md:justify-center md:-mr-6">
          {/* Reserves the drum's footprint while its chunk loads, so the column
              doesn't jump once it arrives. */}
          <Suspense fallback={<div aria-hidden className="mx-auto h-[320px] w-[240px] md:h-[500px] md:w-[400px]" />}>
            <PoemCylinder text={poem} />
          </Suspense>
        </div>
      </section>
    </PageTransition>
  )
}
