import { motion } from 'framer-motion';
import { Activity, AlertOctagon, BrainCircuit, HeartPulse, MapPin, Target } from 'lucide-react';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

export function ProblemPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900 selection:bg-red-100">
      <MarketingNavbar />
      
      {/* --- Centered Hero Section --- */}
      <section className="relative flex w-full flex-col items-center justify-center pt-48 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50 via-white to-transparent opacity-80 pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-bold text-red-600">
            The Current Reality
          </div>
          
          <h1 className="mb-8 text-5xl font-black tracking-tighter text-gray-900 md:text-7xl leading-[1.1]">
            Addressing the Urgent Need for <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Enhanced BLS</span> Training.
          </h1>
          
          <p className="max-w-3xl text-xl leading-relaxed text-gray-600 font-medium">
            The limitations of traditional methods contribute to inadequate emergency response, leading to preventable deaths and disabilities across Canada.
          </p>
        </motion.div>
      </section>

      {/* --- Bento Box Feature Grid --- */}
      <section className="relative w-full pb-32 pt-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            
            {/* Bento Block 1: The Canadian Context (Large) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 group relative overflow-hidden rounded-[2.5rem] bg-gray-900 border border-gray-800 p-8 md:p-12 transition-all hover:shadow-2xl"
            >
              <div className="relative z-10 max-w-lg">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="mb-4 text-3xl font-black text-white">40,000 Cardiac Arrests Annually</h3>
                <p className="text-gray-400 mb-8 leading-relaxed font-medium">
                  Cardiac arrest is a major health concern in Canada. A staggering 80-85% of these events occur outside of hospital settings, making immediate bystander intervention absolutely crucial for survival.
                </p>
              </div>
              <div className="absolute -right-20 -bottom-20 w-[120%] md:w-auto md:right-10 md:bottom-10 md:left-auto md:top-auto z-0 opacity-10 pointer-events-none">
                <HeartPulse className="h-96 w-96 text-white" />
              </div>
            </motion.div>

            {/* Bento Block 2: Time Sensitivity */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-red-50 border border-red-100 p-8 md:p-10 transition-all hover:shadow-xl hover:border-red-200"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertOctagon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-gray-900">Critical Time Drop</h3>
                <p className="text-gray-700 font-medium leading-relaxed">
                  For every minute without CPR or defibrillation, survival chances drop significantly.
                </p>
              </div>
              <div className="mt-8 rounded-2xl bg-white p-4 border border-red-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Per Minute</span>
                  <span className="text-3xl font-black text-red-600">-10%</span>
                </div>
              </div>
            </motion.div>

            {/* Bento Block 3: Skill Decay */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group overflow-hidden rounded-[2.5rem] bg-gray-50 border border-gray-200 p-8 md:p-10 transition-all hover:shadow-lg"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-black text-gray-900">Rapid Skill Decay</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Traditional BLS training relies on infrequent, classroom-based instruction, leading to rapid skill decay. This lack of practice causes a decline in confidence and proficiency during real emergencies.
              </p>
            </motion.div>

            {/* Bento Block 4: Accessibility & Realism (Spans 2 columns) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 flex flex-col md:flex-row items-start md:items-center gap-8 overflow-hidden rounded-[2.5rem] bg-white border border-gray-200 p-8 md:p-10 transition-all hover:shadow-xl"
            >
              <div className="flex-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-gray-900">Accessibility Barriers</h3>
                <p className="text-gray-600 font-medium leading-relaxed mb-4">
                  Access to quality BLS training is unevenly distributed across Canada, with challenges related to cost, time, and geographical limitations in remote communities.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 w-fit px-4 py-2 rounded-lg">
                  <Target className="h-4 w-4" />
                  Ineffective Knowledge Transfer
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
