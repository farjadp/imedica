import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Activity, ArrowRight, Lock } from 'lucide-react';

export function Login() {
  // Configured to match the `seed.ts` demo paramedic
  const [email, setEmail] = useState('paramedic@imedica.local');
  const [password, setPassword] = useState('Paramedic2026!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.data.user, res.data.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid credentials. Check your email or password.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email: 'paramedic@imedica.local', password: 'Paramedic2026!' });
      login(res.data.data.user, res.data.data.accessToken);
      // Hardcoded UUID from seed.ts for the Cardiac Arrest Demo scenario
      navigate('/sim/11111111-1111-1111-1111-111111111111');
    } catch (err: any) {
      setError('Failed to launch Demo mode. Is the backend running?');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-brand-400" />
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-2">
            <Activity className="w-6 h-6 text-brand-400" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Access Imedica</h1>
          <p className="text-sm text-slate-400 mt-2">Sign in to continue your clinical training.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all placeholder:text-slate-600"
              placeholder="name@paramedicservice.ca"
              autoComplete="email"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <a href="#" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</a>
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all placeholder:text-slate-600"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full relative group px-8 py-3.5 bg-brand-500 text-white font-semibold rounded-xl overflow-hidden hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? 'Authenticating...' : 'Sign In'} 
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-sm text-slate-400 text-center mb-4">Want to try the app instantly?</p>
          <button 
            type="button" 
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full px-8 py-3.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Run Demo Scenario
            <Activity className="w-4 h-4 text-brand-400" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
