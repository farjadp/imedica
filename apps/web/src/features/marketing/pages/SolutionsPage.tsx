import { motion } from 'framer-motion';
import { BrainCircuit, Globe, ShieldCheck, UserCheck, Zap } from 'lucide-react';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

export function SolutionsPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900 selection:bg-primary-100">
      <MarketingNavbar />
      
      {/* --- Centered Hero Section --- */}
      <section className="relative flex w-full flex-col items-center justify-center pt-48 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent opacity-80 pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-600">
            Innovative Solutions
          </div>
          
          <h1 className="mb-8 text-5xl font-black tracking-tighter text-gray-900 md:text-7xl leading-[1.1]">
            Revolutionizing BLS Training with <span className="bg-gradient-to-r from-blue-600 to-primary-500 bg-clip-text text-transparent">Technology.</span>
          </h1>
          
          <p className="max-w-3xl text-xl leading-relaxed text-gray-600 font-medium">
            We leverage cutting-edge technology to empower individuals and organizations with the skills and confidence to respond effectively in life-threatening emergencies.
          </p>
        </motion.div>
      </section>

      {/* --- Bento Box Feature Grid --- */}
      <section className="relative w-full pb-32 pt-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            
            {/* Bento Block 1: AI Platform (Large) */}
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
                <h3 className="mb-4 text-3xl font-black text-gray-900">AI-Powered Platform</h3>
                <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                  Our AI-driven platform personalizes the learning experience by analyzing individual performance data and providing targeted feedback. It identifies areas of excellence and improvement, optimizing training efficiency.
                </p>
              </div>
              
              <div className="absolute -right-20 -bottom-20 w-[120%] md:w-auto md:right-0 md:bottom-0 md:left-auto md:top-20 z-0 transition-transform duration-700 group-hover:scale-[1.02]">
                <img
                  src="/images/ai_coaching_mockup_v3.png"
                  alt="AI Platform"
                  className="w-full max-w-lg object-contain shadow-2xl rounded-tl-2xl border-t border-l border-white/20"
                />
              </div>
            </motion.div>

            {/* Bento Block 2: VR Simulations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-gray-900 border border-gray-800 p-8 md:p-10 transition-all hover:shadow-2xl"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 backdrop-blur-md">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-white">VR Simulations</h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                  Transport learners into realistic, high-pressure medical scenarios for safe, immersive muscle-memory development.
                </p>
              </div>
            </motion.div>

            {/* Bento Block 3: Rural Challenges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-blue-50 border border-blue-100 p-8 md:p-10 transition-all hover:shadow-lg hover:border-blue-200"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-gray-900">Overcoming Borders</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  Canada’s vast geography presents unique challenges. Our online and VR-based solutions overcome these geographical barriers.
                </p>
              </div>
            </motion.div>

            {/* Bento Block 4: Bystander & Culture (Spans 2 columns) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 grid md:grid-cols-2 gap-8 overflow-hidden rounded-[2.5rem] bg-white border border-gray-200 p-8 md:p-10 transition-all hover:shadow-xl"
            >
              <div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Bystander Intervention</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Our engaging training methods aim to increase the number of Canadians who are confident and willing to perform BLS, potentially saving thousands of lives each year.
                </p>
              </div>
              
              <div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Culture of Safety</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  By empowering individuals and organizations with life-saving skills, we contribute to a broader culture of safety and preparedness in Canada.
                </p>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
