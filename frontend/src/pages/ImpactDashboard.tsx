import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import { featuredStory, restorationStories } from '@/data/featuredStory';
import { useImpactSummary, useOutcomeDistribution } from '@/hooks/useSupabaseData';

export default function ImpactDashboardPage() {
  const summary = useImpactSummary();
  const outcomesQuery = useOutcomeDistribution();

  const statCards = [
    {
      label: 'Girls Supported',
      value: summary.loading
        ? '…'
        : summary.data
          ? summary.data.girlsSupported.toLocaleString()
          : '—',
    },
    {
      label: 'Active Safehouses',
      value: summary.loading
        ? '…'
        : summary.data
          ? summary.data.safehouses.toLocaleString()
          : '—',
    },
    {
      label: 'Donors & Supporters',
      value: summary.loading
        ? '…'
        : summary.data
          ? summary.data.donors.toLocaleString()
          : '—',
    },
  ];

  const outcomes = outcomesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />

      {/* Hero Section */}
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        aria-labelledby="hero-headline"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#fcfbf9] via-[#f7f2ed] to-[#f0e4df] -z-10" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 lg:col-span-5">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary/30 text-foreground text-sm font-semibold tracking-wider uppercase mb-6 border border-secondary/50">
                {featuredStory.eyebrow}
              </span>
              <h2
                id="hero-headline"
                className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-foreground leading-[1.1] mb-6"
              >
                {featuredStory.headline}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                {featuredStory.dek}
              </p>
              <div className="flex flex-wrap gap-5">
                <button
                  className="px-8 py-4 rounded-full bg-primary text-white text-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  aria-label="Donate now to support Safe Harbor"
                >
                  Support Our Work
                </button>
                <button
                  className="px-8 py-4 rounded-full border border-foreground/20 text-foreground text-lg font-medium hover:bg-foreground/5 transition-colors"
                  aria-label="Learn more about this story"
                >
                  Read the story
                </button>
              </div>
            </div>

            <div className="md:col-span-6 lg:col-span-7 relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] md:aspect-[4/4] lg:aspect-[4/3] bg-[#e6dcd8]">
                {/* Abstract warm art placeholder for hero */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f2e5d5] via-[#e8d1c8] to-[#d4b5b0] opacity-80 mix-blend-multiply" />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-foreground/60 to-transparent">
                  <p className="text-white text-lg font-serif italic text-shadow-sm">
                    "{featuredStory.imageCaption}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-24 bg-white border-y border-border/50" aria-labelledby="impact-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1
              id="impact-heading"
              className="text-4xl md:text-5xl font-serif text-foreground mb-6"
            >
              The Reach of Our Care
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Numbers only tell part of the story. Each statistic represents a life touched, a dignity restored, and a future reclaimed.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {statCards.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-3xl border border-border/60 bg-background/50 p-10 text-center hover:shadow-md transition-shadow"
                role="region"
                aria-label={`${label}: ${value}`}
              >
                <p className="text-6xl font-serif text-primary mb-4">{value}</p>
                <p className="text-base font-bold uppercase tracking-wider text-foreground/70">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Outcomes + Quote */}
      <section className="py-24 bg-background" aria-labelledby="outcomes-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Outcomes */}
            <div>
              <h2
                id="outcomes-heading"
                className="text-3xl font-serif text-foreground mb-10"
              >
                Journeys of Restoration
              </h2>
              <div className="space-y-8">
                {outcomes.map(({ label, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-lg text-foreground font-medium">{label}</span>
                      <span className="text-2xl font-serif text-primary">{pct}%</span>
                    </div>
                    <div
                      className="h-2.5 rounded-full bg-border overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label}: ${pct}%`}
                    >
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pull quote */}
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/20 rounded-[3rem] transform -rotate-3" />
              <div className="relative rounded-[2.5rem] p-10 md:p-14 bg-foreground text-white shadow-xl">
                <span className="absolute top-6 left-8 text-8xl text-white/10 font-serif leading-none select-none" aria-hidden="true">
                  "
                </span>
                <blockquote className="relative z-10">
                  <p className="text-2xl md:text-3xl font-serif italic leading-relaxed text-white/95 mb-8">
                    Data allows us to see the scale, but empathy allows us to see the child. Our true success is measured in the silence of a peaceful night's sleep.
                  </p>
                  <footer>
                    <cite className="text-lg text-primary not-italic font-medium block">
                      Sarah Al-Mansour
                    </cite>
                    <span className="text-white/60 text-base">Clinical Director</span>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restoration Stories */}
      <section className="py-24 bg-white" aria-labelledby="stories-heading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              id="stories-heading"
              className="text-4xl font-serif text-foreground mb-4"
            >
              Voices of Hope
            </h2>
            <p className="text-xl text-muted-foreground">The milestones that matter most.</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8">
            {restorationStories.map((story, i) => {
              // Replace cold gradients with warm editorial ones
              const warmGradients = [
                'from-[#f2e5d5] to-[#e8d1c8]',
                'from-[#e8d1c8] to-[#d4b5b0]',
                'from-[#fcfbf9] to-[#f2e5d5]'
              ];
              
              return (
              <article
                key={story.id}
                className="group rounded-3xl bg-background border border-border/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                aria-label={`Story: ${story.title}`}
              >
                <div
                  className={`w-full aspect-[4/3] bg-gradient-to-br ${warmGradients[i % 3]} relative`}
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity duration-300" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-serif text-foreground mb-4">
                    {story.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {story.description}
                  </p>
                </div>
              </article>
            )})}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
