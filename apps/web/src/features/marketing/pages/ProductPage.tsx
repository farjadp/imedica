import { motion } from 'framer-motion';
import { ArrowRight, Crosshair, ShieldAlert, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

export function ProductPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-background text-text selection:bg-primary-500/30">
      <MarketingNavbar />
      
      {/* Hero */}
      <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center pt-32 text-center px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-400">
            The Core Problem
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
            Skills decay is <span className="text-error-500">real.</span>
          </h1>
          <p className="text-xl leading-relaxed text-text-muted mx-auto max-w-2xl">
            Published data shows 40–50% skill loss within 6 months of training. Paramedic training is infrequent and passive. When emergencies happen, decision quality varies widely.
          </p>
        </motion.div>
      </section>

      {/* The Gap vs Solution */}
      <section className="w-full bg-[#0a0a0a] py-32 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/10 bg-black/40 p-12 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-white">What Exists Today</h3>
              <ul className="flex flex-col gap-6 text-text-muted">
                <li className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-error-500/20 p-2 text-error-500"><Timer className="h-5 w-5" /></div>
                  <div>
                    <strong className="block text-white">Infrequent Classroom Sessions</strong>
                    <p className="text-sm">Trained once or twice yearly for 1-2 days. Fails to simulate pressure.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-error-500/20 p-2 text-error-500"><ShieldAlert className="h-5 w-5" /></div>
                  <div>
                    <strong className="block text-white">No Decision Quality Feedback</strong>
                    <p className="text-sm">If a sub-optimal decision is made in the field, nobody tells them.</p>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-primary-500/30 bg-primary-900/10 p-12 backdrop-blur-sm shadow-[0_0_50px_-12px_var(--color-primary-500)]"
            >
              <h3 className="mb-6 text-2xl font-bold text-white">The Imedica Solution</h3>
              <ul className="flex flex-col gap-6 text-text-muted">
                <li className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-primary-500/20 p-2 text-primary-500"><Crosshair className="h-5 w-5" /></div>
                  <div>
                    <strong className="block text-white">Deliberate Practice Anytime</strong>
                    <p className="text-sm">10-minute scenarios available 24/7 on web or mobile.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-primary-500/20 p-2 text-primary-500"><ShieldAlert className="h-5 w-5" /></div>
                  <div>
                    <strong className="block text-white">Instant, Evidence-Based Feedback</strong>
                    <p className="text-sm">Rule-based logic validated by physicians to measure protocol adherence and speed.</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visual */}
      <section className="py-32 flex justify-center px-8">
        <div className="relative max-w-[1000px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
           <img src="/images/product_ai.png" alt="Medical Software UI" className="w-full h-auto object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-12">
             <div>
               <h3 className="text-3xl font-bold text-white mb-4">A data moat for decision-making.</h3>
               <p className="max-w-xl text-text-muted mb-8">Every scenario generates structured data, building Canada's only dataset of paramedic decision-making under pressure.</p>
               <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90">
                 Start Free Trial <ArrowRight className="h-4 w-4" />
               </Link>
             </div>
           </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
