
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
}

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentStudent, setCurrentStudent] = useState(storage.getCurrentStudent());

  useEffect(() => {
    const student = storage.getCurrentStudent();
    if (student) setCurrentStudent(student);
    computeLeaderboard();
  }, [selectedClass]);

  const computeLeaderboard = () => {
    const results = storage.getResults();
    const map = new Map<string, { name: string; phone: string; class: string; scores: number[] }>();

    results.forEach(r => {
      const key = `${r.studentName}|${r.studentPhone}`;
      if (!map.has(key)) {
        map.set(key, { name: r.studentName, phone: r.studentPhone, class: r.studentClass, scores: [] });
      }
      map.get(key)!.scores.push(r.percentage);
    });

    let lb: LeaderboardEntry[] = [];
    map.forEach(v => {
      if (v.scores.length >= 5) {
        const avg = Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length);
        lb.push({ name: v.name, phone: v.phone, class: v.class, examCount: v.scores.length, avgScore: avg });
      }
    });

    if (selectedClass !== 'All Classes') {
      lb = lb.filter(e => e.class === selectedClass);
    }

    lb.sort((a, b) => b.avgScore - a.avgScore || b.examCount - a.examCount);
    setEntries(lb);
  };

  const medals = ['🥇', '🥈', '🥉'];
  const medalColors = ['#f0c040', '#a0a0b0', '#cd7f32'];

  const student = currentStudent;
  const studentKey = student ? `${student.name}|${student.phone}` : null;
  const studentEntry = entries.find(e => `${e.name}|${e.phone}` === studentKey);
  const studentRank = studentEntry ? entries.indexOf(studentEntry) + 1 : null;

  const allResults = student ? storage.getResultsForStudent(student.name, student.phone) : [];
  const hasEnough = allResults.length >= 5;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <Navbar
        title="Class Leaderboard"
        rightContent={
          storage.isStudentLoggedIn() ? (
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

      <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '2rem', color: '#f0c040', marginBottom: '0.5rem' }}>
            Leaderboard
          </h1>
          <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.9rem' }}>
            Top performers with 5+ exams completed
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {CLASSES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                style={{
                  background: selectedClass === c ? 'rgba(240,192,64,0.2)' : 'rgba(201,184,255,0.06)',
                  border: `1.5px solid ${selectedClass === c ? 'rgba(240,192,64,0.6)' : 'rgba(201,184,255,0.15)'}`,
                  color: selectedClass === c ? '#f0c040' : 'rgba(201,184,255,0.55)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.9rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: selectedClass === c ? '600' : '400',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Student Status Banner */}
        {student && !hasEnough && (
          <div className="glass" style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            borderColor: 'rgba(240,192,64,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ color: '#f0c040', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                🔒 Complete 5 exams to appear on the leaderboard!
              </p>
              <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.8rem' }}>
                {student.name} — {allResults.length}/5 exams completed
              </p>
            </div>
            <div style={{
              background: 'rgba(240,192,64,0.15)',
              border: '1.5px solid rgba(240,192,64,0.3)',
              borderRadius: '10px',
              padding: '0.5rem 1rem',
              color: '#f0c040',
              fontFamily: 'Poppins',
              fontWeight: '700',
              fontSize: '1.3rem'
            }}>
              {allResults.length}/5
            </div>
          </div>
        )}

        {/* Your Rank Banner */}
        {studentEntry && studentRank && (
          <div className="glass" style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            borderColor: 'rgba(240,192,64,0.3)',
            background: 'rgba(240,192,64,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <p style={{ color: '#f0c040', fontWeight: '600', fontSize: '0.9rem' }}>
                  Your Ranking
                </p>
                <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.82rem' }}>{student?.name} — {student?.class}</p>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.75rem', color: '#f0c040' }}>
                    #{studentRank}
                  </div>
                  <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.75rem' }}>Rank</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Poppins', fontWeight: '800', fontSize: '1.75rem', color: '#7ec8e3' }}>
                    {studentEntry.avgScore}%
                  </div>
                  <div style={{ color: 'rgba(201,184,255,0.4)', fontSize: '0.75rem' }}>Avg Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {entries.length === 0 ? (
          <div className="glass empty-state">
            <span className="empty-icon">🏅</span>
            <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.95rem' }}>
              No students qualify yet!
            </p>
            <p style={{ color: 'rgba(201,184,255,0.35)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Complete 5 exams to appear on the leaderboard.
            </p>
          </div>
        ) : (
          <div className="glass" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201,184,255,0.12)' }}>
                    {['Rank', 'Student', 'Class', 'Tests Taken', 'Avg Score'].map(h => (
                      <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'rgba(201,184,255,0.6)', fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const isMe = `${entry.name}|${entry.phone}` === studentKey;
                    const rank = i + 1;
                    const rowColor = rank <= 3 ? medalColors[rank - 1] : 'rgba(230,225,255,0.85)';
                    return (
                      <tr
                        key={i}
                        className="lb-row"
                        style={{
                          borderBottom: '1px solid rgba(201,184,255,0.06)',
                          animationDelay: `${i * 0.07}s`,
                          background: isMe ? 'rgba(240,192,64,0.05)' : rank <= 3 ? `rgba(${rank === 1 ? '240,192,64' : rank === 2 ? '160,160,176' : '205,127,50'},0.04)` : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.9rem 1rem' }}>
                          {rank <= 3 ? (
                            <span style={{ fontSize: '1.4rem' }}>{medals[rank - 1]}</span>
                          ) : (
                            <span style={{ fontFamily: 'Poppins', fontWeight: '600', color: 'rgba(201,184,255,0.5)', fontSize: '0.9rem' }}>#{rank}</span>
                          )}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{ fontFamily: 'Inter', fontWeight: '600', color: rowColor, fontSize: '0.9rem' }}>
                            {entry.name}
                            {isMe && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#f0c040', fontWeight: '400' }}>(you)</span>}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: 'rgba(201,184,255,0.55)', fontSize: '0.85rem' }}>
                          {entry.class}
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: '#7ec8e3', fontWeight: '600', fontSize: '0.9rem' }}>
                          {entry.examCount}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontFamily: 'Poppins', fontWeight: '700', color: entry.avgScore >= 70 ? '#48c78e' : entry.avgScore >= 50 ? '#f0c040' : '#ff6b6b', fontSize: '0.95rem' }}>
                              {entry.avgScore}%
                            </span>
                            <div style={{ flex: 1, height: '5px', background: 'rgba(201,184,255,0.08)', borderRadius: '3px', minWidth: '60px' }}>
                              <div style={{
                                height: '100%',
                                width: `${entry.avgScore}%`,
                                background: `linear-gradient(90deg, ${entry.avgScore >= 70 ? '#48c78e' : entry.avgScore >= 50 ? '#f0c040' : '#ff6b6b'}, transparent)`,
                                borderRadius: '3px'
                              }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
