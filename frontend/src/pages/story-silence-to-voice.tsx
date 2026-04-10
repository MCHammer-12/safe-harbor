import PublicFooter from '@/components/shared/PublicFooter';

export default function StorySilenceToVoicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <article className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="relative h-56 sm:h-72">
            <img
              src="/images/impact-hero-image.jpg"
              alt="A Journey from Silence to Voice"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <p className="text-xs uppercase tracking-wider text-white/90 mb-2">Featured restoration story</p>
              <h1 className="font-serif text-3xl sm:text-4xl text-white">A Journey from Silence to Voice</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 prose prose-stone max-w-none">
            <p>
              When Ana arrived at Safe Harbor, she spoke in short answers and avoided eye contact.
              Her caseworker noted that silence was not resistance; it was protection. In the first
              weeks, progress looked small: showing up to sessions, choosing a seat near the door,
              and writing one sentence in her journal.
            </p>
            <p>
              The team built routine around safety. A counselor met her at the same time each week,
              staff used predictable check-ins, and peer groups were introduced slowly. By month two,
              Ana began naming feelings aloud. By month three, she volunteered to read her own
              reflection during group therapy, then asked if she could help welcome new residents.
            </p>
            <p>
              Her voice did not return in one moment; it returned in layers. A music workshop helped
              her express what was hard to say directly. Educational support restored confidence in
              class. Family conferencing, done at her pace, created a plan for safer communication at
              home. Every part of the program worked together: trauma care, structure, and dignity.
            </p>
            <p>
              Today, Ana leads a peer activity once a week. She still has difficult days, but she
              now has language, support, and choices. Her story reminds us that recovery is not
              linear, and that healing often starts with one protected space where being heard is
              possible.
            </p>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
