import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, BrainCircuit, ShieldAlert, ArrowRight } from 'lucide-react';

export function SessionResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    api.get(`/sessions/${sessionId}/results`)
      .then(res => setResults(res.data.data))
      .catch(err => console.error(err));
  }, [sessionId]);

  if (!results) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 text-brand-500 animate-pulse mb-4" />
        <p className="text-slate-400 font-mono">Compiling final analytics report...</p>
      </div>
    );
  }

  const isPass = results.score >= 80;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 lg:p-12 border-slate-800 relative overflow-hidden"
      >
        {/* Pass/Fail Header Gradient */}
        <div className={`absolute top-0 left-0 w-full h-2 ${isPass ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`} />

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
            <BrainCircuit className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Session Debrief</h1>
          <p className="text-slate-400">Simulation Complete. Review your clinical workflow.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Main Score */}
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${isPass ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm font-semibold tracking-widest text-slate-500 uppercase mb-4">Final Score</span>
            <div className="relative">
              <div className={`text-6xl lg:text-8xl font-black relative z-10 tracking-tighter ${isPass ? 'text-emerald-400' : 'text-red-400'}`}>
                {results.score}<span className="text-4xl text-slate-600">/100</span>
              </div>
            </div>
          </div>

          {/* Simple Metrics */}
          <div className="space-y-4 flex flex-col justify-center">
             <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">Correct decisions</div>
                  <div className="text-3xl font-bold text-white">{results.correctDecisions} / {results.totalDecisions}</div>
                </div>
                <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
             </div>
             
             <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">Weak area</div>
                  <div className="text-xl font-bold text-red-400 capitalize">
                    {results.decisions.find((d: any) => !d.isCorrect)?.decisionType || "None identified"}
                  </div>
                </div>
                <ShieldAlert className="w-8 h-8 text-red-500/50" />
             </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-6">Decision Audit Log</h3>
        
        <div className="space-y-3 mb-10">
          {results.decisions.map((d: any, i: number) => (
             <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${d.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${d.isCorrect ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">STATE #{d.stateOrder}</span>
                    <span className="text-sm uppercase tracking-wide font-bold text-slate-300">{d.decisionType}</span>
                  </div>
                  <p className="text-white font-mono mb-2">"{d.decisionValue}"</p>
                  <p className={`text-sm ${d.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                    {d.isCorrect ? 'Aligned with Base Hospital Directive.' : 'Deviation from standard clinical pathway.'}
                  </p>
                </div>
             </div>
          ))}
        </div>

        <div className="flex justify-center border-t border-slate-800 pt-8 mt-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="group relative px-8 py-4 bg-brand-500 text-white font-semibold rounded-xl overflow-hidden hover:scale-[1.02] transition-transform"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Return to Dashboard 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
