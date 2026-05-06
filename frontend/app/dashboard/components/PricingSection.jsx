'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, Crown, Zap, Shield, Users, ChevronRight } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started with focused study.',
    features: [
      { name: '3 study sessions per day', included: true },
      { name: '5,000 AI tokens per day', included: true },
      { name: '30-day history access', included: true },
      { name: 'Basic AI quizzes', included: true },
      { name: 'Streak tracking', included: true },
      { name: 'Deep Mode', included: false },
      { name: 'Cloud Sync', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Admin dashboard', included: false },
    ],
    cta: 'Get Started',
    href: '/signup',
    color: 'var(--muted)',
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 'premium',
    name: 'Premium',
    price: { monthly: 199, yearly: 1990 },
    description: 'For serious learners who want the full FocusAInt experience.',
    features: [
      { name: 'limited study sessions', included: true },
      { name: '20,000 AI tokens per day', included: true },
      { name: 'Unlimited history access', included: true },
      { name: 'Advanced AI quizzes', included: true },
      { name: 'Streak tracking & Insurance', included: true },
      { name: 'Deep Mode', included: true },
      { name: 'Cloud Sync', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Admin dashboard', included: false },
    ],
    cta: 'Upgrade to Premium',
    href: '/signup',
    popular: true,
    color: 'var(--accent)',
    icon: <Crown className="w-5 h-5" />
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 499, yearly: 4990 },
    description: 'Everything in Premium, plus powerful tools for teams.',
    features: [
      { name: 'limited study sessions', included: true },
      { name: '100,000 AI tokens per day', included: true },
      { name: 'Unlimited history access', included: true },
      { name: 'Advanced AI quizzes', included: true },
      { name: 'Streak tracking & Insurance', included: true },
      { name: 'Deep Mode', included: true },
      { name: 'Cloud Sync', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Admin dashboard & Team mgmt', included: true },
      { name: 'Up to 20 team members', included: true },
    ],
    cta: 'Go Pro',
    href: '/signup',
    color: '#3b82f6',
    icon: <Users className="w-5 h-5" />
  }
]

export default function PricingSection({ showTitle = true, compact = false, currentTier = 'free' }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly')

  return (
    <div className={`w-full ${compact ? '' : 'py-12'}`}>
      {showTitle && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-4">Choose Your Plan</h2>
          <p className="text-muted max-w-2xl mx-auto">Select the plan that best fits your learning goals and team needs.</p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8 gap-4">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-muted'}`}>Monthly</span>
            <button 
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
            >
              <div className={`w-4 h-4 bg-accent rounded-full transition-transform duration-300 ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-white' : 'text-muted'}`}>Yearly</span>
              <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30 uppercase">Save 20%</span>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3'} gap-6 max-w-7xl mx-auto px-4`}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 group ${
                isCurrent 
                  ? 'border-accent bg-accent/10' 
                  : plan.popular 
                    ? 'bg-accent/5 border-accent/40 shadow-[0_0_40px_-15px_rgba(200,64,42,0.3)] hover:border-accent/60' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 shadow-xl">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 shadow-xl backdrop-blur-md">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/5 text-accent">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-medium text-white">{plan.name}</h3>
              </div>

              <p className="text-sm text-muted mb-6 leading-relaxed">
                {plan.description}
              </p>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-serif font-bold text-white">
                    ₹{billingPeriod === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
                  </span>
                  <span className="text-muted text-sm uppercase">/ month</span>
                </div>
                {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                  <p className="text-[10px] text-accent font-medium mt-1">Billed ₹{plan.price.yearly} annually</p>
                )}
              </div>

              <button 
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl text-center font-semibold text-sm transition-all duration-300 ${
                  isCurrent
                    ? 'bg-white/5 text-white/40 cursor-default'
                    : plan.popular 
                      ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isCurrent ? 'Active Plan' : plan.cta}
              </button>

            <div className="mt-8 space-y-4 flex-grow">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Features included:</p>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-white/20 mt-0.5 shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white/80' : 'text-white/20 line-through'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            </div>
          );
        })}
      </div>

      {!showTitle && (
        <div className="mt-12 text-center">
          <Link href="/pricing" className="text-sm text-muted hover:text-accent transition-colors flex items-center justify-center gap-2">
            View full feature comparison <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
