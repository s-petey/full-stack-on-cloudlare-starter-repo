import { createFileRoute } from '@tanstack/react-router';
import { CtaSection } from 'src/components/home-page/cta-section';
import { FeaturesSection } from 'src/components/home-page/feature-section';
import { Footer } from 'src/components/home-page/footer';
import { HeroSection } from 'src/components/home-page/hero-section';
import { Navigation } from 'src/components/home-page/navigation';
import { PricingSection } from 'src/components/home-page/pricing-section';
import { ProblemSolution } from 'src/components/home-page/problem-solution';
import { StatsSection } from 'src/components/home-page/stats-section';

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
