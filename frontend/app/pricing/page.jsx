'use client'
import Link from 'next/link'
import Navbar from '../landing/components/Navbar'
import PricingSection from '../dashboard/components/PricingSection'
import { Check, Minus } from 'lucide-react'

const features = [
  { name: 'Daily study sessions', free: '3 sessions', premium: 'Unlimited', pro: 'Unlimited' },
  { name: 'Daily LLM tokens', free: '1,000 tokens', premium: '10,000 tokens', pro: '10,000 tokens' },
  { name: 'Data history access', free: '30 days', premium: 'Unlimited', pro: 'Unlimited' },
  { name: 'AI quiz generation', free: 'Basic', premium: 'Advanced', pro: 'Advanced' },
  { name: 'Deep Mode', free: false, premium: true, pro: true },
  { name: 'Cloud synchronization', free: false, premium: true, pro: true },
  { name: 'Advanced analytics', free: false, premium: true, pro: true },
  { name: 'Streak insurance', free: false, premium: true, pro: true },
  { name: 'Admin dashboard', free: false, premium: false, pro: true },
  { name: 'Team management', free: false, premium: false, pro: true },
  { name: 'Max team members', free: '1', premium: '1', pro: '20' },
  { name: 'Priority support', free: false, premium: 'Email', pro: 'Priority' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="container-shell">
          <div className="text-center mb-16">
            <span className="label text-accent font-bold mb-4 inline-block">Pricing Plans</span>
            <h1 className="text-4xl md:text-6xl font-serif font-light text-white mb-6">
              Invest in your <span className="text-accent italic">Focus.</span>
            </h1>
            <p className="text-muted max-w-xl mx-auto text-lg leading-relaxed">
              From individual learners to large study groups, we have a plan that grows with your cognitive needs.
            </p>
          </div>

          <PricingSection showTitle={false} />

          {/* Comparison Table */}
          <div className="mt-32 max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-serif text-white text-center mb-12">Compare Features</h2>
            
            <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/[0.02]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-6 text-sm font-bold text-muted uppercase tracking-wider">Feature</th>
                    <th className="p-6 text-sm font-bold text-white uppercase tracking-wider text-center">Free</th>
                    <th className="p-6 text-sm font-bold text-accent uppercase tracking-wider text-center bg-accent/5">Premium</th>
                    <th className="p-6 text-sm font-bold text-blue-400 uppercase tracking-wider text-center">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr key={i} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors`}>
                      <td className="p-6 text-white/80 font-medium">{feature.name}</td>
                      <td className="p-6 text-center text-sm text-muted">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? <Check className="w-5 h-5 text-accent mx-auto" /> : <Minus className="w-5 h-5 text-white/10 mx-auto" />
                        ) : feature.free}
                      </td>
                      <td className="p-6 text-center text-sm text-white bg-accent/[0.02]">
                        {typeof feature.premium === 'boolean' ? (
                          feature.premium ? <Check className="w-5 h-5 text-accent mx-auto" /> : <Minus className="w-5 h-5 text-white/10 mx-auto" />
                        ) : feature.premium}
                      </td>
                      <td className="p-6 text-center text-sm text-white">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? <Check className="w-5 h-5 text-blue-400 mx-auto" /> : <Minus className="w-5 h-5 text-white/10 mx-auto" />
                        ) : feature.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h3 className="text-xl text-white mb-4">Have questions?</h3>
            <p className="text-muted mb-8">We're here to help you choose the right path.</p>
            <Link href="/contact" className="text-accent border-b border-accent/30 hover:border-accent pb-1 transition-all">
              Contact our support team &rarr;
            </Link>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
      `}</style>
    </div>
  )
}

