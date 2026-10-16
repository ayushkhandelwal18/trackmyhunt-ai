import { useState } from "react";
import Navbar from '../components/layout/Navbar'
import Hero from '../components/landing/Hero'
import CompanyStrip from '../components/landing/CompanyStrip'
import Features from '../components/landing/Features'
import TrackerShowcase from '../components/landing/TrackerShowcase'
import ExtensionShowcase from '../components/landing/ExtensionShowcase'
import AnalyzerHighlight from '../components/landing/AnalyzerHighlight'
import StayAhead from '../components/landing/StayAhead'
import PreparationHub from '../components/landing/PreparationHub'
import HowItWorks from '../components/landing/HowITWorks'
import Testimonials from '../components/landing/Testimonials'
import CTA from '../components/landing/CTA'
import Footer from '../components/layout/Footer'
import AuthOverlay from '../components/auth/AuthOverlay'
import '../components/landing/landing.css'

function Landing() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="landing-shell min-h-screen">
      <Navbar openAuth={() => setShowAuth(true)} />
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
      <main>
        <Hero />
        <CompanyStrip />
        <Features />
        <TrackerShowcase />
        <ExtensionShowcase />
        <AnalyzerHighlight />
        <StayAhead />
        <PreparationHub />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default Landing;
