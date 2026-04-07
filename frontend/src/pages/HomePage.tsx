import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/layout/PublicHeader'
import { PublicFooter } from '../components/layout/PublicFooter'
import { useImpactSummary } from '../hooks/useImpactData'

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

const features = [
  {
    title: 'Safe homes',
    body: 'Trauma-informed residential care across nine homes in the Philippines, staffed by trained social workers and house parents.',
  },
  {
    title: 'Healing pathways',
    body: 'Counseling, education, healthcare, and life-skills programs anchored to each girl’s individual case plan.',
  },
  {
    title: 'Reintegration',
    body: 'Family reunification, foster care, and independent-living tracks supported through case conferences and home visits.',
  },
] as const

export function HomePage() {
  const summary = useImpactSummary()

  const stats = [
    {
      label: 'Girls in safe homes today',
      value: summary.data ? formatNumber(summary.data.active_residents) : '—',
    },
    {
      label: 'Active safehouses',
      value: summary.data ? formatNumber(summary.data.active_safehouses) : '—',
    },
    {
      label: 'People who have given',
      value: summary.data ? formatNumber(summary.data.unique_donors) : '—',
    },
  ]

  return (
    <div className="min-h-screen bg-sh-canvas text-sh-ink">
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="border-b border-sh-mist-deep/50 bg-gradient-to-br from-sh-hero-from via-sh-surface to-sh-accent-soft/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sh-accent">Safe Harbor · Philippines</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-sh-deep md:text-5xl">
                Restoring safety, dignity, and hope to survivors.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-sh-muted md:text-base">
                We operate trauma-informed safe homes for girls who have survived sexual abuse and trafficking, walking
                with each child from rescue through reintegration.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/impact"
                  className="inline-flex items-center justify-center rounded-md bg-sh-warm px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-sh-warm-hover"
                >
                  Donate now
                </Link>
                <Link
                  to="/impact"
                  className="inline-flex items-center justify-center rounded-md border-2 border-sh-primary bg-sh-surface px-6 py-3 text-xs font-bold uppercase tracking-wide text-sh-primary shadow-sm transition-colors hover:bg-sh-mist"
                >
                  See our impact
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-sh-mist-deep/40 bg-sh-mist/60 shadow-md">
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-sh-sage-soft via-sh-mist to-sh-accent-soft" aria-hidden />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-sh-deep/80">A safer tomorrow</p>
                <p className="mt-1 text-sm font-medium text-sh-muted">
                  Built on trust, evidence, and community partnership.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live stats strip */}
        <section className="border-b border-sh-mist-deep/40 bg-sh-surface" aria-label="Live impact statistics">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <p className="text-4xl font-black text-sh-deep md:text-5xl">
                  {summary.loading ? (
                    <span className="inline-block h-10 w-24 animate-pulse rounded bg-sh-mist-deep/60 align-middle" />
                  ) : summary.error ? (
                    '—'
                  ) : (
                    s.value
                  )}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-sh-muted">{s.label}</p>
              </div>
            ))}
          </div>
          {summary.error && (
            <p className="mx-auto max-w-6xl px-6 pb-4 text-xs text-red-700">
              Live data unavailable: {summary.error}
            </p>
          )}
        </section>

        {/* How we help */}
        <section className="bg-sh-mist/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-black uppercase tracking-tight text-sh-deep">How we help</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sh-muted md:text-base">
              Three programs, one continuum of care from the moment a girl enters our doors to long after she leaves.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="rounded-xl border border-sh-mist-deep/50 bg-sh-surface p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="h-1 w-12 rounded-full bg-sh-primary" aria-hidden />
                  <h3 className="mt-4 text-lg font-black text-sh-deep">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-sh-muted">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-gradient-to-br from-sh-deep to-sh-primary text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Help us reach the next girl.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90">
                Every donation funds counseling, education, and the daily care that turns survivors into thriving young
                women.
              </p>
            </div>
            <Link
              to="/impact"
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-sh-warm px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-colors hover:bg-sh-warm-hover"
            >
              Give today
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
