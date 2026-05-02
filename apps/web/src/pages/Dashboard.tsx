import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Activity, Clock, Play, BookOpen } from 'lucide-react';

export function Dashboard() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/scenarios')
      .then(res => {
        setScenarios(res.data.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">Training Dashboard</h1>
          <p className="text-slate-400">Select a clinical scenario to begin your simulation session.</p>
        </div>
        <div className="glass px-4 py-2 rounded-full flex items-center gap-3 w-fit border-brand-500/20">
          <Activity className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-slate-300">Phase 2: MVP Rules Engine Active</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((s, index) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300 group cursor-pointer border-slate-800 hover:border-brand-500/50"
              onClick={() => navigate(`/scenario/${s.id}`)}
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border 
                  ${s.difficulty === 'advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    s.difficulty === 'intermediate' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-brand-500/10 text-brand-400 border-brand-500/20'}`
                }>
                  {s.difficulty.toUpperCase()}
                </span>
                
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-mono">
                  <Clock className="w-4 h-4" />
                  {s.estimatedDurationMinutes}m
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-brand-400 transition-colors">
                {s.title}
              </h3>
              
              <div className="mb-6 flex-1 flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BookOpen className="w-4 h-4" />
                  <span className="capitalize">{s.category} Pathway</span>
                </div>
              </div>
              
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl group-hover:bg-brand-500 group-hover:border-brand-400 transition-all font-medium"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch Simulator
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
