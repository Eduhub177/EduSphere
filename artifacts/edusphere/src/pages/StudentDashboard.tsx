
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastContainer } from '@/components/Toast';
import { storage, Exam, Result, Student } from '@/lib/storage';

function TrendChart({ results }: { results: Result[] }) {
  if (results.length < 2) return null;

  const sorted = [...results].sort((a, b) => a.timestamp - b.timestamp);
  const values = sorted.map(r => r.percentage);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 480;
  const H = 90;
  const PAD = 14;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;

  const pts = values.map((v, i) => ({
    x: PAD + (i / (values.length - 1)) * chartW,
    y: PAD + chartH - ((v - min) / range) * chartH,
    pct: v,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  const areaPath =
    `M${pts[0].x},${H - PAD} ` +
    pts.map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${pts[pts.length - 1].x},${H - PAD} Z`;

  const last = pts[pts.length - 1];
  const trend = values[values.length - 1] - values[0];
  const trendColor = trend >= 0 ? '#48c78e' : '#ff6b6b';

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ color: 'rgba(201,184,255,0.6)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Score Trend
        </span>
        <span style={{ color: trendColor, fontSize: '0.82rem', fontWeight: '700' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% overall
        </span>
      </div>
      <div style={{ background: 'rgba(201,184,255,0.04)', borderRadius: '12px', padding: '0.5rem', border: '1px solid rgba(201,184,255,0.08)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map(pct => {
            const y = PAD + chartH - ((pct - min) / range) * chartH;
            if (y < PAD || y > H - PAD) return null;
            return (
              <g key={pct}>
                <line x1={PAD} y1={y} x2={W - PAD} y2={y}
                  stroke="rgba(201,184,255,0.07)" strokeWidth="1" strokeDasharray="3,4" />
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <polyline points={polyline}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {pts.map((p, i) => {
            const c = p.pct >= 70 ? '#48c78e' : p.pct >= 50 ? '#f0c040' : '#ff6b6b';
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="#1a1a2e" stroke={c} strokeWidth="2" />
                {/* Score label above dot */}
                <text x={p.x} y={p.y - 9} textAnchor="middle"
                  fill={c} fontSize="9" fontFamily="Inter" fontWeight="700">
                  {p.pct}%
                </text>
              </g>
            );
          })}

          {/* Latest dot pulse ring */}
          <circle cx={last.x} cy={last.y} r="9"
            fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" />
        </svg>

        {/* X-axis dates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 14px', marginTop: '2px' }}>
          {sorted.map((r, i) => (
            <span key={i} style={{ color: 'rgba(201,184,255,0.3)', fontSize: '0.6rem' }}>
              {new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'rgba(201,184,255,0.04)',
      border: '1px solid rgba(201,184,255,0.1)',
      borderRadius: '12px',
      padding: '1rem',
      textAlign: 'center',
      flex: 1,
      minWidth: '80px',
    }}>
      <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.5rem', color: color || '#c9b8ff', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.72rem', marginTop: '0.3rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      {sub && <div style={{ color: 'rgba(201,184,255,0.3)', fontSize: '0.68rem', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  const [student, setStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');

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

  const getExamResult = (examId: string) => results.find(r => r.examId === examId);

  const getScoreColor = (pct: number) => {
    if (pct >= 70) return '#48c78e';
    if (pct >= 50) return '#f0c040';
    return '#ff6b6b';
  };

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;
  const bestScore = results.length ? Math.max(...results.map(r => r.percentage)) : 0;
  const sortedResults = [...results].sort((a, b) => b.timestamp - a.timestamp);

  const tabStyle = (tab: 'exams' | 'results') => ({
    padding: '0.55rem 1.4rem',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'rgba(167,139,250,0.18)' : 'transparent',
    color: activeTab === tab ? '#c9b8ff' : 'rgba(201,184,255,0.45)',
    borderBottom: activeTab === tab ? '2px solid #a78bfa' : '2px solid transparent',
  } as React.CSSProperties);

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
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <StatCard label="Exams" value={String(results.length)} />
              <StatCard label="Avg Score" value={results.length ? `${avgScore}%` : '—'} color={results.length ? getScoreColor(avgScore) : undefined} />
              <StatCard label="Best" value={results.length ? `${bestScore}%` : '—'} color={results.length ? getScoreColor(bestScore) : undefined} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(201,184,255,0.1)', paddingBottom: '0' }}>
          <button style={tabStyle('exams')} onClick={() => setActiveTab('exams')}>
            📝 Available Exams
          </button>
          <button style={tabStyle('results')} onClick={() => setActiveTab('results')}>
            📊 My Results {results.length > 0 && <span style={{ marginLeft: '0.35rem', background: 'rgba(167,139,250,0.25)', borderRadius: '10px', padding: '0.05rem 0.45rem', fontSize: '0.75rem' }}>{results.length}</span>}
          </button>
        </div>

        {/* ── Tab: Available Exams ── */}
        {activeTab === 'exams' && (
          <div>
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
                          <button className="btn-outline" style={{ width: '100%', padding: '0.5rem' }} onClick={() => startExam(exam)}>
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
                  background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)',
                  borderRadius: '8px', padding: '0.5rem 1rem', color: '#f0c040', fontWeight: '700', fontSize: '1.2rem'
                }}>
                  {results.length}/5
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: My Results ── */}
        {activeTab === 'results' && (
          <div>
            {results.length === 0 ? (
              <div className="glass empty-state">
                <span className="empty-icon">🎯</span>
                <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.95rem' }}>No results yet. Take an exam to see your scores!</p>
              </div>
            ) : (
              <>
                {/* Trend chart */}
                <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                  <TrendChart results={results} />

                  {/* Summary row */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <StatCard label="Total Exams" value={String(results.length)} />
                    <StatCard label="Avg Score" value={`${avgScore}%`} color={getScoreColor(avgScore)} />
                    <StatCard label="Best Score" value={`${bestScore}%`} color={getScoreColor(bestScore)} />
                    <StatCard
                      label="Trend"
                      value={
                        results.length < 2 ? '—'
                          : results[results.length - 1].percentage >= results[0].percentage ? '▲ Up' : '▼ Down'
                      }
                      color={
                        results.length < 2 ? undefined
                          : results[results.length - 1].percentage >= results[0].percentage ? '#48c78e' : '#ff6b6b'
                      }
                    />
                  </div>
                </div>

                {/* Result cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {sortedResults.map((r, i) => {
                    const color = getScoreColor(r.percentage);
                    const barW = r.percentage;
                    return (
                      <div key={i} className="glass" style={{ padding: '1.1rem 1.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '140px' }}>
                            <div style={{ fontFamily: 'Poppins', fontWeight: '600', color: 'rgba(230,225,255,0.92)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                              {r.examTitle}
                            </div>
                            <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.75rem' }}>
                              {new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' · '}
                              {new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {r.exitViolation && (
                              <div style={{ color: '#ff6b6b', fontSize: '0.72rem', marginTop: '0.2rem', fontWeight: '600' }}>
                                ⚠️ Anti-cheat violation
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.35rem', color, lineHeight: 1 }}>
                              {r.percentage}%
                            </div>
                            <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                              {r.score}/{r.total} correct
                            </div>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div style={{ height: '4px', background: 'rgba(201,184,255,0.07)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.75rem' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
