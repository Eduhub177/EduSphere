
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastContainer, showToast } from '@/components/Toast';
import { storage, Exam as ExamType, Result } from '@/lib/storage';

export default function Exam() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const examId = params.get('id') || '';

  const [exam, setExam] = useState<ExamType | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [confirming, setConfirming] = useState(false);

  // Anti-cheat state
  const [showWarning, setShowWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');

  const [timerAlert, setTimerAlert] = useState<{ msg: string; icon: string; level: 'warning' | 'urgent' } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const examRef = useRef<ExamType | null>(null);
  const answersRef = useRef<(string | null)[]>([]);
  const submittedRef = useRef(false);
  const violationCountRef = useRef(0);
  const twoMinAlertedRef = useRef(false);
  const thirtySecAlertedRef = useRef(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync so event handlers always have latest values
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const doSubmit = useCallback((
    opts: { autoSubmit?: boolean; violation?: boolean; violationType?: string } = {}
  ) => {
    if (submittedRef.current) return;
    const e = examRef.current;
    if (!e) return;

    submittedRef.current = true;
    clearInterval(timerRef.current!);

    const student = storage.getCurrentStudent()!;
    let score = 0;
    const finalAnswers = answersRef.current.map(a => a);

    e.questions.forEach((q, i) => {
      if (finalAnswers[i] === q.correct) score++;
    });

    const percentage = Math.round((score / e.questions.length) * 100);

    const result: Result = {
      id: storage.generateId(),
      studentName: student.name,
      studentPhone: student.phone,
      studentClass: student.class,
      examTitle: e.title,
      examId: e.id,
      score,
      total: e.questions.length,
      percentage,
      answers: finalAnswers,
      timestamp: new Date().toISOString(),
      exitViolation: opts.violation || false,
      violationType: opts.violationType,
    };

    storage.addResult(result);
    storage.setLastResult(result);
    storage.addNotification({
      id: storage.generateId(),
      studentName: student.name,
      studentClass: student.class,
      examTitle: e.title,
      score,
      total: e.questions.length,
      percentage,
      timestamp: new Date().toISOString(),
      read: false,
      exitViolation: opts.violation || false,
      violationType: opts.violationType,
    });

    if (opts.violation) {
      showToast('Exam auto-submitted due to exit.', 'error');
    } else if (opts.autoSubmit) {
      showToast("Time's up! Exam auto-submitted.", 'info');
    }

    setTimeout(() => navigate('/results'), 600);
  }, [navigate]);

  // Set up exam
  useEffect(() => {
    if (!storage.isStudentLoggedIn()) { navigate('/'); return; }
    const e = storage.getExamById(examId);
    if (!e) { navigate('/student'); return; }
    setExam(e);
    examRef.current = e;
    const initialAnswers = new Array(e.questions.length).fill(null);
    setAnswers(initialAnswers);
    answersRef.current = initialAnswers;
    setTimeLeft(e.timerMinutes * 60);
  }, [examId]);

  // Timer
  useEffect(() => {
    if (!exam) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          doSubmit({ autoSubmit: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [exam, doSubmit]);

  // Timer countdown alerts
  useEffect(() => {
    if (!exam || submittedRef.current) return;

    const showAlert = (msg: string, icon: string, level: 'warning' | 'urgent', duration: number) => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      setTimerAlert({ msg, icon, level });
      alertTimerRef.current = setTimeout(() => setTimerAlert(null), duration);
    };

    if (timeLeft === 120 && !twoMinAlertedRef.current) {
      twoMinAlertedRef.current = true;
      showAlert('2 minutes remaining!', '⏰', 'warning', 5000);
    } else if (timeLeft === 30 && !thirtySecAlertedRef.current) {
      thirtySecAlertedRef.current = true;
      showAlert('30 seconds left — hurry!', '🚨', 'urgent', 6000);
    }
  }, [timeLeft, exam]);

  // Anti-cheat: visibilitychange (tab switch)
  useEffect(() => {
    if (!exam) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) {
        violationCountRef.current += 1;
        setViolationCount(violationCountRef.current);

        if (violationCountRef.current >= 2) {
          // Second violation — auto submit
          setShowWarning(false);
          doSubmit({ violation: true, violationType: 'Tab switched' });
        } else {
          // First violation — show warning
          setWarningMessage('⚠️ Warning! Do not leave the exam window.\nThis activity has been recorded.');
          setShowWarning(true);
        }
      }
    };

    // beforeunload: browser close / refresh / navigate away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        doSubmit({ violation: true, violationType: 'Browser closed / page refreshed' });
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // popstate: back button
    const handlePopState = () => {
      if (!submittedRef.current) {
        doSubmit({ violation: true, violationType: 'Browser back button' });
      }
    };

    // Push a state so back button triggers popstate instead of navigating
    window.history.pushState(null, '', window.location.href);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [exam, doSubmit]);

  const handleSubmit = (manual = false) => {
    setConfirming(false);
    doSubmit({ autoSubmit: !manual });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (ans: string) => {
    const updated = [...answers];
    updated[currentQ] = ans;
    setAnswers(updated);
    answersRef.current = updated;
  };

  const optLabels = ['A', 'B', 'C', 'D'];
  const isWarning = timeLeft > 0 && timeLeft < 60;
  const answered = answers.filter(a => a !== null).length;

  if (!exam) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a2e' }}>
      <p style={{ color: '#c9b8ff' }}>Loading exam...</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer />

      {/* Timer countdown alert banner */}
      {timerAlert && (
        <div
          className={`timer-alert-banner ${timerAlert.level}`}
          onClick={() => setTimerAlert(null)}
          style={{ cursor: 'pointer' }}
        >
          <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{timerAlert.icon}</span>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>
              {timerAlert.msg}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Tap to dismiss
            </div>
          </div>
        </div>
      )}

      {/* Exit Warning Overlay */}
      {showWarning && (
        <div className="exit-warning-overlay" onClick={() => setShowWarning(false)}>
          <div className="exit-warning-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'pulse 1s ease infinite' }}>⚠️</div>
            <h2 style={{
              fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.3rem',
              color: '#ff6b6b', marginBottom: '0.75rem', lineHeight: '1.4'
            }}>
              Warning! Do not leave the exam window.
            </h2>
            <p style={{ color: 'rgba(255,160,160,0.75)', fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: '1.6' }}>
              This activity has been recorded.
            </p>
            <p style={{ color: 'rgba(255,120,120,0.55)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              A second violation will auto-submit your exam immediately.
            </p>
            <div style={{
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              color: 'rgba(255,160,160,0.7)',
              fontSize: '0.78rem',
              marginBottom: '1.25rem',
              fontStyle: 'italic'
            }}>
              Violation {violationCount}/2 recorded
            </div>
            <button
              className="btn-danger"
              style={{ padding: '0.7rem 2rem', width: '100%' }}
              onClick={() => setShowWarning(false)}
            >
              Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 500
        }}>
          <div className="glass-dark page-enter" style={{ padding: '2rem', maxWidth: '380px', width: '90%' }}>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: '700', color: '#c9b8ff', fontSize: '1.2rem', marginBottom: '0.75rem' }}>
              Submit Exam?
            </h3>
            <p style={{ color: 'rgba(201,184,255,0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              You've answered <strong style={{ color: '#7ec8e3' }}>{answered}/{exam.questions.length}</strong> questions.
            </p>
            <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {exam.questions.length - answered > 0
                ? `${exam.questions.length - answered} unanswered question${exam.questions.length - answered !== 1 ? 's' : ''} will be marked wrong.`
                : 'All questions are answered. Good job!'
              }
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSubmit(true)}>
                Submit Now
              </button>
              <button className="btn-outline" onClick={() => setConfirming(false)}>
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar
        title={exam.title}
        rightContent={
          <div className={isWarning ? 'timer-warning' : 'timer-normal'}>
            ⏱ {formatTime(timeLeft)}
          </div>
        }
      />

      {/* Violation indicator */}
      {violationCount > 0 && !showWarning && (
        <div style={{
          background: 'rgba(255,80,80,0.12)',
          borderBottom: '1px solid rgba(255,80,80,0.25)',
          padding: '0.5rem 1.5rem',
          textAlign: 'center',
          color: '#ff8080',
          fontSize: '0.8rem',
          fontFamily: 'Inter'
        }}>
          ⚠️ Exit violation recorded ({violationCount}/2) — next violation will auto-submit your exam
        </div>
      )}

      <div className="page-enter" style={{ maxWidth: '750px', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
        {/* Progress */}
        <div className="glass" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: 'rgba(201,184,255,0.7)', fontSize: '0.85rem' }}>
              Question {currentQ + 1} of {exam.questions.length}
            </span>
            <span style={{ color: '#7ec8e3', fontSize: '0.85rem', fontWeight: '600' }}>
              {answered} answered
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(201,184,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((currentQ + 1) / exam.questions.length) * 100}%`,
              background: 'linear-gradient(90deg, #c9b8ff, #7ec8e3)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Question */}
        <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          {exam.questions[currentQ].image && (
            <div style={{ marginBottom: '1.25rem' }}>
              <img
                src={exam.questions[currentQ].image}
                alt="Question"
                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(201,184,255,0.15)' }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <span style={{
              background: 'linear-gradient(135deg, #c9b8ff, #9d7ee0)',
              color: '#1a1a2e',
              borderRadius: '8px',
              padding: '0.3rem 0.65rem',
              fontFamily: 'Poppins',
              fontWeight: '700',
              fontSize: '0.85rem',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              Q{currentQ + 1}
            </span>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: '600', color: 'rgba(230,225,255,0.95)', fontSize: '1.1rem', lineHeight: '1.5' }}>
              {exam.questions[currentQ].question}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {optLabels.map((lbl, oi) => {
              const selected = answers[currentQ] === lbl;
              return (
                <div
                  key={lbl}
                  className={`option-card ${selected ? 'selected' : ''}`}
                  onClick={() => selectAnswer(lbl)}
                >
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: selected ? 'rgba(201,184,255,0.3)' : 'rgba(201,184,255,0.08)',
                    border: `1.5px solid ${selected ? '#c9b8ff' : 'rgba(201,184,255,0.2)'}`,
                    fontFamily: 'Poppins',
                    fontWeight: '700',
                    color: selected ? '#c9b8ff' : 'rgba(201,184,255,0.6)',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {lbl}
                  </span>
                  <span style={{ color: selected ? 'rgba(230,225,255,0.95)' : 'rgba(201,184,255,0.75)' }}>
                    {exam.questions[currentQ].options[oi]}
                  </span>
                  {selected && <span style={{ marginLeft: 'auto', color: '#c9b8ff', fontSize: '1.1rem' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-outline"
            onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
            style={{ opacity: currentQ === 0 ? 0.4 : 1 }}
          >
            ← Previous
          </button>

          {/* Question dots */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {exam.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: `1.5px solid ${i === currentQ ? '#c9b8ff' : answers[i] ? 'rgba(126,200,227,0.5)' : 'rgba(201,184,255,0.2)'}`,
                  background: i === currentQ ? 'rgba(201,184,255,0.2)' : answers[i] ? 'rgba(126,200,227,0.12)' : 'transparent',
                  color: i === currentQ ? '#c9b8ff' : answers[i] ? '#7ec8e3' : 'rgba(201,184,255,0.45)',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontWeight: '600',
                  fontSize: '0.78rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < exam.questions.length - 1 ? (
            <button className="btn-secondary" onClick={() => setCurrentQ(prev => Math.min(exam.questions.length - 1, prev + 1))}>
              Next →
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setConfirming(true)}>
              Submit Exam 🚀
            </button>
          )}
        </div>

        {answered === exam.questions.length && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn-primary" style={{ padding: '0.75rem 2.5rem' }} onClick={() => setConfirming(true)}>
              All answered — Submit Exam 🚀
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
