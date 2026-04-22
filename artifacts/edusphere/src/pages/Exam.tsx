
import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import Navbar from '@/components/Navbar';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!storage.isStudentLoggedIn()) { navigate('/'); return; }
    const e = storage.getExamById(examId);
    if (!e) { navigate('/student'); return; }
    setExam(e);
    setAnswers(new Array(e.questions.length).fill(null));
    setTimeLeft(e.timerMinutes * 60);
  }, [examId]);

  useEffect(() => {
    if (!exam) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [exam]);

  const handleSubmit = (autoSubmit = false) => {
    if (!exam) return;
    clearInterval(timerRef.current!);

    const student = storage.getCurrentStudent()!;
    let score = 0;
    const optMap = ['A', 'B', 'C', 'D'];
    const finalAnswers = answers.map(a => a);

    exam.questions.forEach((q, i) => {
      if (finalAnswers[i] === q.correct) score++;
    });

    const percentage = Math.round((score / exam.questions.length) * 100);

    const result: Result = {
      id: storage.generateId(),
      studentName: student.name,
      studentPhone: student.phone,
      studentClass: student.class,
      examTitle: exam.title,
      examId: exam.id,
      score,
      total: exam.questions.length,
      percentage,
      answers: finalAnswers,
      timestamp: new Date().toISOString()
    };

    storage.addResult(result);
    storage.setLastResult(result);
    storage.addNotification({
      id: storage.generateId(),
      studentName: student.name,
      studentClass: student.class,
      examTitle: exam.title,
      score,
      total: exam.questions.length,
      percentage,
      timestamp: new Date().toISOString(),
      read: false
    });

    if (autoSubmit) showToast("Time's up! Exam auto-submitted.", 'info');
    navigate('/results');
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <ToastContainer />

      {/* Confirm Dialog */}
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
              {exam.questions.length - answered > 0 && `${exam.questions.length - answered} unanswered question${exam.questions.length - answered !== 1 ? 's' : ''} will be marked wrong.`}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSubmit(false)}>
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

      <div className="page-enter" style={{ maxWidth: '750px', margin: '0 auto', padding: '2rem 1.5rem' }}>
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

      <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(201,184,255,0.25)', fontSize: '0.8rem', borderTop: '1px solid rgba(201,184,255,0.06)', fontFamily: 'Inter', marginTop: '2rem' }}>
        © 2026 EduSphere — Smart Learning, Real Results
      </footer>
    </div>
  );
}
