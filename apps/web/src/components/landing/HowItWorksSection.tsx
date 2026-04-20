// ============================================================================
// File: apps/web/src/components/landing/HowItWorksSection.tsx
// Version: 1.0.0 — 2026-04-20
// Why: Educational overview of the simulation flow using scroll-triggered cards.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { motion } from 'framer-motion';
import { Target, Zap, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: Target,
    title: 'Select a Clinical Scenario',
    description: 'Choose from a growing library of adult and pediatric cases. Everything from simple asthma to complex multi-trauma and anaphylaxis.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Act Under Time Pressure',
    description: 'Every decision takes simulated time. Your patient\'s vitals will degrade or improve dynamically based strictly on the actions you choose to take.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: ShieldCheck,
    title: 'Get Physician Feedback',
    description: 'Instead of pass/fail, our AI (under physician guidelines) reviews your exact decision pathway and explains the "why" behind the optimal clinical route.',
    color: 'from-emerald-500 to-teal-500',
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Deliberate Practice <br className="hidden md:block" />
            <span className="text-brand-400">Without the Risk.</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Imedica simulates the exact cognitive load of a real ambulance call, teaching you how to prioritize when seconds count.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="glass p-8 rounded-3xl relative overflow-hidden group hover:border-brand-500/50 transition-colors"
            >
              {/* Radial gradient background highlight on hover */}
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ease-out z-0" />
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
