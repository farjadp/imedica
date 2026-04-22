import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { id: 'about', label: 'About Us', path: '/about' },
  { id: 'product', label: 'Product', path: '/product' },
  { id: 'scenarios', label: 'Scenarios', path: '/scenarios' },
  { id: 'roadmap', label: 'Roadmap', path: '/roadmap' },
  { id: 'contact', label: 'Contact', path: '/contact' },
];

export function MarketingNavbar(): JSX.Element {
  const { scrollY } = useScroll();
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > lastScrollY && latest > 150) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
    setLastScrollY(latest);
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1, scale: 1 },
        hidden: { y: -50, opacity: 0, scale: 0.95 }
      }}
      animate={isNavHidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-6 z-[100] flex justify-center px-4"
    >
      <nav 
        onMouseLeave={() => setHoveredNav(null)}
        className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-black/60 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 pl-2">
          <img 
            src="/imedica-newlogo-wh1.png" 
            alt="Imedica Logo" 
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Central Animated Links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              to={link.path}
              key={link.id}
              onMouseEnter={() => setHoveredNav(link.id)}
              className="relative cursor-pointer px-4 py-2"
            >
              <div className="relative z-10 flex items-center gap-1">
                <span className={`text-sm font-semibold transition-colors duration-200 ${
                  hoveredNav === link.id ? 'text-white' : 'text-white/60'
                }`}>
                  {link.label}
                </span>
              </div>
              {/* Sliding Background Pill */}
              {hoveredNav === link.id && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 z-0 rounded-full bg-white/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-4 pr-1">
          <Link to="/login" className="hidden text-sm font-semibold text-white/70 transition-colors hover:text-white md:block">
            Log in
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              className="relative overflow-hidden rounded-full bg-white px-5 py-2 text-sm font-bold text-black shadow-lg"
            >
              <span className="relative z-10">Start Free</span>
              <div className="absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-500 hover:translate-x-[100%]" />
            </Link>
          </motion.div>
        </div>
      </nav>
    </motion.div>
  );
}
