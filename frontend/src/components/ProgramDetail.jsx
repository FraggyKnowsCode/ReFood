import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const ProgramDetail = () => {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/programs/${id}`);
        setProgram(res.data);
      } catch (err) {
        setError('Failed to load program details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="loader" style={{ margin: '2rem auto' }}></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!program) return null;

  return (
    <div className="fade-in">
      <Link to="/programs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Programs
      </Link>
      
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent-color)' }}>{program.program_name}</h1>
        <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
          {program.start_date} &mdash; {program.end_date}
        </p>
        <div>
          <strong>Organizations:</strong> {program.participating_organizations}
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'inline-block' }}>
          <strong>Average Rating:</strong> 
          <span style={{ fontSize: '1.5rem', marginLeft: '0.5rem', color: 'var(--success-color)' }}>
            {program.average_rating ? program.average_rating.toFixed(1) : 'N/A'} / 5
          </span>
        </div>
      </div>

      <div className="glass-card">
        <h3>Community Feedback</h3>
        <hr style={{ borderColor: 'var(--glass-border)', margin: '1rem 0 2rem 0' }} />
        
        {program.feedback && program.feedback.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {program.feedback.map(fb => (
              <div key={fb.id} style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{fb.users?.first_name} {fb.users?.last_name}</strong>
                  <span style={{ color: 'var(--warning-color)' }}>Rating: {fb.rating}/5</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{fb.comments}</p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                  {new Date(fb.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No feedback available yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProgramDetail;
