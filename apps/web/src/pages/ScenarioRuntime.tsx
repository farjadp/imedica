import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export function ScenarioRuntime() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [scenario, setScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [currentStateIdx, setCurrentStateIdx] = useState(0);
  
  const [decisionType, setDecisionType] = useState('assessment');
  const [decisionValue, setDecisionValue] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    // Load scenario and start session
    async function init() {
      try {
        const scenRes = await api.get(`/scenarios/${id}`);
        setScenario(scenRes.data.data);
        
        const sessRes = await api.post('/sessions', { scenarioId: id });
        setSessionId(sessRes.data.data.sessionId);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, [id]);

  if (!scenario || !sessionId) return <div>Loading Runtime...</div>;

  const currentState = scenario.states[currentStateIdx];

  const handleSubmitDecision = async () => {
    if (!decisionValue.trim()) return;
    try {
      const res = await api.post(`/sessions/${sessionId}/decisions`, {
        decisionType,
        decisionValue,
        timeToDecisionMs: 5000, // mock time
      });
      const data = res.data.data;
      
      setFeedbacks(prev => [...prev, {
        value: decisionValue,
        isCorrect: data.isCorrect,
        feedback: data.feedback
      }]);
      setDecisionValue('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextPhase = () => {
    if (currentStateIdx < scenario.states.length - 1) {
      setCurrentStateIdx(prev => prev + 1);
    } else {
      navigate(`/results/${sessionId}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>{scenario.title} - Runtime</h1>
      <hr />
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '2rem' }}>
          <h2>Current State (Phase {currentStateIdx + 1})</h2>
          <div style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(currentState?.patientPresentation, null, 2)}
          </div>
          
          <h3 style={{ marginTop: '2rem' }}>Make Decision</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <select value={decisionType} onChange={(e) => setDecisionType(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="assessment">Assessment</option>
              <option value="medication">Medication</option>
              <option value="procedure">Procedure</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="transport">Transport</option>
            </select>
            <input 
              type="text" 
              value={decisionValue}
              onChange={(e) => setDecisionValue(e.target.value)}
              placeholder="E.g. Administer Epi 0.3mg" 
              style={{ padding: '0.5rem', flex: 1 }}
            />
          </div>
          <button onClick={handleSubmitDecision} style={{ padding: '0.5rem 1rem', background: '#0f766e', color: 'white', border: 'none' }}>
            Submit Action
          </button>

          <div style={{ marginTop: '3rem' }}>
            <button onClick={handleNextPhase} style={{ padding: '0.5rem 1rem', background: '#b91c1c', color: 'white', border: 'none' }}>
              {currentStateIdx < scenario.states.length - 1 ? 'Advance to Next Phase' : 'End Scenario'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2>Immediate Feedback Log</h2>
          {feedbacks.length === 0 && <p>No decisions made yet.</p>}
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {feedbacks.map((f, i) => (
              <li key={i} style={{ padding: '1rem', border: '1px solid #ccc', marginBottom: '1rem', background: f.isCorrect ? '#dcfce7' : '#fee2e2' }}>
                <p><strong>Action:</strong> {f.value}</p>
                <p><strong>Result:</strong> {f.isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
                <p><strong>Feedback:</strong> {f.feedback}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
