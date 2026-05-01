import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, HeartPulse, PhoneCall, Shield, Wind } from 'lucide-react';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

const ABC = [
  { letter: 'A', title: 'Airway', description: 'Ensuring the airway is open and clear.', icon: <Wind className="h-6 w-6" /> },
  { letter: 'B', title: 'Breathing', description: 'Supporting or restoring breathing.', icon: <Activity className="h-6 w-6" /> },
  { letter: 'C', title: 'Circulation', description: 'Maintaining blood circulation.', icon: <HeartPulse className="h-6 w-6" /> },
];

const WHEN_NEEDED = [
  {
    title: 'Cardiac Arrest',
    description: 'When the heart stops beating effectively. Immediate CPR and defibrillation are crucial.',
  },
  {
    title: 'Respiratory Arrest',
    description: 'When breathing ceases or becomes ineffective. Prompt recognition and rescue breathing are essential.',
  },
  {
    title: 'Choking',
    description: 'A foreign object obstructs the airway. Techniques like abdominal thrusts are vital.',
  },
  {
    title: 'Unresponsiveness',
    description: 'Does not respond to verbal or physical stimuli. Indicates a potentially serious medical condition.',
  },
];

const STEPS = [
  {
    step: 1,
    title: 'Call Emergency Number',
    content: [
      'Immediately dial the appropriate emergency number (911 in most of Canada).',
      'Provide your location, the situation, and the number of victims.',
      'Do not hang up until instructed.',
    ],
    icon: <PhoneCall className="h-8 w-8 text-red-500" />,
  },
  {
    step: 2,
    title: 'Check Responsiveness',
    content: [
      'Ensure the scene is safe for you and the victim.',
      'Gently tap or shake the person’s shoulder.',
      'Shout, “Are you okay?” and observe for any response.',
    ],
    icon: <Shield className="h-8 w-8 text-orange-500" />,
  },
  {
    step: 3,
    title: 'Check Breathing',
    content: [
      'Look for chest rise and fall for no more than 10 seconds.',
      'If the person is not breathing or only gasping, proceed to CPR.',
    ],
    icon: <Wind className="h-8 w-8 text-blue-500" />,
  },
  {
    step: 4,
    title: 'Perform CPR',
    content: [
      'Place the heel of one hand on the center of the chest and interlock your fingers.',
      'Compress the chest at a rate of 100-120 compressions per minute.',
      'Compress to a depth of at least 2 inches (5 cm) in adults.',
      'Continue cycles of 30 chest compressions followed by 2 rescue breaths (if trained).',
    ],
    icon: <Activity className="h-8 w-8 text-green-500" />,
  },
  {
    step: 5,
    title: 'Give Rescue Breaths (If Trained)',
    content: [
      'If trained, after opening the airway, give 2 rescue breaths.',
      'Each breath should last about 1 second and make the chest rise.',
    ],
    icon: <HeartPulse className="h-8 w-8 text-pink-500" />,
  },
  {
    step: 6,
    title: 'Turn On Side (Recovery Position)',
    content: [
      'If the person regains consciousness and breathes normally, carefully place them in the recovery position (assuming no spinal injuries).',
      'This helps keep the airway open.',
    ],
    icon: <ArrowRight className="h-8 w-8 text-purple-500" />,
  },
];

export function BlsGuidePage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-white text-gray-900 selection:bg-red-100">
      <MarketingNavbar />
      
      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center overflow-hidden pt-32 text-center px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50 via-white to-white"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-bold text-red-600">
            Life-Saving Procedures
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-gray-900 md:text-7xl">
            Basic Life Support <br />
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">(BLS)</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
            A crucial set of non-invasive interventions designed to support someone experiencing a medical emergency until advanced care arrives.
          </p>
        </motion.div>
      </section>

      {/* Warning Disclaimer */}
      <section className="relative w-full border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-8">
          <div className="flex items-start gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-orange-600" />
            <div>
              <h3 className="mb-2 font-bold text-orange-800">Important Disclaimer</h3>
              <p className="text-sm leading-relaxed text-orange-900">
                This page provides a general overview of BLS. It is <strong>not a substitute for certified training</strong>. Proper BLS training includes hands-on practice, feedback from certified instructors, and certification upon successful completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The ABCs and When Needed */}
      <section className="relative w-full py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* ABCs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-4xl">The "ABCs" of BLS</h2>
              <p className="mb-8 text-lg text-gray-600">
                The primary focus of Basic Life Support is on stabilizing a person in critical condition by ensuring their airway, breathing, and circulation are maintained.
              </p>
              <div className="space-y-4">
                {ABC.map((item) => (
                  <div key={item.letter} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-2xl font-black text-primary-600">
                      {item.letter}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* When is BLS Needed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-4xl">When is BLS Needed?</h2>
              <p className="mb-8 text-lg text-gray-600">
                BLS is typically used in severe, life-threatening emergencies where immediate intervention is required to prevent fatal outcomes.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {WHEN_NEEDED.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step by Step Guide */}
      <section className="relative w-full border-t border-gray-100 bg-gray-50 py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">Essential BLS Steps</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              A quick guide on what to do when you encounter an unresponsive individual. <br />
              <strong className="text-gray-900">Priority #1: Activate Emergency Response.</strong>
            </p>
          </div>

          <div className="space-y-8">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-xl sm:flex-row sm:items-start"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                  {step.icon}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-black text-primary-600">STEP {step.step}</span>
                    <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    {step.content.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500"></div>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Reminders */}
      <section className="relative w-full py-24 text-center">
        <div className="mx-auto max-w-4xl px-8">
          <h2 className="mb-10 text-3xl font-extrabold tracking-tight text-gray-900">Important Reminders</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <Activity className="mx-auto mb-4 h-8 w-8 text-primary-600" />
              <h3 className="mb-2 font-bold text-gray-900">Automated External Defibrillator (AED)</h3>
              <p className="text-sm text-gray-600">If an AED is available, use it as soon as possible and follow the device's prompts.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <HeartPulse className="mx-auto mb-4 h-8 w-8 text-primary-600" />
              <h3 className="mb-2 font-bold text-gray-900">Continue the Cycle</h3>
              <p className="text-sm text-gray-600">Keep performing BLS until emergency services arrive or the person recovers.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <Shield className="mx-auto mb-4 h-8 w-8 text-primary-600" />
              <h3 className="mb-2 font-bold text-gray-900">Get Certified</h3>
              <p className="text-sm text-gray-600">This guide is for informational purposes only. Enroll in a certified BLS course to learn these skills properly.</p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
