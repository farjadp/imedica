import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Activity, Thermometer, HeartPulse, ShieldAlert, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export function ScenarioRuntime() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [scenario, setScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStateIdx, setCurrentStateIdx] = useState(0);
  
  const [decisionType, setDecisionType] = useState('medication');
  const [decisionValue, setDecisionValue] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const scenRes = await api.get(`/scenarios/${id}`);
        setScenario(scenRes.data.data);
        const sessRes = await api.post('/sessions', { scenarioId: id });
        setSessionId(sessRes.data.data.sessionId);
        console.log(`[Imedica Demo] Scenario Started: ${scenRes.data.data.title} (Session: ${sessRes.data.data.sessionId})`);
      } catch (err: any) {
        console.error('[Imedica Demo] Failed to load scenario:', err);
        alert('Failed to boot scenario. Ensure backend is running.');
      }
    }
    init();
  }, [id]);

  // Auto-scroll feedback log
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedbacks]);

  if (!scenario || !sessionId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 text-brand-500 animate-pulse mb-4" />
        <p className="text-slate-400 font-mono">Initializing Simulation Environment...</p>
      </div>
    );
  }

  const currentState = scenario.states[currentStateIdx];

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionValue.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const res = await api.post(`/sessions/${sessionId}/decisions`, {
        decisionType,
        decisionValue,
        timeToDecisionMs: 5000, 
      });
      
      const data = res.data.data;
      setFeedbacks(prev => [...prev, {
        type: decisionType,
        value: decisionValue,
        isCorrect: data.isCorrect,
        feedback: data.feedback
      }]);
      console.log(`[Imedica Demo] Action Submitted: [${decisionType}] ${decisionValue} -> Correct: ${data.isCorrect}`);
      setDecisionValue('');
    } catch (err) {
      console.error('[Imedica Demo] Failed to submit decision:', err);
      alert('Error submitting action to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextPhase = () => {
    if (currentStateIdx < scenario.states.length - 1) {
      setCurrentStateIdx(prev => prev + 1);
      console.log(`[Imedica Demo] Advanced to Phase: ${currentStateIdx + 2}`);
    } else {
      console.log(`[Imedica Demo] Scenario Completed!`);
      navigate(`/results/${sessionId}`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{scenario.title}</h1>
          <div className="flex items-center gap-4 mt-2 font-mono text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-red-400"/> Critical Scenario</span>
            <span>|</span>
            <span>Phase {currentStateIdx + 1} of {scenario.states.length}</span>
          </div>
        </div>
        <button 
          onClick={handleNextPhase}
          className="px-6 py-2.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-colors font-medium flex items-center gap-2"
        >
          {currentStateIdx < scenario.states.length - 1 ? 'Advance Phase' : 'End Scenario'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-6 min-h-0">
        
        {/* Left Col: Patient Data & Controls */}
        <div className="flex flex-col gap-6 min-h-0 overflow-y-auto pr-2 pb-6">
          
          <div className="bg-brand-500/10 border border-brand-500/20 text-brand-300 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-3">
            <Activity className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Review the patient presentation below and immediately submit your first clinical action to stabilize.</p>
          </div>

          <motion.div 
            key={`state-${currentStateIdx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0"
          >
            <div className="glass-card rounded-2xl p-6 border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-brand-400" /> 
                Clinical Presentation
              </h2>
              
              <div className="bg-slate-950 rounded-xl p-6 font-mono text-slate-300 whitespace-pre-wrap border border-slate-900 leading-relaxed text-sm lg:text-base">
                {JSON.stringify(currentState?.patientPresentation, null, 2).replace(/[}{\"]/g, '')}
              </div>
            </div>
          </motion.div>

          <div className="glass-card rounded-2xl p-6 border-slate-800 mt-auto">
             <h2 className="text-lg font-semibold text-white mb-4">What is your next action?</h2>
             <form onSubmit={handleSubmitDecision} className="flex flex-col sm:flex-row gap-4">
                <select 
                  value={decisionType} 
                  onChange={(e) => setDecisionType(e.target.value)} 
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none sm:w-48"
                >
                  <option value="medication">Medication</option>
                  <option value="procedure">Procedure</option>
                  <option value="assessment">Assessment</option>
                </select>

                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={decisionValue}
                    onChange={(e) => setDecisionValue(e.target.value)}
                    placeholder="E.g., 'Epinephrine 1mg' or 'Start CPR'" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-slate-600 font-mono text-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !decisionValue.trim()}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-400 disabled:opacity-50 transition-colors"
                  >
                    Submit Action
                  </button>
                </div>
             </form>
          </div>
        </div>

        {/* Right Col: Instant Feedback Log */}
        <div className="glass-card flex flex-col rounded-2xl border-slate-800 overflow-hidden min-h-0">
          <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Action Log</h2>
            <div className="px-2 py-1 bg-slate-800 text-xs font-mono text-slate-400 rounded">Live Evaluation</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {feedbacks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                  <Thermometer className="w-8 h-8 mb-2 opacity-50" />
                  <p>Awaiting clinical intercepts...</p>
                </div>
              ) : (
                feedbacks.map((f, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl border ${
                      f.isCorrect 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                       <span className="text-xs uppercase tracking-wider font-bold text-slate-400">{f.type}</span>
                       {f.isCorrect ? (
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       ) : (
                         <XCircle className="w-4 h-4 text-red-500" />
                       )}
                    </div>
                    <p className="text-white font-mono text-sm mb-3">"{f.value}"</p>
                    <div className={`text-xs font-medium pl-3 border-l-2 ${f.isCorrect ? 'text-emerald-400 border-emerald-500/50' : 'text-red-400 border-red-500/50'}`}>
                      {f.feedback}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
