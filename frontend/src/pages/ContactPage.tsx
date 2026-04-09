import PublicFooter from '@/components/shared/PublicFooter';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          Get in touch
        </p>
        <h1 className="font-serif text-foreground text-[clamp(2rem,4vw,3.2rem)] mb-6">
          Contact Safe Harbor
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
          Whether you're a partner, a donor, a caseworker, or someone who needs help — we want
          to hear from you. Reach out through any of the channels below and a member of our team
          will respond within one business day.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-foreground text-xl mb-2">Email</h2>
            <p className="text-muted-foreground text-sm mb-3">
              For general questions, partnerships, and donor inquiries.
            </p>
            <a
              href="mailto:hello@safeharbor.org"
              className="text-primary font-medium hover:underline break-all"
            >
              hello@safeharbor.org
            </a>
          </article>

          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-foreground text-xl mb-2">Phone</h2>
            <p className="text-muted-foreground text-sm mb-3">
              Monday through Friday, 9am to 5pm Philippine Time.
            </p>
            <a
              href="tel:+63281234567"
              className="text-primary font-medium hover:underline"
            >
              +63 2 8123 4567
            </a>
          </article>

          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-foreground text-xl mb-2">Office</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Safe Harbor Foundation<br />
              Quezon City, Metro Manila<br />
              Philippines
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-foreground text-xl mb-2">Urgent concerns</h2>
            <p className="text-muted-foreground text-sm mb-3">
              If a child is in immediate danger, contact local authorities first, then our
              24/7 response line.
            </p>
            <a href="tel:+63290012345" className="text-primary font-medium hover:underline">
              +63 2 9001 2345
            </a>
          </article>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
          <h2 className="font-serif text-foreground text-2xl mb-3">Partner with us</h2>
          <p className="text-muted-foreground leading-relaxed">
            We work with NGOs, government agencies, and faith-based organizations across the
            Philippines and beyond. If you'd like to explore a partnership, send us a note at{' '}
            <a href="mailto:partners@safeharbor.org" className="text-primary font-medium hover:underline">
              partners@safeharbor.org
            </a>
            .
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
