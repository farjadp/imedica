import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import { MarketingFooter } from '../components/MarketingFooter.js';
import { MarketingNavbar } from '../components/MarketingNavbar.js';

export function ContactUsPage(): JSX.Element {
  return (
    <main className="relative min-h-screen w-full bg-background text-text selection:bg-primary-500/30">
      <MarketingNavbar />
      
      <section className="relative flex min-h-screen w-full items-center pt-32 lg:pt-0">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/contact_map.png" 
            alt="Global Network" 
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1200px] gap-16 px-8 lg:grid-cols-2 lg:gap-32">
          {/* Left: Info */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center"
          >
            <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
              Get in touch.
            </h1>
            <p className="mb-12 text-xl leading-relaxed text-text-muted">
              We are currently onboarding 10-15 early-adopter EMS training departments for our pilot program. Want to see if Imedica is right for your service?
            </p>

            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-primary-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">Email Us</p>
                  <a href="mailto:info@imedica.tech" className="text-lg font-medium text-white hover:text-primary-400">info@imedica.tech</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-primary-500">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">Call Us</p>
                  <a href="tel:6477173978" className="text-lg font-medium text-white hover:text-primary-400">(647) 717-3978</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-primary-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">Location</p>
                  <p className="text-lg font-medium text-white">Toronto, Ontario, Canada</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl"
          >
            <h3 className="mb-6 text-2xl font-bold text-white">Request a Demo Pilot</h3>
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="First Name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-muted outline-none focus:border-primary-500" />
                <input type="text" placeholder="Last Name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-muted outline-none focus:border-primary-500" />
              </div>
              <input type="email" placeholder="Work Email" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-muted outline-none focus:border-primary-500" />
              <input type="text" placeholder="EMS Service / Organization" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-muted outline-none focus:border-primary-500" />
              <textarea placeholder="Tell us about your current training workflow..." rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-text-muted outline-none focus:border-primary-500 resize-none" />
              
              <button className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 font-bold text-white transition-colors hover:bg-primary-500">
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
