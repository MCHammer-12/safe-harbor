import PublicFooter from '@/components/shared/PublicFooter';

export default function StoryReconnectingWithFamilyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <article className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="relative h-56 sm:h-72">
            <img
              src="/images/reconnecting-with-family.jpg"
              alt="Reconnecting with Family"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <p className="text-xs uppercase tracking-wider text-white/90 mb-2">Family restoration</p>
              <h1 className="font-serif text-3xl sm:text-4xl text-white">Reconnecting with Family</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 prose prose-stone max-w-none">
            <p>
              Reconnection at Safe Harbor begins with one principle: safety first. Before any visit
              is scheduled, social workers complete risk checks, clarify boundaries, and prepare both
              the child and family for what healthy contact should look like.
            </p>
            <p>
              For Liza, early visits were brief and supervised. Conversations were guided, and every
              session ended with debriefing so her reactions could be processed right away. Her
              family also joined coaching sessions on trauma-informed communication, accountability,
              and practical support at home.
            </p>
            <p>
              Over several months, trust was rebuilt through consistency rather than promises. Home
              visitation logs helped the team track what worked, where tension appeared, and which
              follow-up steps were needed. Case conferences brought counselors, social workers, and
              family into one coordinated plan.
            </p>
            <p>
              The result was not a perfect reunion, but a healthier foundation: clearer boundaries,
              safer interactions, and a family that learned to listen differently. Liza now reports
              feeling both connected and respected, and reunification planning continues with her
              voice at the center.
            </p>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
