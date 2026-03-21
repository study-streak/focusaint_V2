import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Ticker from './components/Ticker'
import Method from './components/Method'
import FlipCards from './components/FlipCards'
import BackedBy from './components/BackedBy'
import Features from './components/Features'
import Team from './components/Team'
import Timeline from './components/Timeline'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import { CTA, Footer } from './components/CTAFooter'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <Method />
        <FlipCards />
        <BackedBy />
        <Features />
        <Team />
        <Timeline />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
