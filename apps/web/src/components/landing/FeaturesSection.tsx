// ============================================================================
// File: apps/web/src/components/landing/FeaturesSection.tsx
// Version: 1.0.0 — 2026-04-20
// Why: Bento-box style grid showcasing core product features.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { motion } from 'framer-motion';
import { Lock, ActivitySquare, Brain, Smartphone } from 'lucide-react';

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-900/30 border-y border-white/5 relative overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Built for the rigorous demands of Canadian EMS.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Everything you need for safe, secure, and clinically-sound continuous medical education (CME).
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          
          {/* Large Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden group"
          >
            <div className="absolute top-8 right-8 text-brand-500 opacity-20 group-hover:opacity-100 transition-opacity">
              <Lock className="w-24 h-24" strokeWidth={1} />
            </div>
            <div className="relative z-10 md:w-2/3">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">PIPEDA & PHIPA Compliant</h3>
              <p className="text-slate-400">
                100% anonymized clinical telemetry. All interactions are thoroughly scrubbed of PII before ever reaching our analytics or LLM review engines, ensuring total privacy.
              </p>
            </div>
          </motion.div>

          {/* Medium Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-6">
              <ActivitySquare className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Dynamic Vitals</h3>
            <p className="text-slate-400 text-sm">
              Patients respond realistically to the medications you administer.
            </p>
          </motion.div>

          {/* Medium Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
              <Smartphone className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Mobile First</h3>
            <p className="text-slate-400 text-sm">
              Train on-shift during downtime with our native iOS and Android apps.
            </p>
          </motion.div>

          {/* Large Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden group"
          >
            <div className="absolute top-8 right-8 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity">
              <Brain className="w-24 h-24" strokeWidth={1} />
            </div>
            <div className="relative z-10 md:w-2/3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Expert Rule Engine</h3>
              <p className="text-slate-400">
                Feedback is generated by a deterministic rule engine overseen by active Base Hospital Physicians, completely separate from LLM hallucinations.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
