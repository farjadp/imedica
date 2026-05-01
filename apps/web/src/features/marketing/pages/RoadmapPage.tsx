import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const PHASES = [
  {
    phase: 'Phase 1',
    title: 'Ontario MVP & Validation',
    timeframe: 'Year 1',
    description: 'Launch of the mobile and web platform with 8-10 realistic high-acuity scenarios. Target of 2-3 paid pilot agreements within Ontario, testing rule-based logic and physician review.',
  },
  {
    phase: 'Phase 2',
    title: 'Canada-Wide Expansion',
    timeframe: 'Year 2',
    description: 'Scaling to the rest of Canada (25M additional population). Expanding to 250-300 paramedic services with similar training requirements and identical regulations.',
  },
  {
    phase: 'Phase 3',
    title: 'North American Scale',
    timeframe: 'Year 3+',
    description: 'Entry into the US market (500M+ population, 18,000+ EMS agencies) leveraging the proprietary decision-making dataset built during the Canadian rollout.',
  },
];

export function RoadmapPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-primary-500/30">
      <MarketingNavbar />
      
      <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center pt-32 text-center px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl"
        >
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
            Strategic <span className="text-primary-500">Roadmap.</span>
          </h1>
          <p className="text-xl leading-relaxed text-white/70 mx-auto max-w-2xl">
            A disciplined, realistic path from a Canadian proof-of-concept to a North American standard in paramedic clinical training.
          </p>
        </motion.div>
      </section>

      <section className="relative w-full bg-[#0a0a0a] py-32 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-8 grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Timeline Graphic */}
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
             <img src="/images/roadmap.png" alt="Futuristic Roadmap" className="w-full h-auto object-cover" />
          </div>

          {/* Right: Phases */}
          <div className="flex flex-col gap-12">
            {PHASES.map((phase, idx) => (
              <motion.div 
                key={phase.phase}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="relative pl-8"
              >
                {/* Timeline Line & Dot */}
                <div className="absolute left-0 top-2 bottom-[-48px] w-px bg-white/10" />
                <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_10px_var(--color-primary-500)]" />
                
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary-500 mb-2">{phase.phase} • {phase.timeframe}</h3>
                <h4 className="text-2xl font-bold text-white mb-3">{phase.title}</h4>
                <p className="text-white/70 leading-relaxed">{phase.description}</p>
              </motion.div>
            ))}
            
            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               className="pt-8"
            >
               <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-4 font-bold text-white hover:bg-primary-500 transition-colors">
                 Join the Journey <ArrowRight className="h-5 w-5" />
               </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
