
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { storage, Result } from '@/lib/storage';

const CLASSES = ['All Classes', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

interface LeaderboardEntry {
  name: string;
  phone: string;
  class: string;
  examCount: number;
  avgScore: number;
  totalCorrect: number;
  totalQuestions: number;
  lastExamPct: number;
  lastScore: number;
  lastTotal: number;
}

function scoreColor(pct: number) {
  return pct >= 70 ? '#48c78e' : pct >= 50 ? '#f0c040' : '#ff6b6b';
}

function buildLeaderboard(results: Result[], selectedClass: string): LeaderboardEntry[] {
  const map = new Map<string, {
    name: string; phone: string; class: string;
    scores: number[]; totalCorrect: number; totalQuestions: number;
    lastResult: Result | null;
  }>();

  results.forEach(r => {
    const key = `${r.studentName}|${r.studentPhone}`;
    if (!map.has(key)) {
      map.set(key, { name: r.studentName, phone: r.studentPhone, class: r.studentClass, scores: [], totalCorrect: 0, totalQuestions: 0, lastResult: null });
    }
    const entry = map.get(key)!;
    entry.scores.push(r.percentage);
    entry.totalCorrect += r.score;
    entry.totalQuestions += r.total;
    if (!entry.lastResult || new Date(r.timestamp) > new Date(entry.lastResult.timestamp)) {
      entry.lastResult = r;
    }
  });

  let lb: LeaderboardEntry[] = [];
  map.forEach(v => {
    if (v.scores.length >= 5) {
      const avg = Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length);
      lb.push({
        name: v.name, phone: v.phone, class: v.class, examCount: v.scores.length,
        avgScore: avg,
        totalCorrect: v.totalCorrect,
        totalQuestions: v.totalQuestions,
        lastExamPct: v.lastResult?.percentage ?? avg,
        lastScore: v.lastResult?.score ?? 0,
        lastTotal: v.lastResult?.total ?? 0,
      });
    }
  });

  if (selectedClass !== 'All Classes') lb = lb.filter(e => e.class === selectedClass);
  lb.sort((a, b) => b.avgScore - a.avgScore || b.examCount - a.examCount);
  return lb;
}

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentStudent] = useState(storage.getCurrentStudent());
  const isTeacher = storage.isTeacherLoggedIn();
  const isStudent = storage.isStudentLoggedIn();

  useEffect(() => {
    setEntries(buildLeaderboard(storage.getResults(), selectedClass));
  }, [selectedClass]);

  const medals      = ['🥇', '🥈', '🥉'];
  const medalColors = ['#f0c040', '#a8a8b8', '#cd7f32'];

  const studentKey   = currentStudent ? `${currentStudent.name}|${currentStudent.phone}` : null;
  const studentEntry = entries.find(e => `${e.name}|${e.phone}` === studentKey);
  const studentRank  = studentEntry ? entries.indexOf(studentEntry) + 1 : null;
  const allResults   = currentStudent ? storage.getResultsForStudent(currentStudent.name, currentStudent.phone) : [];
  const hasEnough    = allResults.length >= 5;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <Navbar
        title="Leaderboard"
        rightContent={
          isTeacher ? (
            <button className="btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/teacher')}>
              ← Dashboard
            </button>
          ) : isStudent ? (
            <button className="btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/student')}>
              ← Dashboard
            </button>
          ) : (
            <button className="btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
              ← Home
            </button>
          )
        }
      />

      <div className="page-enter" style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '2rem', color: '#f0c040', marginBottom: '0.4rem' }}>
            Leaderboard
          </h1>
          <p style={{ color: 'rgba(201,184,255,0.45)', fontSize: '0.88rem' }}>
            Top performers · minimum 5 exams completed
          </p>
        </div>

        {/* Class Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {CLASSES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                style={{
                  background: selectedClass === c ? 'rgba(240,192,64,0.15)' : 'rgba(201,184,255,0.05)',
                  border: `1.5px solid ${selectedClass === c ? 'rgba(240,192,64,0.55)' : 'rgba(201,184,255,0.14)'}`,
                  color: selectedClass === c ? '#f0c040' : 'rgba(201,184,255,0.5)',
                  borderRadius: '8px',
                  padding: '0.38rem 0.85rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: selectedClass === c ? '700' : '400',
                  transition: 'all 0.18s ease',
                  fontFamily: 'Inter'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Student: not enough exams */}
        {isStudent && !isTeacher && !hasEnough && (
          <div className="glass" style={{
            padding: '1rem 1.5rem', marginBottom: '1.5rem',
            borderColor: 'rgba(240,192,64,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ color: '#f0c040', fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.2rem' }}>
                🔒 Complete 5 exams to appear on the leaderboard
              </p>
              <p style={{ color: 'rgba(201,184,255,0.45)', fontSize: '0.78rem' }}>
                {currentStudent?.name} — {allResults.length} / 5 exams done
              </p>
            </div>
            <div style={{
              background: 'rgba(240,192,64,0.12)', border: '1.5px solid rgba(240,192,64,0.3)',
              borderRadius: '10px', padding: '0.4rem 1rem',
              color: '#f0c040', fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.3rem'
            }}>
              {allResults.length}/5
            </div>
          </div>
        )}

        {/* Student: your rank */}
        {studentEntry && studentRank && (
          <div className="glass" style={{
            padding: '1rem 1.5rem', marginBottom: '1.75rem',
            borderColor: 'rgba(240,192,64,0.25)', background: 'rgba(240,192,64,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <p style={{ color: '#f0c040', fontWeight: '700', fontSize: '0.88rem' }}>Your Ranking</p>
                <p style={{ color: 'rgba(201,184,255,0.45)', fontSize: '0.78rem' }}>
                  {currentStudent?.name} · {currentStudent?.class}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.75rem', color: '#f0c040' }}>#{studentRank}</div>
                  <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.72rem', marginTop: '2px' }}>Rank</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.75rem', color: scoreColor(studentEntry.avgScore) }}>
                    {studentEntry.avgScore}%
                  </div>
                  <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.72rem', marginTop: '2px' }}>Avg Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.2rem', color: '#7ec8e3' }}>
                    {studentEntry.totalCorrect}/{studentEntry.totalQuestions}
                  </div>
                  <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.72rem', marginTop: '2px' }}>Total Correct</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {entries.length === 0 ? (
          <div className="glass empty-state">
            <span className="empty-icon">🏅</span>
            <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.95rem' }}>No students qualify yet</p>
            <p style={{ color: 'rgba(201,184,255,0.3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Complete 5 exams to appear here.
            </p>
          </div>
        ) : (
          <div className="glass" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr 90px 72px 1fr',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid rgba(201,184,255,0.1)',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              {['Rank', 'Student', 'Class', 'Tests', 'Score'].map(h => (
                <div key={h} style={{
                  color: 'rgba(201,184,255,0.45)',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  fontFamily: 'Inter'
                }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {entries.map((entry, i) => {
              const isMe  = `${entry.name}|${entry.phone}` === studentKey;
              const rank  = i + 1;
              const color = rank <= 3 ? medalColors[rank - 1] : 'rgba(230,225,255,0.87)';
              const pct   = entry.avgScore;
              const c     = scoreColor(pct);

              return (
                <div
                  key={i}
                  className="lb-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr 90px 72px 1fr',
                    padding: '0.85rem 1.25rem',
                    gap: '0.5rem',
                    alignItems: 'center',
                    borderBottom: i < entries.length - 1 ? '1px solid rgba(201,184,255,0.06)' : 'none',
                    background: isMe
                      ? 'rgba(240,192,64,0.06)'
                      : rank === 1 ? 'rgba(240,192,64,0.03)'
                      : rank === 2 ? 'rgba(160,160,176,0.03)'
                      : rank === 3 ? 'rgba(205,127,50,0.03)'
                      : 'transparent',
                    animationDelay: `${i * 0.06}s`,
                    transition: 'background 0.2s ease'
                  }}
                >
                  {/* Rank */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {rank <= 3 ? (
                      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{medals[rank - 1]}</span>
                    ) : (
                      <span style={{ fontFamily: 'Poppins', fontWeight: '700', color: 'rgba(201,184,255,0.4)', fontSize: '0.88rem' }}>
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <div style={{ fontFamily: 'Inter', fontWeight: '600', color, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {entry.name}
                      {isMe && <span style={{ fontSize: '0.7rem', color: '#f0c040', fontWeight: '500', opacity: 0.8 }}>you</span>}
                    </div>
                  </div>

                  {/* Class */}
                  <div style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.8rem' }}>
                    {entry.class}
                  </div>

                  {/* Test count */}
                  <div style={{ color: '#7ec8e3', fontWeight: '600', fontSize: '0.88rem' }}>
                    {entry.examCount}
                  </div>

                  {/* Score column — percentage + correct/total + bar */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontFamily: 'Poppins', fontWeight: '800', color: c, fontSize: '1rem' }}>
                        {pct}%
                      </span>
                      <span style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.74rem' }}>
                        {entry.totalCorrect}/{entry.totalQuestions} correct
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div style={{ height: '4px', background: 'rgba(201,184,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${c}, ${c}88)`,
                        borderRadius: '2px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: 'rgba(201,184,255,0.25)', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          Ranked by average score across all exams
        </p>
      </div>

      <Footer />
    </div>
  );
}
