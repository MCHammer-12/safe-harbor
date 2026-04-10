import PublicFooter from '@/components/shared/PublicFooter';

export default function StoryAcademicExcellencePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <article className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="relative h-56 sm:h-72">
            <img
              src="/images/educational-excellence.jpg"
              alt="Academic Excellence"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <p className="text-xs uppercase tracking-wider text-white/90 mb-2">Education outcomes</p>
              <h1 className="font-serif text-3xl sm:text-4xl text-white">Academic Excellence</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 prose prose-stone max-w-none">
            <p>
              Academic recovery often starts with confidence, not grades. Many girls enter Safe
              Harbor after long interruptions in schooling. The first milestone is re-establishing a
              daily rhythm: attendance, study blocks, and quiet spaces where concentration is
              possible.
            </p>
            <p>
              Mia started far behind in reading and mathematics. Her education mentor used
              individualized goals, short weekly assessments, and tutoring designed around attention
              span and emotional load. Counselors coordinated with teachers so classroom expectations
              stayed realistic and supportive.
            </p>
            <p>
              Within one semester, her attendance stabilized and her scores rose across core subjects.
              She joined a peer study circle and later presented in a school project competition.
              Those achievements became more than academic markers; they were proof that effort could
              produce change.
            </p>
            <p>
              Today, Mia mentors younger residents during evening study hours. Her story reflects a
              broader pattern we see every year: when safety, psychosocial care, and educational
              support are integrated, survivors do not just return to school, they build futures with
              direction and agency.
            </p>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
