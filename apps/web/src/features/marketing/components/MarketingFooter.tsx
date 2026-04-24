import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function MarketingFooter(): JSX.Element {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050505] pt-32 pb-12">
      <div className="mx-auto max-w-[1400px] px-8">
        
        {/* Top CTA & Metrics Section */}
        <div className="mb-24 grid gap-16 border-b border-white/10 pb-24 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 text-5xl font-extrabold tracking-tighter text-white">
              Ready to elevate <br /> your service?
            </h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:gap-16">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-2 block text-5xl font-bold text-primary-500">10k+</span>
              <span className="text-sm font-medium uppercase tracking-wider text-white/70">Scenarios Run</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="mb-2 block text-5xl font-bold text-info-500">100%</span>
              <span className="text-sm font-medium uppercase tracking-wider text-white/70">PHIPA Compliant</span>
            </motion.div>
          </div>
        </div>

        {/* Main Footer Navigation Grid */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Column 1: Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-6 flex items-center gap-2">
              <img 
                src="/imedica-newlogo-wh1.png" 
                alt="Imedica Logo" 
                className="h-8 w-auto object-contain opacity-90"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              The ultimate AI-driven simulator designed exclusively for paramedics. Train for high-acuity calls without the real-world risk.
            </p>
            <div className="mt-8 flex gap-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="flex flex-col gap-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">Product</h3>
            <Link to="/features" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Platform Features</Link>
            <Link to="/scenarios" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Clinical Scenarios</Link>
            <Link to="/product" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Our Solution</Link>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">Resources</h3>
            <Link to="/roadmap" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Roadmap</Link>
            <a href="#" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Help Center</a>
            <a href="#" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Case Studies</a>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col gap-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">Company</h3>
            <Link to="/about" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">About Us</Link>
            <Link to="/contact" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Contact</Link>
            <a href="#" className="text-sm font-medium text-white/70 transition-colors hover:text-primary-400">Careers</a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-24 flex flex-col items-center justify-between border-t border-white/10 pt-8 text-sm text-white/70 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Imedica. All rights reserved.</p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <a href="#" className="transition-colors hover:text-white">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-white">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-white">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
