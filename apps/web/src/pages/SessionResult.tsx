import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export function SessionResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    api.get(`/sessions/${sessionId}/results`)
      .then(res => setResults(res.data.data))
      .catch(err => console.error(err));
  }, [sessionId]);

  if (!results) return <div>Loading Results...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Session Complete</h1>
      <hr />
      
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <h2 style={{ fontSize: '4rem', margin: 0, color: results.score >= 80 ? '#15803d' : '#b91c1c' }}>
          {results.score}%
        </h2>
        <p>Total Correct: {results.correctDecisions} / {results.totalDecisions}</p>
      </div>

      <h2>Decision Breakdown</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {results.decisions.map((d: any, i: number) => (
          <li key={i} style={{ padding: '1rem', borderLeft: `4px solid ${d.isCorrect ? '#15803d' : '#b91c1c'}`, marginBottom: '1rem', background: '#f8fafc' }}>
            <strong>Phase {d.stateOrder}:</strong> {d.decisionType} - {typeof d.decisionValue === 'object' ? JSON.stringify(d.decisionValue) : d.decisionValue}
            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
              {d.isCorrect ? '✅ Protocol Aligned' : '❌ Protocol Deviation'}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '0.75rem 1.5rem', background: '#0284c7', color: 'white', border: 'none' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
