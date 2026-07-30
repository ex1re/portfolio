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
  'Wondering if I really want to be this alone',
].join(' · ')

export default function About() {
  return (
    <PageTransition>
      <section className="flex min-h-screen flex-col justify-center gap-16 px-6 pt-32 pb-20 md:flex-row md:items-center md:justify-between md:gap-12 md:pt-20">
        <div className="md:max-w-xl">
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

        <TextCylinder text={poem} className="shrink-0" />
      </section>
    </PageTransition>
  )
}
