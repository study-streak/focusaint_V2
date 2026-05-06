'use client'
import PricingSection from '../../dashboard/components/PricingSection'

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[var(--black)] py-24 border-t border-[var(--line)]">
      <div className="container-shell mx-auto px-4">
        <PricingSection />
      </div>
    </section>
  )
}
