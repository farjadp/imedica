import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export function Dashboard() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/scenarios')
      .then(res => setScenarios(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Scenario Dashboard</h1>
      <hr />
      
      <h2>Available Scenarios</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {scenarios.map(s => (
          <li key={s.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h3>{s.title} ({s.difficulty})</h3>
            <p><strong>Category:</strong> {s.category}</p>
            <p><strong>Objectives:</strong> {s.learningObjectives.join(', ')}</p>
            <button 
              onClick={() => navigate(`/scenario/${s.id}`)}
              style={{ padding: '0.5rem 1rem', background: '#0284c7', color: 'white', border: 'none', marginTop: '1rem' }}
            >
              Start Scenario
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
