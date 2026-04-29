import { motion } from 'framer-motion';
import { Activity, Brain, Globe, Shield, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminPagesService } from '../../admin/services/pagesService.js';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const DEFAULT_STATS = [
  { label: 'Cardiac arrests annually in Canada', value: '40,000+' },
  { label: 'Occur outside of a hospital', value: '80-85%' },
  { label: 'Survival decrease per delayed minute', value: '7-10%' },
];

const DEFAULT_PILLARS = [
  {
    title: 'Healthcare Professionals',
    description: 'Our curriculum is developed and overseen by seasoned medical professionals, ensuring clinical accuracy and alignment with the latest Canadian BLS guidelines.',
    icon: <Activity className="h-6 w-6 text-primary-600" />,
  },
  {
    title: 'Technology Innovators',
    description: 'Our team of skilled developers and AI specialists are passionate about leveraging the latest advancements in virtual reality and artificial intelligence.',
    icon: <Zap className="h-6 w-6 text-primary-600" />,
  },
  {
    title: 'Educational Specialists',
    description: 'We are committed to pedagogical best practices, ensuring our training is highly effective in knowledge transfer and skill acquisition.',
    icon: <Brain className="h-6 w-6 text-primary-600" />,
  },
];

const DEFAULT_TEAM = [
  {
    name: 'Dr. Salman Erfanian',
    role: 'Co-Founder & Medical Director',
    bio: 'Dedicated healthcare professional driven to empower Canadians with life-saving skills through innovative training solutions.',
    avatarImage: '',
  },
  {
    name: 'Dr. Somayyeh Motevalli',
    role: 'Co-Founder & Clinical Operations',
    bio: 'Recognizing the need to revolutionize Basic Life Support education with accessible and effective training.',
    avatarImage: '',
  },
  {
    name: 'Dr. Maryam Daneshian',
    role: 'Co-Founder & Medical Strategy',
    bio: 'Combining diverse clinical expertise to create immersive, consequence-free environments for BLS mastery.',
    avatarImage: '',
  },
];

const DEFAULT_FEATURES = [
  {
    title: 'Experience Life-Saving Skills, Risk-Free',
    description: 'Immerse yourself in realistic medical emergencies through our cutting-edge Virtual Reality simulations. Practice critical BLS procedures in a safe, consequence-free environment, building muscle memory.',
    icon: <Shield className="h-8 w-8 text-primary-600" />,
  },
  {
    title: 'Personalized Learning Powered by AI',
    description: 'Our intelligent AI platform analyzes your performance and provides tailored feedback, guiding you to BLS mastery faster and more effectively. Benefit from a learning experience that adapts to your needs.',
    icon: <Brain className="h-8 w-8 text-primary-600" />,
  },
  {
    title: 'Accessible & Nationally Recognized',
    description: 'Gain essential life-saving skills and a respected BLS certification through our flexible online courses and mobile application, accessible anywhere in Canada.',
    icon: <Globe className="h-8 w-8 text-primary-600" />,
  },
];

