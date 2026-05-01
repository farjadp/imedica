import { motion } from 'framer-motion';
import { Activity, Brain, Briefcase, HeartPulse, Shield, Stethoscope, Target, Users, Zap, Mail } from 'lucide-react';

const LinkedinIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);
import { useQuery } from '@tanstack/react-query';
import { adminPagesService } from '../../admin/services/pagesService.js';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const DEFAULT_EXPERTISE = [
  {
    title: 'Clinical Depth',
    description: 'Our training programs are rooted in the practical knowledge of experienced medical specialists. We ensure simulations accurately reflect emergency realities and adhere to the highest standards.',
    icon: <Stethoscope className="h-6 w-6 text-primary-600" />,
  },
  {
    title: 'Technological Innovation',
    description: 'We leverage cutting-edge technology to enhance learning, creating immersive VR experiences and AI-powered personalized feedback systems that optimize learning outcomes.',
    icon: <Zap className="h-6 w-6 text-primary-600" />,
  },
  {
    title: 'Entrepreneurial Drive',
    description: 'Strong leadership and business acumen ensure our innovative training solutions are accessible to a wider audience and have a sustainable impact on Canadian communities.',
    icon: <Briefcase className="h-6 w-6 text-primary-600" />,
  },
];

const DEFAULT_ECOSYSTEM = [
  {
    title: 'Improving Emergency Response Capacity',
    description: 'We increase the number of individuals equipped to respond confidently in medical emergencies, leading to better outcomes for patients.',
    icon: <Activity className="h-6 w-6 text-blue-600" />,
  },
  {
    title: 'Enhancing Healthcare Professional Training',
    description: 'Our advanced simulations provide professionals with opportunities to refine skills, improve decision-making, and stay up-to-date with BLS guidelines.',
    icon: <Shield className="h-6 w-6 text-blue-600" />,
  },
  {
    title: 'Promoting Public Health Awareness',
    description: 'We empower the general public to take an active role in emergency preparedness, fostering a culture of community responsibility.',
    icon: <Users className="h-6 w-6 text-blue-600" />,
  },
  {
    title: 'Driving Innovation in Healthcare Education',
    description: 'Pioneering the use of VR and AI to create more engaging learning experiences, pushing the boundaries of educational practices.',
    icon: <Brain className="h-6 w-6 text-blue-600" />,
  },
  {
    title: 'Supporting Canadian Economic Growth',
    description: 'As a Canadian company, we create skilled jobs in technology and healthcare, contributing to national economic growth.',
    icon: <Target className="h-6 w-6 text-blue-600" />,
  },
];

const DEFAULT_TEAM = [
  {
    name: 'Dr. Maryam Daneshian',
    role: 'Chief Executive Officer (CEO)',
    avatarImage: './public/images/team/dr-maryam-daneshian.jpeg',
    bio: 'A highly skilled Anesthesiologist with a strong commitment to advancing medical education. Her extensive clinical experience and research background provide a crucial foundation for clinically relevant BLS training.',
  },
  {
    name: 'Dr. Salman Erfanian',
    role: 'Chief Product Officer (CPO)',
    avatarImage: './public/images/team/dr-salman-erfanian.png',
    bio: 'An experienced Emergency Medicine Specialist focusing on advanced medical technologies. His understanding of critical emergencies drives the development of our immersive VR and AI feedback systems.',
  },
  {
    name: 'Dr. Somayyeh Motevalli',
    role: 'Business Developer',
    bio: 'A successful dental surgeon and clinic owner, bringing entrepreneurial spirit and proven leadership to drive strategic growth and expand the reach of our life-saving training.',
    avatarImage: './public/images/team/dr-somayeh-motevali.jpeg',
  },
  {
    name: 'Farjad PMD',
    role: 'Chief Technology Officer (CTO)',
    bio: 'The technical mastermind behind our platform. Bringing years of IT expertise to ensure our infrastructure is robust, scalable, and delivers cutting-edge technology for our life-saving training.',
    avatarImage: './public/images/team/farjad-cto.png',
  },
];

