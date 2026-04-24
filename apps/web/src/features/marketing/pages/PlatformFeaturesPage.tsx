import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Database, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const FEATURES = [
  {
    icon: <Activity className="h-8 w-8 text-primary-500" />,
    title: 'Designed for Canadian Protocols',
    description: 'Unlike US-focused platforms, our scenarios strictly follow Canadian BLS guidelines, provincial standards, and Ontario EMS protocols.'
  },
  {
    icon: <Database className="h-8 w-8 text-primary-500" />,
    title: 'Proprietary Data Moat',
    description: 'We generate structured decision data on how paramedics choose, how fast, and protocol alignment, creating intelligence layers for performance evaluation.'
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary-500" />,
    title: 'Physician-Validated Feedback',
    description: 'Rule-based logic validated by specialized physicians provides immediate, evidence-based feedback on every decision made during a scenario.'
  },
  {
    icon: <Lock className="h-8 w-8 text-primary-500" />,
    title: 'PIPEDA & PHIPA Compliant',
    description: 'Enterprise-grade security separating identity data from performance analytics to protect individual paramedic privacy while delivering organizational insights.'
  }
];

export function PlatformFeaturesPage(): JSX.Element {
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
            Platform <span className="text-white">Features</span>
          </h1>
          <p className="text-xl leading-relaxed text-white/70 mx-auto max-w-2xl">
            Not a medical device. Not artificial intelligence magic. Just robust, rule-based logic designed for the reality of Canadian EMS.
          </p>
        </motion.div>
      </section>

      <section className="w-full bg-[#0a0a0a] py-32 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-8">
          
          <div className="grid gap-8 md:grid-cols-2">
            {FEATURES.map((feature, idx) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group rounded-3xl border border-white/10 bg-surface/30 p-10 hover:bg-surface/50 transition-colors"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-white/5 p-4 border border-white/10 group-hover:border-primary-500/50 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="mt-16 flex justify-center"
          >
             <Link to="/register" className="rounded-full bg-white px-8 py-4 font-bold text-black hover:bg-white/90 shadow-xl">
               Experience the Platform
             </Link>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
