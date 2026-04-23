
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import ParticleBackground from '@/components/ParticleBackground';
import { ToastContainer, showToast } from '@/components/Toast';
import Footer from '@/components/Footer';
import { storage, Result } from '@/lib/storage';

interface ExamClassTopper {
  examTitle: string;
  class: string;
  name: string;
  score: number;
  total: number;
  percentage: number;
}

function getExamClassToppers(results: Result[]): ExamClassTopper[] {
  // Group results by examId + class, keep the highest scorer
  const map = new Map<string, ExamClassTopper>();

  results.forEach(r => {
    const key = `${r.examId}|${r.studentClass}`;
    const existing = map.get(key);
    if (!existing || r.percentage > existing.percentage ||
       (r.percentage === existing.percentage && r.score > existing.score)) {
      map.set(key, {
        examTitle: r.examTitle,
        class: r.studentClass,
        name: r.studentName,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
      });
    }
  });

  const classOrder = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];

  // Flatten, sort by class order then exam title
  return Array.from(map.values()).sort((a, b) => {
    const ci = classOrder.indexOf(a.class) - classOrder.indexOf(b.class);
    return ci !== 0 ? ci : a.examTitle.localeCompare(b.examTitle);
  });
}

export default function Landing() {
  const [, navigate] = useLocation();
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherPwd, setTeacherPwd] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [studentOpen, setStudentOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentClass, setStudentClass] = useState('Class 6');
  const [studentError, setStudentError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [toppers, setToppers] = useState<ExamClassTopper[]>([]);

  useEffect(() => {
    setLoaded(true);
    setToppers(getExamClassToppers(storage.getResults()));
    if (storage.isTeacherLoggedIn()) navigate('/teacher');
    else if (storage.isStudentLoggedIn() && storage.getCurrentStudent()) navigate('/student');
  }, []);

  const handleTeacherLogin = () => {
    if (teacherPwd === 'tks1') {
      storage.loginTeacher();
      showToast('Welcome, Teacher!', 'success');
      setTimeout(() => navigate('/teacher'), 500);
    } else {
      setTeacherError('Incorrect password. Please try again.');
      setTeacherPwd('');
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) { setStudentError('Please enter your full name.'); return; }
    if (!studentPhone.trim() || !/^\d{7,}$/.test(studentPhone)) {
      setStudentError('Please enter a valid phone number (digits only, min 7).'); return;
    }
    storage.setCurrentStudent({ name: studentName.trim(), phone: studentPhone.trim(), class: studentClass });
    showToast(`Welcome, ${studentName.trim()}!`, 'success');
    setTimeout(() => navigate('/student'), 500);
  };

  const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>
      <ParticleBackground />
      <ToastContainer />

      {/* Animated background orbs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(201,184,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', animation: 'float 12s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(126,200,227,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', animation: 'float 16s ease-in-out infinite reverse'
      }} />

      <div className={`page-enter relative z-10`} style={{ opacity: loaded ? 1 : 0 }}>
        {/* Hero Header */}
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem 3rem' }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #c9b8ff, #7ec8e3)',
            borderRadius: '16px',
            padding: '0.6rem 1.5rem',
            marginBottom: '1.5rem',
            color: '#1a1a2e',
            fontSize: '0.82rem',
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Smart Learning Platform
          </div>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '800',
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #c9b8ff 50%, #7ec8e3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            lineHeight: '1.15',
            letterSpacing: '-0.02em'
          }}>
            EduSphere
          </h1>
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(1.1rem, 2.8vw, 1.45rem)',
            background: 'linear-gradient(90deg, #f0c040, #ff8c42)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.06em',
            marginBottom: '0.85rem',
            textTransform: 'uppercase',
          }}>
            Go! &nbsp;and&nbsp; Crack it!
          </p>
          <p style={{
            color: 'rgba(201,184,255,0.75)',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '400',
            marginBottom: '0.5rem'
          }}>
            Smart Learning. Real Results.
          </p>
          <p style={{ color: 'rgba(201,184,255,0.45)', fontSize: '0.9rem', fontFamily: 'Inter' }}>
            A platform for teachers to create exams and students to learn and grow.
          </p>
        </div>

        {/* Class Champions Leaderboard */}
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem 2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: 'Poppins', fontWeight: '700',
              fontSize: '1.05rem', color: '#f0c040',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              🏆 Class Champions
            </span>
            <p style={{ color: 'rgba(201,184,255,0.35)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
              #1 scorer per class · updated after every exam
            </p>
          </div>

          {toppers.length === 0 ? (
            <div style={{
              background: 'rgba(201,184,255,0.04)',
              border: '1px dashed rgba(201,184,255,0.15)',
              borderRadius: '14px',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'rgba(201,184,255,0.3)',
              fontSize: '0.85rem',
            }}>
              🏅 No toppers yet — start taking exams to appear here!
            </div>
          ) : (
            /* Marquee ticker — overflows clipped, track duplicated for seamless loop */
            <div style={{ overflow: 'hidden', position: 'relative' }}>
              {/* Fade edges */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', zIndex: 2,
                background: 'linear-gradient(90deg, #16213e 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', zIndex: 2,
                background: 'linear-gradient(270deg, #16213e 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />

              <div className="champions-track" style={{ padding: '0.25rem 0' }}>
                {/* Render toppers twice for seamless infinite loop */}
                {[...toppers, ...toppers].map((t, i) => {
                  const color = t.percentage >= 70 ? '#48c78e' : t.percentage >= 50 ? '#f0c040' : '#ff6b6b';
                  return (
                    <div
                      key={i}
                      style={{
                        minWidth: '170px',
                        background: 'rgba(255,215,0,0.05)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderRadius: '14px',
                        padding: '1rem 1rem',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        flexShrink: 0,
                        marginRight: '0.9rem',
                      }}
                    >
                      {/* Exam title */}
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        color: 'rgba(255,215,0,0.7)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        marginBottom: '0.3rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px',
                      }}>
                        {t.examTitle}
                      </div>

                      {/* Class badge */}
                      <div style={{
                        display: 'inline-block',
                        background: 'rgba(201,184,255,0.1)',
                        border: '1px solid rgba(201,184,255,0.2)',
                        borderRadius: '6px',
                        padding: '0.12rem 0.5rem',
                        color: 'rgba(201,184,255,0.6)',
                        fontSize: '0.68rem',
                        fontWeight: '600',
                        marginBottom: '0.55rem',
                      }}>
                        {t.class}
                      </div>

                      {/* Gold medal always — each card is the #1 of that exam+class */}
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem', lineHeight: 1 }}>🥇</div>

                      {/* Name */}
                      <div style={{
                        fontFamily: 'Poppins',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        color: 'rgba(230,225,255,0.95)',
                        marginBottom: '0.4rem',
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                      }}>
                        {t.name}
                      </div>

                      {/* Score */}
                      <div style={{
                        fontFamily: 'Poppins',
                        fontWeight: '800',
                        fontSize: '1.2rem',
                        color,
                        lineHeight: 1,
                        marginBottom: '0.2rem',
                      }}>
                        {t.percentage}%
                      </div>

                      {/* correct / total */}
                      <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.68rem', marginBottom: '0.3rem' }}>
                        {t.score}/{t.total} correct
                      </div>

                      {/* Mini bar */}
                      <div style={{ height: '3px', background: 'rgba(201,184,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.percentage}%`, background: color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Login Cards */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 1.5rem 5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Teacher Card */}
          <div className="login-card" style={{ position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👩‍🏫</div>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.5rem', color: '#c9b8ff', marginBottom: '0.4rem' }}>
                Teacher Portal
              </h2>
              <p style={{ color: 'rgba(201,184,255,0.55)', fontSize: '0.88rem' }}>
                Create exams, track progress, and manage your class.
              </p>
            </div>

            {!teacherOpen ? (
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setTeacherOpen(true)}>
                Login as Teacher →
              </button>
            ) : (
              <div className="page-enter">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="edu-label">Password</label>
                  <input
                    type="password"
                    className="edu-input"
                    placeholder="Enter teacher password"
                    value={teacherPwd}
                    onChange={e => { setTeacherPwd(e.target.value); setTeacherError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()}
                    autoFocus
                  />
                  {teacherError && (
                    <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginTop: '0.4rem' }}>{teacherError}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleTeacherLogin}>
                    Login
                  </button>
                  <button className="btn-outline" onClick={() => { setTeacherOpen(false); setTeacherError(''); setTeacherPwd(''); }}>
                    Back
                  </button>
                </div>
              </div>
            )}

            <div style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'rgba(201,184,255,0.08)',
              border: '1px solid rgba(201,184,255,0.15)',
              borderRadius: '8px', padding: '0.3rem 0.6rem',
              color: 'rgba(201,184,255,0.5)', fontSize: '0.75rem'
            }}>
              Educator
            </div>
          </div>

          {/* Student Card */}
          <div className="login-card" style={{ position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎒</div>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.5rem', color: '#7ec8e3', marginBottom: '0.4rem' }}>
                Student Portal
              </h2>
              <p style={{ color: 'rgba(201,184,255,0.55)', fontSize: '0.88rem' }}>
                Take exams, track results, and climb the leaderboard.
              </p>
            </div>

            {!studentOpen ? (
              <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setStudentOpen(true)}>
                Login as Student →
              </button>
            ) : (
              <form className="page-enter" onSubmit={handleStudentLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="edu-label">Full Name</label>
                  <input
                    className="edu-input"
                    placeholder="Enter your full name"
                    value={studentName}
                    onChange={e => { setStudentName(e.target.value); setStudentError(''); }}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="edu-label">Phone Number</label>
                  <input
                    className="edu-input"
                    placeholder="Enter your phone number"
                    value={studentPhone}
                    onChange={e => { setStudentPhone(e.target.value.replace(/\D/, '')); setStudentError(''); }}
                    type="tel"
                  />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="edu-label">Class</label>
                  <select
                    className="edu-select"
                    value={studentClass}
                    onChange={e => setStudentClass(e.target.value)}
                  >
                    {classes.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {studentError && (
                  <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{studentError}</p>
                )}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn-secondary" style={{ flex: 1 }}>
                    Start Learning →
                  </button>
                  <button type="button" className="btn-outline" onClick={() => { setStudentOpen(false); setStudentError(''); }}>
                    Back
                  </button>
                </div>
              </form>
            )}

            <div style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'rgba(126,200,227,0.08)',
              border: '1px solid rgba(126,200,227,0.15)',
              borderRadius: '8px', padding: '0.3rem 0.6rem',
              color: 'rgba(126,200,227,0.5)', fontSize: '0.75rem'
            }}>
              Learner
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
