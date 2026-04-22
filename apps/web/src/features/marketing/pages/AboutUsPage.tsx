import { motion } from 'framer-motion';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const TEAM = [
  {
    name: 'Dr. Maryam Daneshian',
    role: 'Chief Executive Officer',
    bio: 'Anesthesiologist with 12+ years of clinical experience. Leads clinical strategy and service partnerships.',
  },
  {
    name: 'Dr. Salman Erfanian',
    role: 'Chief Product Officer',
    bio: 'Emergency medicine specialist ensuring every scenario is medically accurate and evidence-based.',
  },
  {
    name: 'Dr. Somayyeh Motevalli',
    role: 'Head of Business Development',
    bio: 'Healthcare operator driving paramedic service outreach and pilot agreements.',
  },
  {
    name: 'Farjad',
    role: 'Chief Technology Officer',
    bio: 'Full-stack architecture and engineering, turning clinical logic into a hyper-realistic digital simulator.',
  },
];

export function AboutUsPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-background text-text selection:bg-primary-500/30">
      <MarketingNavbar />
      
      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center pt-32 text-center px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl"
        >
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
            Built by clinicians, <br />
            <span className="text-text-muted">for clinicians.</span>
          </h1>
          <p className="text-xl leading-relaxed text-text-muted">
            We know the paramedic workflow intimately. We built Imedica because passive classroom training doesn't replicate the stress and pressure of an actual cardiac arrest.
          </p>
        </motion.div>
      </section>

      {/* Founders Section */}
      <section className="relative w-full border-t border-white/5 bg-[#0a0a0a] py-32">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="mb-16 grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-extrabold tracking-tighter text-white">The Founding Team</h2>
              <p className="text-lg text-text-muted">
                Three Canadian physicians and a full-stack engineer. We combine decades of emergency medical experience with cutting-edge software development.
              </p>
            </div>
            <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img 
                src="/images/founders.png" 
                alt="Imedica Founders" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member, i) => (
              <motion.div 
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-surface/50 p-6 backdrop-blur-sm"
              >
                <h3 className="mb-1 text-xl font-bold text-white">{member.name}</h3>
                <p className="mb-4 text-sm font-semibold text-primary-500">{member.role}</p>
                <p className="text-sm leading-relaxed text-text-muted">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
