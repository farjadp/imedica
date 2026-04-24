// ============================================================================
// File: apps/web/src/features/home/pages/HomePage.tsx
// Version: 4.2.0 — 2026-04-22
// Why: V3 Masterpiece public landing page shown before authentication.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { AnimatePresence, motion, useScroll, useTransform, Variants } from 'framer-motion';
import { ArrowRight, BrainCircuit, HeartPulse, PlayCircle, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { MarketingFooter } from '../../marketing/components/MarketingFooter.js';
import { MarketingNavbar } from '../../marketing/components/MarketingNavbar.js';

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

 

export function HomePage(): JSX.Element {
  // Parallax effect hooks
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollY, scrollY } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  const heroImgY = useTransform(heroScrollY, [0, 1], ['0%', '30%']);
  const heroTextY = useTransform(heroScrollY, [0, 1], ['0%', '-50%']);

  const aiRef = useRef<HTMLElement>(null);
  const { scrollYProgress: aiScrollY } = useScroll({
    target: aiRef,
    offset: ['start end', 'end start'],
  });
  const aiImgScale = useTransform(aiScrollY, [0, 1], [0.9, 1.1]);

  return (
    <main className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-primary-500/30">
      {/* --- Floating Pill Navbar --- */}
      <MarketingNavbar />

      {/* --- 1. Editorial Hero Section --- */}
      <section ref={heroRef} className="relative flex min-h-screen w-full flex-col overflow-hidden pt-32 lg:flex-row">
        {/* Left: Typography Focus */}
        <motion.div
          style={{ y: heroTextY }}
          className="relative z-10 flex w-full flex-col justify-center px-8 pb-20 lg:w-[45%] lg:pl-[10vw]"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
            </span>
            The Future of Clinical Training
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 text-6xl font-extrabold tracking-tighter text-white md:text-8xl lg:text-[6rem] lg:leading-[0.95]"
          >
            Master the <br />
            <span className="text-white/70">Unpredictable.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12 max-w-lg text-lg leading-relaxed text-white/70 md:text-xl"
          >
            A hyper-realistic, AI-driven simulator designed exclusively for paramedics. Train for high-acuity calls without the real-world risk.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-6"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="group flex items-center justify-center gap-3 rounded-full bg-primary-600 px-8 py-4 font-semibold text-white shadow-[0_0_40px_-10px_var(--color-primary-500)] hover:bg-primary-500 hover:shadow-[0_0_60px_-10px_var(--color-primary-500)] transition-colors"
              >
                Begin Simulator
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
            <motion.button 
              whileHover={{ x: 5 }}
              className="flex items-center gap-3 font-semibold text-white/70 transition-colors hover:text-white"
            >
              <PlayCircle className="h-6 w-6" />
              Watch Film
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right: Massive Edge-to-Edge Image */}
        <div className="relative w-full lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-[55%]">
          <div className="absolute inset-y-0 left-0 z-10 hidden w-48 bg-gradient-to-r from-background to-transparent lg:block" />
          <motion.div
            style={{ y: heroImgY }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-[60vh] w-full overflow-hidden lg:h-full"
          >
            <img
              src="/images/hero_medical_dashboard_1776877961935.png"
              alt="Medical Dashboard"
              className="h-full w-full object-cover object-left"
            />
          </motion.div>
        </div>
      </section>

      {/* --- 2. Asymmetrical Feature: AI Coaching --- */}
      <section ref={aiRef} className="relative w-full border-t border-white/5 bg-[#0a0a0a] py-32 lg:py-48">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-16 px-8 lg:flex-row-reverse lg:gap-32">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="flex w-full flex-col lg:w-1/2"
          >
            <BrainCircuit className="mb-6 h-10 w-10 text-primary-500" />
            <h2 className="mb-6 text-4xl font-extrabold tracking-tighter text-white md:text-6xl">
              Cognitive feedback <br /> in real-time.
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-white/70">
              Our Phase 5 AI engine monitors every decision, medication, and protocol selection. It doesn't just score you—it thinks like a senior medical director, offering deep, contextual insights into your clinical reasoning.
            </p>
            <motion.ul 
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="flex flex-col gap-4 text-white/70"
            >
              <motion.li variants={itemVariants} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_var(--color-primary-500)]" /> Protocol alignment analysis
              </motion.li>
              <motion.li variants={itemVariants} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_var(--color-primary-500)]" /> Dosage and timing verification
              </motion.li>
              <motion.li variants={itemVariants} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_var(--color-primary-500)]" /> Differential diagnosis suggestions
              </motion.li>
            </motion.ul>
          </motion.div>

          {/* Visual */}
          <div className="relative w-full lg:w-1/2">
            <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary-500/20 blur-[100px]" />
            <motion.div
              style={{ scale: aiImgScale }}
              className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
            >
              <img
                src="/images/ai_coaching_mockup_1776877975610.png"
                alt="AI Coaching UI"
                className="h-auto w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- 3. Full-Width Statement & Analytics --- */}
      <section className="w-full bg-[#050505] pt-32 lg:pt-48 pb-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-[1000px] px-8 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShieldCheck className="mx-auto mb-8 h-12 w-12 text-info-500" />
          </motion.div>
          <h2 className="mb-8 text-4xl font-bold tracking-tighter md:text-6xl">
            Built for scale. <br />
            Secured by design.
          </h2>
          <p className="text-xl leading-relaxed text-white/70">
            Fully compliant with PIPEDA and PHIPA. We physically separate identity data from performance analytics, giving base hospitals actionable insights without compromising individual paramedic privacy.
          </p>
        </motion.div>

        <div className="mx-auto mt-24 max-w-[1400px] px-8">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            whileHover={{ y: -10 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-surface/20 shadow-2xl transition-shadow hover:shadow-info-500/10"
          >
            <img
              src="/images/paramedic_team_analytics_1776877993117.png"
              alt="Team Analytics Dashboard"
              className="h-auto w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* --- 4. Brutalist Metrics Footer --- */}
      <MarketingFooter />
    </main>
  );
}
