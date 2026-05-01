import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const SCENARIOS = [
  {
    title: 'High-Acuity Cardiac Arrest',
    patient: '68-year-old unresponsive male.',
    vitals: 'History of hypertension. BP 140/95. HR 105. O2 sat 88%.',
    optimal: 'Suspect cardiac event. Administer O2. Start IV. Get 12-lead ECG. Transport to PCI center.',
    feedback: 'AHA guidelines recommend O2 to target 94–98%. IV access allows medication administration. Transport to PCI center is appropriate for STEMI.'
  },
  {
    title: 'Severe Anaphylaxis',
    patient: '22-year-old female, difficulty breathing post-ingestion.',
    vitals: 'Widespread hives. BP 85/50. HR 130. O2 sat 92% with stridor.',
    optimal: 'IM Epinephrine immediately. High-flow O2. Establish IV access.',
    feedback: 'Correct priority. IM Epinephrine is the first-line treatment for anaphylaxis. Delaying epi for IV access or antihistamines leads to poorer outcomes.'
  },
  {
    title: 'Acute Ischemic Stroke',
    patient: '74-year-old female, sudden right-sided weakness.',
    vitals: 'Aphasic. BP 180/110. HR 88. BGL 5.4 mmol/L.',
    optimal: 'Perform FAST-ED. Minimize scene time. Pre-notify comprehensive stroke center.',
    feedback: 'Excellent scene management. Recognizing stroke and minimizing on-scene time to under 15 minutes significantly improves tissue plasminogen activator (tPA) eligibility.'
  }
];

export function ClinicalScenariosPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-[#050505] text-white selection:bg-primary-500/30">
      <MarketingNavbar />
      
      <section className="relative flex min-h-[50vh] w-full flex-col items-center justify-center pt-32 text-center px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl"
        >
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
            Clinical <span className="text-info-500">Scenarios</span>
          </h1>
          <p className="text-xl leading-relaxed text-white/70 mx-auto max-w-2xl">
            Practice making decisions in realistic patient cases. Get physician-reviewed feedback and build confidence before the real emergency.
          </p>
        </motion.div>
      </section>

      <section className="w-full bg-[#0a0a0a] py-32 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-8">
          
          <div className="flex flex-col gap-12">
            {SCENARIOS.map((scenario, idx) => (
              <motion.div 
                key={scenario.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface/30 p-8 hover:border-info-500/50 transition-colors lg:p-12"
              >
                <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-gradient-to-l from-info-500/5 to-transparent lg:block" />
                
                <div className="relative z-10 grid gap-8 lg:grid-cols-2">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10 text-xs font-bold text-white uppercase">
                      <FileText className="h-3 w-3 text-info-500" /> Case {idx + 1}
                    </div>
                    <h3 className="mb-4 text-3xl font-bold text-white">{scenario.title}</h3>
                    <div className="mb-4 rounded-xl bg-black/40 p-4 border border-white/5">
                      <p className="text-sm font-semibold text-white mb-1">Patient Presentation:</p>
                      <p className="text-sm text-white/70">{scenario.patient} {scenario.vitals}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center gap-4">
                    <div className="rounded-xl border border-primary-500/20 bg-primary-900/10 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">Optimal Decision</p>
                      <p className="text-sm text-white">{scenario.optimal}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">System Feedback</p>
                      <p className="text-sm text-white/70">{scenario.feedback}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="mt-24 flex flex-col items-center text-center"
          >
             <h3 className="text-2xl font-bold text-white mb-6">Ready to run your first scenario?</h3>
             <Link to="/register" className="inline-flex items-center gap-3 rounded-full bg-info-600 px-8 py-4 font-bold text-white hover:bg-info-500 transition-colors shadow-[0_0_30px_-10px_var(--color-info-500)]">
               Try a Scenario Now <ArrowRight className="h-5 w-5" />
             </Link>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
