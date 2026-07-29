import PageTransition from '../components/PageTransition'

export default function About() {
  return (
    <PageTransition>
      <section className="flex min-h-screen flex-col justify-center px-6">
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
      </section>
    </PageTransition>
  )
}
