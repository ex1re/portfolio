import PageTransition from '../components/PageTransition'
import TextCylinder from '../components/TextCylinder'

// Wraps continuously around the cylinder, so the line breaks are marked rather
// than implied. It runs until the rings are full and stops there.
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

export default function About() {
  return (
    <PageTransition>
      {/* The columns split 1/3 : 2/3, and the cylinder centres in the wider one,
          which lands it on the two-thirds line — right of centre without being
          pushed against the edge. md keeps the text column a little wider so it
          doesn't get cramped before there's room for the full split. */}
      <section className="flex min-h-screen flex-col justify-center gap-16 px-6 pt-32 pb-20 md:flex-row md:items-center md:gap-0 md:pt-20">
        <div className="md:w-2/5 lg:w-1/3 lg:max-w-lg">
          <h1 className="text-3xl font-semibold text-neutral-100">About</h1>
          <p className="mt-6 max-w-xl text-neutral-400">
            Write a short bio here — who you are, what you shoot, and how people can reach you.
            Replace this placeholder with your own story.
          </p>
          <a
            href="mailto:you@example.com"
            className="mt-8 inline-block w-fit border-b border-neutral-100 pb-1 text-sm text-neutral-100"
          >
            you@example.com
          </a>
        </div>

        <div className="md:flex md:w-3/5 md:justify-center lg:w-2/3">
          <TextCylinder text={poem} />
        </div>
      </section>
    </PageTransition>
  )
}
