import StaffHeader from '@/components/shared/StaffHeader';
import PublicFooter from '@/components/shared/PublicFooter';
import MlSocialPipelinePanel from '@/components/ml/MlSocialPipelinePanel';

export default function SocialMediaDashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          Internal Use Only
        </p>
        <h1 className="text-4xl lg:text-5xl font-serif text-foreground mb-6">Social media dashboard</h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-8">
          Outreach metrics and strategic views. ML-driven donation forecasts from engagement appear in
          the panel below when the pipeline is deployed.
        </p>

        <MlSocialPipelinePanel />
      </main>
      <PublicFooter />
    </div>
  );
}
