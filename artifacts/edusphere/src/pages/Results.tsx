
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { storage, Result, Exam } from '@/lib/storage';

export default function Results() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<Result | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    const r = storage.getLastResult();
    if (!r) { navigate('/student'); return; }
    setResult(r);
    setExam(storage.getExamById(r.examId));
  }, []);

  if (!result) return null;

  const hasViolation = result.exitViolation === true;
  const pct = result.percentage;
  const passingScore = exam?.passingScore ?? 60;
  const passed = pct >= passingScore;
  const color = pct >= 70 ? '#48c78e' : pct >= 50 ? '#f0c040' : '#ff6b6b';
  const colorBg = pct >= 70 ? 'rgba(72,199,142,0.1)' : pct >= 50 ? 'rgba(240,192,64,0.1)' : 'rgba(255,107,107,0.1)';
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
  const emoji = pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '💪';
  const message = pct >= 70 ? 'Excellent Work!' : pct >= 50 ? 'Good Effort!' : 'Keep Practicing!';

  const optLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <Navbar title="Results" />

      <div className="page-enter" style={{ maxWidth: '750px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Exit Violation Banner */}
        {hasViolation && (
          <div style={{
            background: 'rgba(255,80,80,0.1)',
            border: '1.5px solid rgba(255,80,80,0.45)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
            <div>
              <p style={{ fontFamily: 'Poppins', fontWeight: '700', color: '#ff8080', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                This exam was auto-submitted because you exited the exam window.
              </p>
              <p style={{ color: 'rgba(255,150,150,0.65)', fontSize: '0.82rem' }}>
                Violation type: <strong style={{ color: 'rgba(255,150,150,0.85)' }}>{result.violationType}</strong>.
                This activity has been reported to your teacher.
              </p>
            </div>
          </div>
        )}

        {/* Trophy Section */}
        <div className="glass" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="trophy-anim" style={{ fontSize: '4rem', display: 'block', marginBottom: '0.75rem' }}>
            {emoji}
          </div>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.9rem', color: '#c9b8ff', marginBottom: '0.5rem' }}>
            Exam Complete!
          </h2>
          <p style={{ color: 'rgba(201,184,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {result.examTitle}
          </p>

          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: colorBg,
            border: `2px solid ${color}`,
            borderRadius: '20px',
            padding: '1.5rem 3rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '3.5rem', color, lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ color, fontWeight: '600', fontSize: '1.1rem' }}>Grade: {grade}</div>

            {/* Pass / Fail badge */}
            <div style={{
              marginTop: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 1.1rem',
              borderRadius: '30px',
              background: passed ? 'rgba(72,199,142,0.18)' : 'rgba(255,107,107,0.18)',
              border: `1.5px solid ${passed ? 'rgba(72,199,142,0.5)' : 'rgba(255,107,107,0.5)'}`,
            }}>
              <span style={{ fontSize: '1rem' }}>{passed ? '✅' : '❌'}</span>
              <span style={{
                fontFamily: 'Poppins', fontWeight: '800', fontSize: '0.95rem',
                color: passed ? '#48c78e' : '#ff6b6b',
                letterSpacing: '0.04em',
              }}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div style={{ color: 'rgba(201,184,255,0.35)', fontSize: '0.7rem', marginTop: '0.3rem' }}>
              Passing threshold: {passingScore}%
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.5rem', color: '#7ec8e3' }}>
                {result.score}/{result.total}
              </div>
              <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.8rem' }}>Score</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.5rem', color }}>
                {message}
              </div>
              <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.8rem' }}>{result.studentName}</div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        {exam && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.1rem', color: '#c9b8ff', marginBottom: '1rem' }}>
              📋 Question Review
            </h3>
            {exam.questions.map((q, i) => {
              const studentAns = result.answers[i];
              const isCorrect = studentAns === q.correct;
              return (
                <div key={i} className="glass" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
                  {q.image && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <img
                        src={q.image}
                        alt="Question"
                        style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(201,184,255,0.12)' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{
                      background: isCorrect ? 'rgba(72,199,142,0.2)' : 'rgba(255,107,107,0.2)',
                      color: isCorrect ? '#48c78e' : '#ff6b6b',
                      borderRadius: '6px',
                      padding: '0.2rem 0.55rem',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isCorrect ? '✓' : '✕'} Q{i + 1}
                    </span>
                    <p style={{ color: 'rgba(230,225,255,0.9)', fontSize: '0.92rem', lineHeight: '1.5' }}>{q.question}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {optLabels.map((lbl, oi) => {
                      const isStudentChoice = studentAns === lbl;
                      const isCorrectOpt = q.correct === lbl;
                      let bg = 'rgba(201,184,255,0.04)';
                      let border = 'rgba(201,184,255,0.12)';
                      let color2 = 'rgba(201,184,255,0.5)';

                      if (isCorrectOpt) {
                        bg = 'rgba(72,199,142,0.1)';
                        border = 'rgba(72,199,142,0.4)';
                        color2 = '#48c78e';
                      }
                      if (isStudentChoice && !isCorrectOpt) {
                        bg = 'rgba(255,107,107,0.1)';
                        border = 'rgba(255,107,107,0.4)';
                        color2 = '#ff6b6b';
                      }

                      return (
                        <div key={lbl} style={{
                          background: bg,
                          border: `1.5px solid ${border}`,
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: '700', fontSize: '0.8rem', color: color2, flexShrink: 0 }}>{lbl}</span>
                          <span style={{ color: color2, fontSize: '0.82rem' }}>{q.options[oi]}</span>
                          {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>✓</span>}
                          {isStudentChoice && !isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>✕</span>}
                        </div>
                      );
                    })}
                  </div>

                  {!studentAns && (
                    <p style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Not answered — Correct answer: <strong style={{ color: '#48c78e' }}>{q.correct}</strong>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={() => navigate('/student')}>
            ← Back to Dashboard
          </button>
          <button className="btn-outline" style={{ padding: '0.75rem 1.5rem' }} onClick={() => navigate('/leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
