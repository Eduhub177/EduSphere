
import { useState, useEffect, useRef } from 'react';
import { storage, Question, Exam } from '@/lib/storage';
import { showToast } from '@/components/Toast';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const COUNT_PRESETS = [5, 10, 15, 20, 25, 30];
const OPT_LABELS = ['A', 'B', 'C', 'D'];
const OPT_COLORS = ['#5b8dee', '#48c78e', '#f0a500', '#ff6b6b'];

function makeEmpty(): Question {
  return { question: '', options: ['A', 'B', 'C', 'D'], correct: 'A', image: undefined };
}

function qStatus(q: Question): 'empty' | 'partial' | 'filled' {
  const hasQ = q.question.trim().length > 0;
  const filled = q.options.filter(o => o.trim().length > 0).length;
  if (!hasQ && filled === 0) return 'empty';
  if (hasQ && filled === 4) return 'filled';
  return 'partial';
}

const statusColor = { empty: '#555580', partial: '#f0c040', filled: '#48c78e' };
const statusDot = { empty: '○', partial: '◑', filled: '●' };

interface Props { onPublish: (exam: Exam) => void; }

export default function ExamCreator({ onPublish }: Props) {
  const [phase, setPhase] = useState<'setup' | 'questions' | 'review'>('setup');
  const [title, setTitle]   = useState('');
  const [cls, setCls]       = useState('Class 6');
  const [timer, setTimer]   = useState(30);
  const [countMode, setCountMode] = useState<number | 'custom'>(10);
  const [customCount, setCustomCount] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [slide, setSlide]   = useState(0);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [formError, setFormError] = useState('');
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (storage.getExamDraft()) setDraftPrompt(true);
  }, []);

  useEffect(() => {
    if (phase !== 'questions' && phase !== 'review') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      storage.saveExamDraft({ title, cls, timer, questions, countMode, customCount, slide } as unknown as Record<string, unknown>);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    }, 800);
  }, [questions, title, cls, timer, phase]);

  const restoreDraft = () => {
    const d = storage.getExamDraft() as Record<string, unknown> | null;
    if (!d) return;
    setTitle((d.title as string) || '');
    setCls((d.cls as string) || 'Class 6');
    setTimer((d.timer as number) || 30);
    setQuestions((d.questions as Question[]) || []);
    setCountMode((d.countMode as number | 'custom') || 10);
    setCustomCount((d.customCount as number) || 20);
    setSlide((d.slide as number) || 0);
    setDraftPrompt(false);
    setPhase('questions');
  };

  const discardDraft = () => {
    storage.clearExamDraft();
    setDraftPrompt(false);
  };

  const generate = () => {
    if (!title.trim()) { setFormError('Please enter an exam title.'); return; }
    setFormError('');
    const n = countMode === 'custom' ? Math.max(1, Math.min(50, customCount)) : countMode;
    setQuestions(Array.from({ length: n }, makeEmpty));
    setSlide(0);
    setPhase('questions');
  };

  const goSlide = (idx: number) => {
    setSlideDir(idx >= slide ? 'right' : 'left');
    setSlide(idx);
    setAnimKey(k => k + 1);
  };

  const updateQ = (i: number, field: string, value: string) => {
    setQuestions(prev => {
      const q = prev.map((x, xi) => xi === i ? { ...x } : x);
      if (field === 'question')    q[i].question = value;
      else if (field === 'correct') q[i].correct = value as 'A' | 'B' | 'C' | 'D';
      else if (field === 'image')  q[i].image = value || undefined;
      else if (field.startsWith('opt')) {
        const oi = parseInt(field.slice(3));
        const opts = [...q[i].options] as [string, string, string, string];
        opts[oi] = value;
        q[i].options = opts;
      }
      return q;
    });
  };

  const removeImage = (i: number) => updateQ(i, 'image', '');

  const handleFileUpload = (i: number, file: File) => {
    const reader = new FileReader();
    reader.onload = e => updateQ(i, 'image', (e.target?.result as string) || '');
    reader.readAsDataURL(file);
  };

  const openCamera = (i: number) => {
    setCameraTarget(i);
    setCameraOpen(true);
    setCameraReady(false);
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  useEffect(() => {
    if (!cameraOpen) { stopStream(); return; }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      })
      .catch(() => {
        showToast('Camera access denied or not available.', 'error');
        setCameraOpen(false);
      });
    return stopStream;
  }, [cameraOpen]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || cameraTarget === null) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    updateQ(cameraTarget, 'image', c.toDataURL('image/jpeg', 0.85));
    setCameraOpen(false);
  };

  const publish = () => {
    if (!title.trim()) { setFormError('Exam title is required.'); return; }
    if (questions.some(q => !q.question.trim())) { setFormError('All questions must have text.'); return; }
    if (questions.some(q => q.options.some(o => !o.trim()))) { setFormError('All options A–D must be filled.'); return; }
    setFormError('');
    const exam: Exam = {
      id: storage.generateId(),
      title: title.trim(),
      class: cls,
      timerMinutes: timer,
      questions,
      createdAt: new Date().toISOString(),
    };
    storage.clearExamDraft();
    onPublish(exam);
    setTitle(''); setCls('Class 6'); setTimer(30);
    setCountMode(10); setCustomCount(20);
    setQuestions([]); setSlide(0);
    setPhase('setup'); setFormError('');
  };

  const totalQ = questions.length;
  const q = questions[slide];

  return (
    <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.4rem', color: '#c9b8ff', margin: 0 }}>
          📝 Create New Exam
        </h2>
        {phase !== 'setup' && showSaved && (
          <span style={{ color: '#48c78e', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ✓ Saved
          </span>
        )}
      </div>

      {/* Draft Restore Prompt */}
      {draftPrompt && (
        <div style={{
          background: 'rgba(201,184,255,0.07)',
          border: '1.5px solid rgba(201,184,255,0.25)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: 'rgba(230,225,255,0.9)', fontSize: '0.9rem', flex: 1, minWidth: '200px' }}>
            📋 You have an unsaved exam draft. Continue editing?
          </span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }} onClick={restoreDraft}>
              Continue
            </button>
            <button className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }} onClick={discardDraft}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ===== PHASE: SETUP ===== */}
      {phase === 'setup' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="edu-label">Exam Title</label>
              <input className="edu-input" placeholder="e.g. Math Midterm" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="edu-label">Class</label>
              <select className="edu-select" value={cls} onChange={e => setCls(e.target.value)}>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="edu-label">Timer (minutes)</label>
              <input className="edu-input" type="number" min={1} max={180} value={timer} onChange={e => setTimer(Number(e.target.value))} />
            </div>
          </div>

          {/* Question Count */}
          <div style={{
            background: 'rgba(201,184,255,0.05)',
            border: '1px solid rgba(201,184,255,0.12)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}>
            <label className="edu-label" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              How many questions do you want to add?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {COUNT_PRESETS.map(n => (
                <button
                  key={n}
                  onClick={() => setCountMode(n)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${countMode === n ? '#c9b8ff' : 'rgba(201,184,255,0.25)'}`,
                    background: countMode === n ? 'rgba(201,184,255,0.18)' : 'transparent',
                    color: countMode === n ? '#c9b8ff' : 'rgba(201,184,255,0.6)',
                    cursor: 'pointer',
                    fontFamily: 'Poppins',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCountMode('custom')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '8px',
                  border: `1.5px solid ${countMode === 'custom' ? '#f0c040' : 'rgba(201,184,255,0.25)'}`,
                  background: countMode === 'custom' ? 'rgba(240,192,64,0.12)' : 'transparent',
                  color: countMode === 'custom' ? '#f0c040' : 'rgba(201,184,255,0.6)',
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  transition: 'all 0.15s ease'
                }}
              >
                Custom
              </button>
            </div>
            {countMode === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label className="edu-label" style={{ marginBottom: 0 }}>Number of questions (1–50):</label>
                <input
                  className="edu-input"
                  type="number"
                  min={1}
                  max={50}
                  value={customCount}
                  onChange={e => setCustomCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                  style={{ maxWidth: '90px' }}
                />
              </div>
            )}
          </div>

          {formError && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{formError}</p>}

          <button className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }} onClick={generate}>
            Generate Questions →
          </button>
        </>
      )}

      {/* ===== PHASE: QUESTIONS ===== */}
      {phase === 'questions' && q && (
        <>
          {/* Progress Header */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'Poppins', fontWeight: '700', color: '#c9b8ff', fontSize: '0.95rem' }}>
                Question {slide + 1} of {totalQ}
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {questions.map((_, i) => {
                  const st = qStatus(questions[i]);
                  return (
                    <button
                      key={i}
                      onClick={() => goSlide(i)}
                      title={`Question ${i + 1}: ${st}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: `1.5px solid ${i === slide ? '#c9b8ff' : statusColor[st]}`,
                        background: i === slide ? 'rgba(201,184,255,0.18)' : 'rgba(201,184,255,0.04)',
                        color: i === slide ? '#c9b8ff' : statusColor[st],
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status dots legend */}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(201,184,255,0.45)', marginBottom: '0.6rem' }}>
              {(['empty', 'partial', 'filled'] as const).map(s => (
                <span key={s} style={{ color: statusColor[s] }}>{statusDot[s]} {s}</span>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ height: '5px', background: 'rgba(201,184,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(questions.filter(x => qStatus(x) === 'filled').length / totalQ) * 100}%`,
                background: 'linear-gradient(90deg, #48c78e, #7ec8e3)',
                borderRadius: '3px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Question Slide (animated) */}
          <div
            key={animKey}
            className={slideDir === 'right' ? 'slide-in-right' : 'slide-in-left'}
            style={{
              background: 'rgba(22,33,62,0.6)',
              border: '1px solid rgba(201,184,255,0.12)',
              borderRadius: '14px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}
          >
            {/* Slide header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #c9b8ff, #9d7ee0)',
                color: '#1a1a2e',
                borderRadius: '8px',
                padding: '0.2rem 0.65rem',
                fontFamily: 'Poppins',
                fontWeight: '700',
                fontSize: '0.85rem'
              }}>
                Q{slide + 1}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: statusColor[qStatus(q)],
                fontWeight: '600'
              }}>
                {statusDot[qStatus(q)]} {qStatus(q)}
              </span>
            </div>

            {/* Image Section */}
            <div style={{ marginBottom: '1rem' }}>
              {q.image ? (
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <img
                    src={q.image}
                    alt="Question"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(201,184,255,0.2)' }}
                  />
                  <button
                    onClick={() => removeImage(slide)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.65)',
                      border: '1px solid rgba(255,100,100,0.5)',
                      color: '#ff8080',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '700'
                    }}
                    title="Remove Photo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(201,184,255,0.07)',
                    border: '1.5px dashed rgba(201,184,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    cursor: 'pointer',
                    color: 'rgba(201,184,255,0.7)',
                    fontSize: '0.82rem',
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    transition: 'all 0.15s ease'
                  }}>
                    📁 Upload from Device
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={e => { if (e.target.files?.[0]) handleFileUpload(slide, e.target.files[0]); }}
                    />
                  </label>
                  <button
                    onClick={() => openCamera(slide)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      background: 'rgba(126,200,227,0.07)',
                      border: '1.5px dashed rgba(126,200,227,0.35)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.9rem',
                      cursor: 'pointer',
                      color: 'rgba(126,200,227,0.75)',
                      fontSize: '0.82rem',
                      fontFamily: 'Inter',
                      fontWeight: '500'
                    }}
                  >
                    📷 Use Camera
                  </button>
                </div>
              )}
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="edu-label">Question Text</label>
              <textarea
                className="edu-input"
                placeholder="Enter your question here..."
                value={q.question}
                onChange={e => updateQ(slide, 'question', e.target.value)}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* A B C D Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {OPT_LABELS.map((lbl, oi) => {
                const isCorrect = q.correct === lbl;
                return (
                  <div
                    key={lbl}
                    className={isCorrect ? 'opt-row-correct' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'rgba(201,184,255,0.04)',
                      border: `1.5px solid rgba(201,184,255,0.15)`,
                      borderLeft: `3.5px solid ${OPT_COLORS[oi]}`,
                      borderRadius: '10px',
                      padding: '0.6rem 0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name={`correct-${slide}`}
                      value={lbl}
                      checked={isCorrect}
                      onChange={() => updateQ(slide, 'correct', lbl)}
                      style={{ accentColor: '#48c78e', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{
                      fontFamily: 'Poppins',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      color: OPT_COLORS[oi],
                      flexShrink: 0,
                      width: '18px'
                    }}>
                      {lbl}
                    </span>
                    <input
                      className="edu-input"
                      placeholder={`Option ${lbl}`}
                      value={q.options[oi]}
                      onChange={e => updateQ(slide, `opt${oi}`, e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        padding: '0.1rem 0',
                        fontSize: '0.88rem'
                      }}
                    />
                    {isCorrect && (
                      <span style={{ color: '#48c78e', fontSize: '0.85rem', flexShrink: 0 }}>✓ correct</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              className="btn-outline"
              onClick={() => goSlide(slide - 1)}
              disabled={slide === 0}
              style={{ opacity: slide === 0 ? 0.4 : 1 }}
            >
              ← Previous
            </button>

            {slide < totalQ - 1 ? (
              <button className="btn-secondary" onClick={() => goSlide(slide + 1)}>
                Next Question →
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => setPhase('review')}
                style={{ background: 'linear-gradient(135deg, #48c78e, #27a468)' }}
              >
                Review All & Publish →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              onClick={() => setPhase('setup')}
            >
              ← Back to Setup
            </button>
            <span style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.78rem' }}>
              {questions.filter(x => qStatus(x) === 'filled').length}/{totalQ} complete
            </span>
          </div>
        </>
      )}

      {/* ===== PHASE: REVIEW ===== */}
      {phase === 'review' && (
        <>
          <div style={{
            background: 'rgba(201,184,255,0.05)',
            border: '1px solid rgba(201,184,255,0.15)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.75rem' }}>Title</div>
              <div style={{ color: 'rgba(230,225,255,0.9)', fontWeight: '600', fontSize: '0.92rem' }}>{title}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.75rem' }}>Class</div>
              <div style={{ color: 'rgba(230,225,255,0.9)', fontWeight: '600', fontSize: '0.92rem' }}>{cls}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.75rem' }}>Timer</div>
              <div style={{ color: 'rgba(230,225,255,0.9)', fontWeight: '600', fontSize: '0.92rem' }}>{timer} min</div>
            </div>
            <div>
              <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.75rem' }}>Questions</div>
              <div style={{ color: 'rgba(230,225,255,0.9)', fontWeight: '600', fontSize: '0.92rem' }}>{totalQ}</div>
            </div>
          </div>

          <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {questions.map((rq, i) => {
              const st = qStatus(rq);
              return (
                <div
                  key={i}
                  onClick={() => { setPhase('questions'); goSlide(i); }}
                  style={{
                    background: st === 'filled' ? 'rgba(72,199,142,0.05)' : st === 'partial' ? 'rgba(240,192,64,0.05)' : 'rgba(255,100,100,0.05)',
                    border: `1px solid ${st === 'filled' ? 'rgba(72,199,142,0.2)' : st === 'partial' ? 'rgba(240,192,64,0.2)' : 'rgba(255,100,100,0.2)'}`,
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'opacity 0.15s ease'
                  }}
                >
                  <span style={{
                    background: statusColor[st],
                    color: '#1a1a2e',
                    borderRadius: '6px',
                    padding: '0.15rem 0.5rem',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    Q{i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: rq.question.trim() ? 'rgba(230,225,255,0.85)' : 'rgba(255,100,100,0.6)',
                      fontSize: '0.85rem',
                      marginBottom: '0.25rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {rq.question.trim() || '⚠ No question text'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {OPT_LABELS.map((lbl, oi) => (
                        <span key={lbl} style={{
                          fontSize: '0.72rem',
                          color: rq.correct === lbl ? '#48c78e' : rq.options[oi].trim() ? 'rgba(201,184,255,0.5)' : 'rgba(255,100,100,0.5)',
                          fontWeight: rq.correct === lbl ? '700' : '400'
                        }}>
                          {lbl}: {rq.options[oi] || '—'}{rq.correct === lbl ? ' ✓' : ''}
                        </span>
                      ))}
                      {rq.image && <span style={{ fontSize: '0.72rem', color: '#7ec8e3' }}>📸 image</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {formError && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{formError}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-outline"
              onClick={() => setPhase('questions')}
              style={{ padding: '0.7rem 1.5rem' }}
            >
              ← Back to Edit
            </button>
            <button
              className="btn-primary"
              onClick={publish}
              style={{ padding: '0.7rem 2rem', fontSize: '0.95rem' }}
            >
              🚀 Publish Exam
            </button>
          </div>
        </>
      )}

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="camera-modal-overlay" onClick={() => setCameraOpen(false)}>
          <div className="camera-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Poppins', fontWeight: '700', color: '#c9b8ff', fontSize: '1rem' }}>
                📷 Camera
              </span>
              <button
                onClick={() => setCameraOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(201,184,255,0.5)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{
              background: '#0a0a18',
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraReady ? 'block' : 'none' }}
              />
              {!cameraReady && (
                <span style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.9rem' }}>Starting camera…</span>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '0.7rem' }}
                onClick={capturePhoto}
                disabled={!cameraReady}
              >
                📸 Capture Photo
              </button>
              <button
                className="btn-outline"
                style={{ padding: '0.7rem 1.25rem' }}
                onClick={() => setCameraOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
