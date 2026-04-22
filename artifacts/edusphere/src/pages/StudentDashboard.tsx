
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastContainer } from '@/components/Toast';
import { storage, Exam, Result, Student } from '@/lib/storage';

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  const [student, setStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!storage.isStudentLoggedIn()) { navigate('/'); return; }
    const s = storage.getCurrentStudent();
    if (!s) { navigate('/'); return; }
    setStudent(s);
    const allExams = storage.getExams().filter(e => e.class === s.class);
    setExams(allExams);
    setResults(storage.getResultsForStudent(s.name, s.phone));
  }, []);

  const handleLogout = () => {
    storage.logoutStudent();
    navigate('/');
  };

  const startExam = (exam: Exam) => {
    navigate(`/exam?id=${exam.id}`);
  };

  const getExamResult = (examId: string) => {
    return results.find(r => r.examId === examId);
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 70) return '#48c78e';
    if (pct >= 50) return '#f0c040';
    return '#ff6b6b';
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <ToastContainer />
      <Navbar
        title="Student Dashboard"
        showLogout
        onLogout={handleLogout}
        rightContent={
          <button
            className="btn-outline"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            onClick={() => navigate('/leaderboard')}
          >
            🏆 Leaderboard
          </button>
        }
      />

      <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Greeting */}
        <div className="glass" style={{ padding: '1.75rem 2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ color: 'rgba(201,184,255,0.6)', fontSize: '0.88rem', marginBottom: '0.25rem' }}>Welcome back,</p>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.75rem', color: '#c9b8ff' }}>
                {student?.name}
              </h2>
              <p style={{ color: '#7ec8e3', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                📚 {student?.class}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '2rem', color: '#c9b8ff' }}>{results.length}</div>
              <div style={{ color: 'rgba(201,184,255,0.55)', fontSize: '0.82rem' }}>Exams Taken</div>
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.3rem', color: '#c9b8ff', marginBottom: '1.25rem' }}>
            📝 Available Exams
          </h2>

          {exams.length === 0 ? (
            <div className="glass empty-state">
              <span className="empty-icon">📋</span>
              <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.95rem' }}>No exams available for {student?.class} yet.</p>
              <p style={{ color: 'rgba(201,184,255,0.35)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Check back later!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {exams.map(exam => {
                const result = getExamResult(exam.id);
                return (
                  <div key={exam.id} className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'Poppins', fontWeight: '600', color: 'rgba(230,225,255,0.95)', fontSize: '1rem', marginBottom: '0.4rem' }}>
                        {exam.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.82rem', color: 'rgba(201,184,255,0.6)', flexWrap: 'wrap' }}>
                        <span>⏱ {exam.timerMinutes} min</span>
                        <span>❓ {exam.questions.length} questions</span>
                      </div>
                    </div>

                    {result ? (
                      <div>
                        <div style={{
                          background: `rgba(${result.percentage >= 70 ? '72,199,142' : result.percentage >= 50 ? '240,192,64' : '255,107,107'}, 0.1)`,
                          border: `1px solid rgba(${result.percentage >= 70 ? '72,199,142' : result.percentage >= 50 ? '240,192,64' : '255,107,107'}, 0.3)`,
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: getScoreColor(result.percentage), fontSize: '0.85rem', fontWeight: '600' }}>
                            {result.score}/{result.total} ({result.percentage}%)
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(201,184,255,0.4)' }}>Completed</span>
                        </div>
                        <button
                          className="btn-outline"
                          style={{ width: '100%', padding: '0.5rem' }}
                          onClick={() => startExam(exam)}
                        >
                          Retake Exam
                        </button>
                      </div>
                    ) : (
                      <button className="btn-primary" style={{ width: '100%', padding: '0.6rem' }} onClick={() => startExam(exam)}>
                        Start Exam →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Results */}
        <div>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.3rem', color: '#c9b8ff', marginBottom: '1.25rem' }}>
            📊 My Results
          </h2>

          {results.length === 0 ? (
            <div className="glass empty-state">
              <span className="empty-icon">🎯</span>
              <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.95rem' }}>No results yet. Take an exam to see your scores!</p>
            </div>
          ) : (
            <div className="glass" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201,184,255,0.12)' }}>
                      {['Exam', 'Score', '%', 'Date'].map(h => (
                        <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', color: 'rgba(201,184,255,0.6)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(201,184,255,0.06)' }}>
                        <td style={{ padding: '0.85rem 1rem', color: 'rgba(230,225,255,0.9)', fontSize: '0.9rem' }}>{r.examTitle}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'rgba(201,184,255,0.7)', fontSize: '0.9rem' }}>{r.score}/{r.total}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            color: getScoreColor(r.percentage),
                            fontWeight: '700',
                            fontSize: '0.9rem'
                          }}>
                            {r.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'rgba(201,184,255,0.45)', fontSize: '0.82rem' }}>
                          {new Date(r.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard CTA */}
        {results.length > 0 && results.length < 5 && (
          <div className="glass" style={{ padding: '1.25rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#f0c040', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                🏆 {5 - results.length} more exam{5 - results.length !== 1 ? 's' : ''} to unlock the leaderboard!
              </p>
              <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.8rem' }}>Complete 5 exams to appear on the class leaderboard.</p>
            </div>
            <div style={{
              background: 'rgba(240,192,64,0.1)',
              border: '1px solid rgba(240,192,64,0.3)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#f0c040',
              fontWeight: '700',
              fontSize: '1.2rem'
            }}>
              {results.length}/5
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