export function AboutUsPage(): JSX.Element {
  const { data: pageData } = useQuery({
    queryKey: ['public-page', 'about'],
    queryFn: () => adminPagesService.getPublicPage('about'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const content = pageData?.contentJson || {};
  const stats = content.stats || DEFAULT_STATS;
  const pillars = content.pillars || DEFAULT_PILLARS;
  const team = content.team || DEFAULT_TEAM;
  const features = content.features || DEFAULT_FEATURES;

  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900 selection:bg-primary-100">
      <MarketingNavbar />
      
      {/* Hero Section */}
      <section className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden pt-32 text-center px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100 via-white to-white"></div>
        {content.heroImage && (
          <div className="absolute inset-0 opacity-10">
            <img src={content.heroImage} alt="Hero Background" className="h-full w-full object-cover" />
          </div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-bold text-primary-600">
            {content.heroTagline || "Based in Newmarket, Ontario"}
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-gray-900 md:text-7xl lg:text-8xl">
            {content.heroTitleLine1 || "Revolutionizing"} <br />
            <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              {content.heroTitleLine2 || "Healthcare Training"}
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
            {content.heroDescription || "We empower individuals across the nation with the skills and confidence to respond effectively in life-threatening medical emergencies using AI and Virtual Reality."}
          </p>
        </motion.div>
      </section>

      {/* The Problem / Statistics Section */}
      <section className="relative w-full border-t border-gray-100 bg-gray-50 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
                The Critical Need for <br />
                <span className="text-gray-400">Immediate Action</span>
              </h2>
              <div className="space-y-6 text-lg leading-relaxed text-gray-600">
                <p>
                  While precise daily figures are difficult to pin down, estimates suggest that dozens of Canadians die every day due to sudden cardiac arrest. Approximately <strong>40,000 cardiac arrests</strong> occur annually in Canada—over 100 per day.
                </p>
                <p>
                  Studies consistently show that bystander CPR and early defibrillation can significantly increase survival rates. For every minute CPR is delayed, the chance of survival decreases by 7-10%. 
                </p>
                <p>
                  With 80-85% of cardiac arrests happening outside of a hospital setting, bystander intervention is critical. Some research suggests that bystander CPR rates could be doubled with increased access and awareness.
                </p>
              </div>
            </motion.div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {stats.map((stat: any, i: number) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl"
                >
                  <div className="mb-2 text-4xl font-black text-primary-600 md:text-5xl">{stat.value}</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features / Our Approach Section */}
      <section className="relative w-full py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">Our Innovative Approach</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              Inspired by the potential of immersive technology and intelligent systems, we envisioned a future where every Canadian could access premier BLS training.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature: any, i: number) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg p-8 text-left transition-colors hover:bg-gray-50"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-primary-50 p-4 text-primary-600 shadow-inner group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="mb-4 text-xl font-extrabold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Pillars Section */}
      <section className="relative w-full border-t border-gray-100 bg-gray-50 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-5xl">A One-Stop Solution</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              IMEDICA is powered by a dedicated team of experts who bring a wealth of experience from diverse fields to ensure excellence, innovation, and collaboration.
            </p>
          </div>

          <div className="mb-24 grid gap-8 md:grid-cols-3">
            {pillars.map((pillar: any, i: number) => (
              <motion.div 
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                  {pillar.icon}
                </div>
                <h3 className="mb-3 text-xl font-extrabold">{pillar.title}</h3>
                <p className="text-gray-600">{pillar.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Founders */}
          <div className="border-t border-gray-200 pt-20 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">Meet the IMEDICA Team</h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-gray-600">
              Established by a team of dedicated healthcare professionals who recognized the need to revolutionize Basic Life Support (BLS) education.
            </p>
            
            <div className="grid gap-8 md:grid-cols-3">
              {team.map((member: any, i: number) => (
                <motion.div 
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl"
                >
                  {member.avatarImage ? (
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-4 ring-primary-200">
                      <img src={member.avatarImage} alt={member.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-black text-primary-600 ring-4 ring-primary-200">
                      {member.name.split(' ').map((n: string) => n[0]).join('').replace('D', '')}
                    </div>
                  )}
                  <h3 className="mb-1 text-xl font-extrabold text-gray-900">{member.name}</h3>
                  <p className="mb-4 text-sm font-bold tracking-wide text-primary-600">{member.role}</p>
                  <p className="text-sm leading-relaxed text-gray-600">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full overflow-hidden py-32 text-center">
        <div className="absolute inset-0 bg-primary-50"></div>
        <div className="relative z-10 mx-auto max-w-3xl px-8">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Ready to make a difference?
          </h2>
          <p className="mb-10 text-xl text-gray-600">
            BLS vs. CPR: Understand the key differences and why both matter. Equip yourself with the knowledge to act decisively.
          </p>
          <a 
            href="#" 
            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-primary-700"
          >
            Get our App on Google Play
          </a>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