const DEFAULT_COLLABORATION = [
  { label: 'Clinically Accurate', value: 'Grounded in Canadian BLS guidelines.' },
  { label: 'Technologically Advanced', value: 'Utilizing AI and VR technologies.' },
  { label: 'Highly Effective', value: 'Improving skill acquisition and confidence.' },
];

export function TeamPage(): JSX.Element {
  const { data: pageData } = useQuery({
    queryKey: ['public-page', 'team'],
    queryFn: () => adminPagesService.getPublicPage('team'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const content = pageData?.contentJson || {};
  const expertise = content.expertise || DEFAULT_EXPERTISE;
  const ecosystem = content.ecosystem || DEFAULT_ECOSYSTEM;
  const team = content.team || DEFAULT_TEAM;
  const collaboration = content.collaboration || DEFAULT_COLLABORATION;

  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900 selection:bg-primary-100">
      <MarketingNavbar />
      
      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center overflow-hidden pt-32 text-center px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-primary-100 via-white to-white"></div>
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
          <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
            <HeartPulse className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-gray-900 md:text-7xl">
            {content.heroTitleLine1 || "The Experts Behind"} <br />
            <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              {content.heroTitleLine2 || "IMEDICA"}
            </span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
            {content.heroDescription || "Driven by experienced healthcare leaders, our strength lies in the unique combination of extensive clinical knowledge, technological innovation, and proven entrepreneurial acumen."}
          </p>
        </motion.div>
      </section>

      {/* Why Us / Expertise Section */}
      <section className="relative w-full border-t border-gray-100 bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">Why Us?</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              We are not just a technology company; we are a vision brought to life by dedicated healthcare leaders transforming medical training.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {expertise.map((item: any, i: number) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg transition-transform hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-primary-50 p-4 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="mb-4 text-xl font-extrabold text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative w-full py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-5xl">iMEDICA Leadership Team</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              Established by dedicated professionals with a shared vision to empower Canadians. We combined our diverse expertise to create innovative training solutions.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member: any, i: number) => (
              <motion.div 
                key={member.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl transition-all hover:-translate-y-2 hover:border-primary-300 hover:shadow-primary-100/50 flex flex-col"
              >
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary-100 to-primary-50"></div>
                
                <div className="relative pt-12 px-8 pb-8 flex flex-col flex-1 items-center text-center">
                  {member.avatarImage ? (
                    <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-4 ring-white bg-white shadow-md transition-transform group-hover:scale-110">
                      <img src={member.avatarImage} alt={member.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-600 text-3xl font-black text-white ring-4 ring-white shadow-md transition-transform group-hover:scale-110">
                      {member.name.split(' ').map((n: string) => n[0]).join('').replace('D', '')}
                    </div>
                  )}
                  
                  <h3 className="mb-1 text-xl font-extrabold text-gray-900">{member.name}</h3>
                  <p className="mb-4 text-sm font-bold tracking-wide text-primary-600">{member.role}</p>
                  
                  <p className="mb-8 text-sm leading-relaxed text-gray-600 flex-1">{member.bio}</p>
                  
                  <div className="flex items-center justify-center gap-3">
                    <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600">
                      <LinkedinIcon className="h-5 w-5" />
                    </a>
                    <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600">
                      <TwitterIcon className="h-5 w-5" />
                    </a>
                    <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600">
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Canadian Ecosystem */}
      <section className="relative w-full border-t border-gray-100 bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
                Strengthening the <br />
                <span className="text-gray-500">Canadian Ecosystem</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                IMEDICA BLS Canada is committed to contributing to the well-being of communities across the country. Our approach is designed to make a tangible difference in emergency response and public health.
              </p>
              
              <div className="space-y-4">
                {collaboration.map((item: any, i: number) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                    <div>
                      <strong className="text-gray-900">{item.label}:</strong> <span className="text-gray-600">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="space-y-4">
              {ecosystem.map((point: any, i: number) => (
                <motion.div 
                  key={point.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-5 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <div className="mt-1 flex-shrink-0">{point.icon}</div>
                  <div>
                    <h4 className="mb-1 font-bold text-gray-900">{point.title}</h4>
                    <p className="text-sm leading-relaxed text-gray-600">{point.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
