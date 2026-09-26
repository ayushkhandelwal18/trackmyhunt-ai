import { useState } from "react";
import Navbar from '../components/layout/Navbar'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import AnalyzerHighlight from '../components/landing/AnalyzerHighlight'
import ProductPreviews from '../components/landing/ProductPreviews'
import ExtensionShowcase from '../components/landing/ExtensionShowcase'
import HowItWorks from '../components/landing/HowITWorks'
import Testimonials from '../components/landing/Testimonials'
import CTA from '../components/landing/CTA'
import Footer from '../components/layout/Footer'
import AuthOverlay from '../components/auth/AuthOverlay'

function Landing() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="landing-shell min-h-screen">
      <Navbar openAuth={() => setShowAuth(true)} />
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} />}
      <main>
        <Hero />
        <Features />
        <AnalyzerHighlight />
        <ProductPreviews />
        <ExtensionShowcase />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default Landing;
