import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  {
    id: 'about', 
    label: 'About', 
    path: '#',
    dropdown: [
      { id: 'about-us', label: 'ABOUT US', path: '/about' },
      { id: 'team', label: 'Team', path: '/team' },
      { id: 'bls', label: 'Basic Life Support (BLS)', path: '/basic-life-support-bls' },
      { id: 'problem', label: 'Problem', path: '/problem' },
      { id: 'solutions', label: 'Solutions', path: '/solutions' },
    ]
  },
  { id: 'blog', label: 'Blog', path: '/blog' },
  {
    id: 'service', 
    label: 'Service', 
    path: '#',
    dropdown: [
      { id: 'mobile', label: 'Mobile Application', path: '/mobile' },
      { id: 'courses', label: 'Online Courses', path: '/courses' },
      { id: 'ai', label: 'AI-Powered Platform', path: '/ai' },
      { id: 'vr', label: 'VR Simulations', path: '/vr' },
      { id: 'pricing', label: 'Pricing', path: '/pricing' },
    ]
  },
  {
    id: 'contact', 
    label: 'Contact', 
    path: '#',
    dropdown: [
      { id: 'contact-us', label: 'Contact US', path: '/contact' },
      { id: 'hire-ca', label: 'Hire in Canada', path: '/hire-ca' },
      { id: 'hire-ir', label: 'Hire in Iran', path: '/hire-ir' },
      { id: 'download', label: 'Download APP', path: '/download' },
      { id: 'terms', label: 'Terms and Conditions', path: '/terms' },
      { id: 'privacy', label: 'Privacy Policy', path: '/privacy' },
      { id: 'disclaimer', label: 'Disclaimer', path: '/disclaimer' },
    ]
  }
];

export function MarketingNavbar(): JSX.Element {
  const { scrollY } = useScroll();
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        className="flex w-full max-w-6xl items-center justify-between rounded-full border border-gray-200 bg-white/90 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl transition-colors"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 pl-2">
          {/* Use a colored/dark logo if you have one, or text fallback */}
          <span className="text-xl font-black tracking-tight text-primary-600">IMEDICA</span>
        </Link>

        {/* Central Animated Links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <div
              key={link.id}
              onMouseEnter={() => setHoveredNav(link.id)}
              className="relative cursor-pointer px-4 py-2"
            >
              {link.path !== '#' ? (
                <Link to={link.path} className="relative z-10 flex items-center gap-1">
                  <span className={`text-sm font-semibold transition-colors duration-200 ${
                    hoveredNav === link.id ? 'text-primary-600' : 'text-gray-700'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              ) : (
                <div className="relative z-10 flex items-center gap-1">
                  <span className={`text-sm font-semibold transition-colors duration-200 ${
                    hoveredNav === link.id ? 'text-primary-600' : 'text-gray-700'
                  }`}>
                    {link.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    hoveredNav === link.id ? 'rotate-180 text-primary-600' : 'text-gray-500'
                  }`} />
                </div>
              )}

              {/* Dropdown Menu */}
              {link.dropdown && (
                <AnimatePresence>
                  {hoveredNav === link.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-1/2 top-full mt-4 w-64 -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl"
                    >
                      {link.dropdown.map((sublink) => (
                        <Link
                          key={sublink.id}
                          to={sublink.path}
                          className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                        >
                          {sublink.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="hidden items-center gap-4 pr-1 md:flex">
          <Link to="/login" className="text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900">
            Log in
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              className="relative overflow-hidden rounded-full bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-primary-700"
            >
              Dashboard
            </Link>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map(link => (
                <div key={link.id} className="flex flex-col">
                  {link.path !== '#' ? (
                    <Link to={link.path} className="px-4 py-3 font-bold text-gray-900">{link.label}</Link>
                  ) : (
                    <div className="px-4 py-3 font-bold text-gray-900">{link.label}</div>
                  )}
                  
                  {link.dropdown && (
                    <div className="ml-4 flex flex-col border-l-2 border-gray-100 pl-4">
                      {link.dropdown.map(sublink => (
                        <Link key={sublink.id} to={sublink.path} className="py-2 text-sm text-gray-600">
                          {sublink.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <hr className="my-2 border-gray-100" />
              <Link to="/login" className="px-4 py-3 font-bold text-gray-900">Log in</Link>
              <Link to="/register" className="px-4 py-3 font-bold text-primary-600">Dashboard</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
