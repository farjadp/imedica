// ============================================================================
// File: apps/web/src/features/home/pages/HomePage.tsx
// Version: 5.0.0
// Why: V5 Bento Box SaaS Redesign — Light Theme
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BrainCircuit, PlayCircle, ShieldCheck, Zap, Activity, Award } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { MarketingFooter } from '../../marketing/components/MarketingFooter.js';
import { MarketingNavbar } from '../../marketing/components/MarketingNavbar.js';

// Infinite scrolling marquee component
const Marquee = () => {
  const items = [
    "VR TRAINING", "•", "AI FEEDBACK", "•", "PHIPA COMPLIANT", "•", "PARAMEDIC FIRST", "•", "SCALABLE", "•",
    "VR TRAINING", "•", "AI FEEDBACK", "•", "PHIPA COMPLIANT", "•", "PARAMEDIC FIRST", "•", "SCALABLE", "•"
  ];
  return (
    <div className="flex w-full overflow-hidden bg-gray-50 py-6 border-y border-gray-100">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 20, repeat: Infinity }}
        className="flex whitespace-nowrap"
      >
        {items.map((item, i) => (
          <span key={i} className={`mx-8 text-sm font-black tracking-widest ${item === '•' ? 'text-primary-300' : 'text-gray-400'}`}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export function HomePage(): JSX.Element {
  // Parallax effect hooks
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollY } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  const heroImgY = useTransform(heroScrollY, [0, 1], ['0%', '20%']);

  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900 selection:bg-primary-100 overflow-hidden">
      {/* --- Floating Pill Navbar --- */}
      <MarketingNavbar />

      {/* --- 1. Centered Hero Section --- */}
      <section ref={heroRef} className="relative flex w-full flex-col items-center justify-center pt-48 pb-20 px-4">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-transparent opacity-80 pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center max-w-5xl"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-5 py-2 text-sm font-bold tracking-wide text-primary-600 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-500"></span>
            </span>
            Imedica v3 is now available
          </div>
          
          <h1 className="mb-8 text-6xl font-black tracking-tighter text-gray-900 md:text-8xl lg:text-[7rem] leading-[0.9]">
            Master the <br />
            <span className="bg-gradient-to-r from-primary-600 via-blue-500 to-primary-400 bg-clip-text text-transparent">Unpredictable.</span>
          </h1>
          
          <p className="mb-12 max-w-2xl text-xl leading-relaxed text-gray-600 font-medium">
            The hyper-realistic, AI-driven simulator designed exclusively for paramedics. Train for high-acuity calls without the real-world risk.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="group flex items-center justify-center gap-3 rounded-full bg-gray-900 px-8 py-4 font-bold text-white shadow-xl transition-all hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-1"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="group flex items-center gap-3 rounded-full border-2 border-gray-200 bg-white px-8 py-4 font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50">
              <PlayCircle className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Floating Mockup */}
        <motion.div 
          style={{ y: heroImgY }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, type: 'spring', stiffness: 40 }}
          className="relative z-20 mt-20 w-full max-w-6xl px-4 perspective-[2000px]"
        >
          <div className="relative rounded-3xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 ring-1 ring-black/5 transform-gpu rotate-x-[5deg]">
            <div className="overflow-hidden rounded-2xl bg-gray-100">
              <img
                src="/images/hero_medical_dashboard_v3.png"
                alt="Medical Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Glossy overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none"></div>
          </div>
        </motion.div>
      </section>

      {/* --- Marquee --- */}
      <Marquee />

      {/* --- 2. Bento Box Feature Grid --- */}
      <section className="relative w-full py-32 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl mb-6">
              Everything you need to <span className="text-primary-600">save lives.</span>
            </h2>
            <p className="text-lg text-gray-600">
              Our comprehensive suite of tools integrates seamlessly to provide a unified training experience that scales from individuals to entire national organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            
            {/* Bento Block 1: AI Coaching (Large) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-gray-50 border border-gray-200 p-8 md:p-12 transition-all hover:shadow-xl"
            >
              <div className="relative z-10 max-w-md">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shadow-inner">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <h3 className="mb-4 text-3xl font-black text-gray-900">Cognitive feedback in real-time.</h3>
                <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                  Our Phase 5 AI engine monitors every decision, medication, and protocol selection. It thinks like a senior medical director, offering deep contextual insights.
                </p>
                <Link to="/features" className="inline-flex items-center gap-2 font-bold text-primary-600 hover:text-primary-700">
                  Explore AI Engine <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="absolute -right-20 -bottom-20 w-[120%] md:w-auto md:right-0 md:bottom-0 md:left-auto md:top-20 z-0 transition-transform duration-700 group-hover:scale-[1.02]">
                <img
                  src="/images/ai_coaching_mockup_v3.png"
                  alt="AI Coaching"
                  className="w-full max-w-lg object-contain shadow-2xl rounded-tl-2xl border-t border-l border-white/20"
                />
              </div>
            </motion.div>

            {/* Bento Block 2: Analytics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-gray-900 border border-gray-800 p-8 md:p-10 transition-all hover:shadow-2xl"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-white">Built for Scale</h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                  Physically separated identity data from analytics gives base hospitals insights without compromising privacy.
                </p>
              </div>
              <div className="mt-8 rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Scenarios Run</span>
                  <span className="text-2xl font-black text-white">10k+</span>
                </div>
              </div>
            </motion.div>

            {/* Bento Block 3: Security */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group overflow-hidden rounded-[2.5rem] bg-blue-50 border border-blue-100 p-8 md:p-10 transition-all hover:shadow-lg hover:border-blue-200"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-black text-gray-900">PHIPA Compliant</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Secured by design. Fully compliant with national healthcare privacy standards.
              </p>
            </motion.div>

            {/* Bento Block 4: VR Integration (Spans 2 columns on tablet+) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 flex items-center gap-8 overflow-hidden rounded-[2.5rem] bg-white border border-gray-200 p-8 md:p-10 transition-all hover:shadow-xl"
            >
              <div className="flex-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-gray-900">Immersive VR Mode</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  Connect your Oculus headset for full spatial presence. Practice muscle memory in 3D environments that react dynamically.
                </p>
              </div>
              <div className="hidden md:flex flex-1 justify-end">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 blur-2xl opacity-40"></div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* --- 3. Testimonial / Social Proof --- */}
      <section className="w-full bg-primary-900 py-32 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <Award className="mx-auto h-16 w-16 text-primary-400 mb-8 opacity-50" />
          <h2 className="text-3xl md:text-5xl font-medium leading-tight text-white mb-12">
            "Imedica has completely transformed how our paramedics approach high-acuity, low-frequency events. It's the closest thing to real-world experience."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary-800 border-2 border-primary-400 flex items-center justify-center text-xl font-bold text-white">
              JD
            </div>
            <div className="text-left">
              <div className="font-bold text-white text-lg">Dr. John Doe</div>
              <div className="text-primary-300">Medical Director, Ontario Base Hospital</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. Brutalist Metrics Footer --- */}
      <MarketingFooter />
    </main>
  );
}
