import { createFileRoute } from '@tanstack/react-router';
import { CtaSection } from '@/components/home-page/cta-section';
import { FeaturesSection } from '@/components/home-page/feature-section';
import { Footer } from '@/components/home-page/footer';
import { HeroSection } from '@/components/home-page/hero-section';
import { Navigation } from '@/components/home-page/navigation';
import { PricingSection } from '@/components/home-page/pricing-section';
import { ProblemSolution } from '@/components/home-page/problem-solution';
import { StatsSection } from '@/components/home-page/stats-section';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ProblemSolution />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
