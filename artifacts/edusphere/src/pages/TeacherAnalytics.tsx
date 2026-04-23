
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { storage, Exam, Result } from '@/lib/storage';

const COLOR = (pct: number) => pct >= 70 ? '#48c78e' : pct >= 50 ? '#f0c040' : '#ff6b6b';
const CLASS_ORDER = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];

/* ── Mini horizontal bar ── */
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: '8px', background: 'rgba(201,184,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
    </div>
  );
}

/* ── SVG class comparison chart ── */
function ClassChart({ data }: { data: { cls: string; avg: number; count: number }[] }) {
  if (data.length === 0) return null;
  const maxAvg = 100;
  const H = 120, BAR_W = 38, GAP = 18;
  const W = data.length * (BAR_W + GAP) + GAP;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: '100%', maxWidth: `${W}px`, display: 'block' }}>
        {/* grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = H - (v / maxAvg) * H;
          return (
            <g key={v}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="rgba(201,184,255,0.07)" strokeWidth="1" strokeDasharray="3,4" />
              <text x={2} y={y - 3} fill="rgba(201,184,255,0.25)" fontSize="8" fontFamily="Inter">{v}%</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = GAP + i * (BAR_W + GAP);
          const barH = (d.avg / maxAvg) * H;
          const y = H - barH;
          const c = COLOR(d.avg);
          return (
            <g key={d.cls}>
              {/* bar */}
              <rect x={x} y={y} width={BAR_W} height={barH}
                fill={c} opacity="0.75" rx="4" />
              {/* avg label above bar */}
              <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle"
                fill={c} fontSize="9" fontFamily="Inter" fontWeight="700">
                {d.avg}%
              </text>
              {/* class label below */}
              <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle"
                fill="rgba(201,184,255,0.6)" fontSize="9" fontFamily="Inter">
                {d.cls.replace('Class ', 'Cls ')}
              </text>
              {/* count label */}
              <text x={x + BAR_W / 2} y={H + 26} textAnchor="middle"
                fill="rgba(201,184,255,0.35)" fontSize="8" fontFamily="Inter">
                {d.count} sub
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Question difficulty row ── */
function QuestionRow({ q, idx, wrongPct, wrongCount, total }: {
  q: { question: string; correct: string };
  idx: number; wrongPct: number; wrongCount: number; total: number;
}) {
  const c = wrongPct >= 70 ? '#ff6b6b' : wrongPct >= 40 ? '#f0c040' : '#48c78e';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.9rem',
      padding: '0.6rem 0', borderBottom: '1px solid rgba(201,184,255,0.06)'
    }}>
      <div style={{
        minWidth: '26px', height: '26px', borderRadius: '6px',
        background: `rgba(${wrongPct >= 70 ? '255,107,107' : wrongPct >= 40 ? '240,192,64' : '72,199,142'},0.12)`,
        border: `1px solid ${c}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c, fontSize: '0.72rem', fontWeight: '700',
      }}>Q{idx + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: 'rgba(230,225,255,0.8)', fontSize: '0.82rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {q.question}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
          <Bar value={wrongPct} max={100} color={c} />
          <span style={{ color: c, fontSize: '0.72rem', fontWeight: '700', minWidth: '32px' }}>{wrongPct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: '60px' }}>
        <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.7rem' }}>{wrongCount}/{total} wrong</div>
        <div style={{ color: '#a78bfa', fontSize: '0.7rem', marginTop: '0.1rem' }}>Ans: {q.correct}</div>
      </div>
    </div>
  );
}

/* ── Exam accordion card ── */
function ExamCard({ exam, results }: { exam: Exam; results: Result[] }) {
  const [open, setOpen] = useState(false);

  const submissions = results.length;
  const avg = submissions ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / submissions) : 0;
  const best = submissions ? Math.max(...results.map(r => r.percentage)) : 0;
  const worst = submissions ? Math.min(...results.map(r => r.percentage)) : 0;
  const passCount = results.filter(r => r.percentage >= 70).length;
  const passRate = submissions ? Math.round((passCount / submissions) * 100) : 0;
  const violations = results.filter(r => r.exitViolation).length;

  /* per-question wrong% */
  const qStats = exam.questions.map((q, qi) => {
    const attempted = results.filter(r => r.answers && r.answers[qi] !== null && r.answers[qi] !== undefined);
    const wrong = attempted.filter(r => r.answers[qi] !== q.correct).length;
    const wrongPct = attempted.length ? Math.round((wrong / attempted.length) * 100) : 0;
    return { q, wrongPct, wrongCount: wrong, total: attempted.length };
  }).sort((a, b) => b.wrongPct - a.wrongPct);

  const avgColor = COLOR(avg);

  return (
    <div className="glass" style={{ padding: '1.25rem 1.4rem', marginBottom: '0.85rem' }}>
      {/* Header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Poppins', fontWeight: '600', color: 'rgba(230,225,255,0.95)', fontSize: '0.98rem', marginBottom: '0.25rem' }}>
            {exam.title}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'rgba(201,184,255,0.5)', flexWrap: 'wrap' }}>
            <span>📚 {exam.class}</span>
            <span>❓ {exam.questions.length} Qs</span>
            <span>👥 {submissions} submissions</span>
            {violations > 0 && <span style={{ color: '#ff7070' }}>⚠️ {violations} violation{violations !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {submissions > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.3rem', color: avgColor, lineHeight: 1 }}>{avg}%</div>
              <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.7rem' }}>avg</div>
            </div>
          )}
          <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '1.1rem', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ marginTop: '1.1rem', borderTop: '1px solid rgba(201,184,255,0.08)', paddingTop: '1.1rem' }}>
          {submissions === 0 ? (
            <p style={{ color: 'rgba(201,184,255,0.35)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              No submissions yet for this exam.
            </p>
          ) : (
            <>
              {/* Stat row */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Avg Score', value: `${avg}%`, color: avgColor },
                  { label: 'Best', value: `${best}%`, color: COLOR(best) },
                  { label: 'Lowest', value: `${worst}%`, color: COLOR(worst) },
                  { label: 'Pass Rate', value: `${passRate}%`, color: COLOR(passRate) },
                  { label: 'Violations', value: String(violations), color: violations > 0 ? '#ff7070' : 'rgba(201,184,255,0.5)' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, minWidth: '70px', background: 'rgba(201,184,255,0.04)',
                    border: '1px solid rgba(201,184,255,0.09)', borderRadius: '10px',
                    padding: '0.75rem', textAlign: 'center'
                  }}>
                    <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.2rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ color: 'rgba(201,184,255,0.45)', fontSize: '0.68rem', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Question difficulty */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ color: 'rgba(201,184,255,0.6)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Question Difficulty (sorted hardest first)
                  </span>
                </div>
                {qStats.map(({ q, wrongPct, wrongCount, total }, i) => (
                  <QuestionRow
                    key={i}
                    q={q}
                    idx={exam.questions.indexOf(q)}
                    wrongPct={wrongPct}
                    wrongCount={wrongCount}
                    total={total}
                  />
                ))}
              </div>

              {/* Submissions list */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Submissions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[...results].sort((a, b) => b.percentage - a.percentage).map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.45rem 0.75rem',
                      background: r.exitViolation ? 'rgba(255,80,80,0.06)' : 'rgba(201,184,255,0.04)',
                      border: `1px solid ${r.exitViolation ? 'rgba(255,80,80,0.2)' : 'rgba(201,184,255,0.08)'}`,
                      borderRadius: '8px', gap: '0.5rem', flexWrap: 'wrap'
                    }}>
                      <div>
                        <span style={{ color: 'rgba(230,225,255,0.85)', fontSize: '0.82rem', fontWeight: '600' }}>{r.studentName}</span>
                        {r.exitViolation && <span style={{ marginLeft: '0.4rem', color: '#ff7070', fontSize: '0.7rem' }}>⚠️</span>}
                        <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.7rem' }}>
                          {new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.78rem' }}>{r.score}/{r.total}</span>
                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: COLOR(r.percentage) }}>{r.percentage}%</span>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: '600', padding: '0.1rem 0.5rem', borderRadius: '5px',
                          background: i === 0 ? 'rgba(255,215,0,0.12)' : 'transparent',
                          color: i === 0 ? '#f0c040' : 'transparent'
                        }}>{i === 0 ? '🥇' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function TeacherAnalytics() {
  const [, navigate] = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!storage.isTeacherLoggedIn()) { navigate('/'); return; }
    setExams(storage.getExams());
    setResults(storage.getResults());
  }, []);

  const totalSubs = results.length;
  const overallAvg = totalSubs ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalSubs) : 0;
  const violations = results.filter(r => r.exitViolation).length;
  const passRate = totalSubs ? Math.round((results.filter(r => r.percentage >= 70).length / totalSubs) * 100) : 0;

  /* class comparison */
  const classData = CLASS_ORDER
    .map(cls => {
      const cr = results.filter(r => r.studentClass === cls);
      return { cls, avg: cr.length ? Math.round(cr.reduce((s, r) => s + r.percentage, 0) / cr.length) : 0, count: cr.length };
    })
    .filter(d => d.count > 0);

  /* results per exam */
  const getExamResults = (examId: string) => results.filter(r => r.examId === examId);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <Navbar
        title="Analytics"
        showLogout={false}
        rightContent={
          <button className="btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/teacher')}>
            ← Dashboard
          </button>
        }
      />

      <div className="page-enter" style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Overview stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {[
            { label: 'Total Exams', value: String(exams.length), icon: '📋', color: '#c9b8ff' },
            { label: 'Submissions', value: String(totalSubs), icon: '📝', color: '#7ec8e3' },
            { label: 'Overall Avg', value: totalSubs ? `${overallAvg}%` : '—', icon: '📊', color: COLOR(overallAvg) },
            { label: 'Pass Rate', value: totalSubs ? `${passRate}%` : '—', icon: '✅', color: COLOR(passRate) },
            { label: 'Violations', value: String(violations), icon: '⚠️', color: violations > 0 ? '#ff7070' : 'rgba(201,184,255,0.4)' },
          ].map(s => (
            <div key={s.label} className="glass" style={{ flex: 1, minWidth: '120px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.6rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'rgba(201,184,255,0.45)', fontSize: '0.72rem', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Class performance chart */}
        {classData.length > 0 && (
          <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1rem', color: '#c9b8ff', marginBottom: '1rem' }}>
              📊 Class-wise Average Score
            </h3>
            <ClassChart data={classData} />
          </div>
        )}

        {/* Exam breakdown */}
        <div>
          <h3 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.1rem', color: '#c9b8ff', marginBottom: '1rem' }}>
            📚 Exam Breakdown
            <span style={{ color: 'rgba(201,184,255,0.4)', fontWeight: '400', fontSize: '0.82rem', marginLeft: '0.6rem' }}>
              — click an exam to expand
            </span>
          </h3>

          {exams.length === 0 ? (
            <div className="glass empty-state">
              <span className="empty-icon">📋</span>
              <p style={{ color: 'rgba(201,184,255,0.5)' }}>No exams published yet.</p>
            </div>
          ) : (
            exams.map(exam => (
              <ExamCard key={exam.id} exam={exam} results={getExamResults(exam.id)} />
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
