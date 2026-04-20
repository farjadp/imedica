// ============================================================================
// File: apps/web/src/components/landing/HeroSection.tsx
// Version: 1.0.0 — 2026-04-20
// Why: Animated hero banner with glassmorphism UI representations.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { motion } from 'framer-motion';
import { ArrowRight, Activity, ShieldCheck, Clock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background Blobs for specific premium aesthetic */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-32 left-1/2 w-[600px] h-[600px] bg-brand-400/10 rounded-full blur-[150px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col gap-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit border border-brand-500/30">
            <span className="flex w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow"></span>
            <span className="text-sm font-medium text-brand-400">Now entering Phase 2 Foundation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Master Clinical Decisions <br />
            <span className="text-gradient">Under Pressure.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
            The physician-validated scenario training platform for Canadian paramedics. Practice high-acuity, low-occurrence events in a safe, PIPEDA-compliant environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="group relative px-8 py-4 bg-brand-500 text-white font-semibold rounded-xl overflow-hidden hover:scale-[1.02] transition-transform shadow-[0_0_40px_rgba(6,182,212,0.4)]">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Demo Scenario 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button className="px-8 py-4 rounded-xl glass font-semibold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              View Curriculum
            </button>
          </div>

          <div className="flex items-center gap-8 pt-8 border-t border-slate-800">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white mb-1">50+</span>
              <span className="text-sm text-slate-500 font-medium">Verified Scenarios</span>
            </div>
            <div className="w-px h-12 bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white mb-1">PIPEDA</span>
              <span className="text-sm text-slate-500 font-medium">Compliant</span>
            </div>
            <div className="w-px h-12 bg-slate-800"></div>
            <div className="flex flex-col">
              <div className="flex -space-x-2 mb-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-brand-400" />
                  </div>
                ))}
              </div>
              <span className="text-sm text-slate-500 font-medium">Physician Validated</span>
            </div>
          </div>
        </motion.div>

        {/* Right Visual (Abstract UI representation) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative lg:h-[600px] flex items-center justify-center perspective-[2000px]"
        >
          {/* Main Floating Card */}
          <div className="relative z-20 w-full max-w-md glass-card rounded-2xl p-6 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-brand-400 font-mono text-sm mb-1">SCENARIO_01A</h3>
                <h2 className="text-lg font-bold text-white">Anaphylaxis — Bee Sting</h2>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-900/50 flex items-center justify-center border border-brand-500/30">
                <Clock className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-sm text-slate-300">
                  <span className="text-white font-bold block mb-1">Vitals Update:</span>
                  HR 128 • RR 26 • BP 84/52 • SpO2 92%
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-10 w-full rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center px-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-400">Administered Epinephrine 1:1,000 IM</span>
                </div>
                <div className="h-10 w-full rounded-lg glass flex items-center px-4">
                  <span className="text-sm font-medium text-slate-400">Waiting for next action...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background Floating Card */}
          <div className="absolute top-1/4 -right-12 z-10 w-64 glass-card rounded-2xl p-4 transform rotate-[15deg] opacity-70 blur-[1px]">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-6 h-6 text-brand-400" />
              <span className="font-semibold text-white">Privacy Safe</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full mb-2" />
            <div className="h-2 w-2/3 bg-slate-800 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
