
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ExamCreator from '@/components/ExamCreator';
import { ToastContainer, showToast } from '@/components/Toast';
import { storage, Exam } from '@/lib/storage';

export default function TeacherDashboard() {
  const [, navigate] = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [notifications, setNotifications] = useState(storage.getNotifications());
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!storage.isTeacherLoggedIn()) { navigate('/'); return; }
    setExams(storage.getExams());
    setUnread(storage.getUnreadCount());
  }, []);

  const handleLogout = () => {
    storage.logoutTeacher();
    navigate('/');
  };

  const openNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      storage.markAllNotificationsRead();
      setUnread(0);
      setNotifications(storage.getNotifications());
    }
  };

  const handlePublish = (exam: Exam) => {
    storage.addExam(exam);
    setExams(storage.getExams());
    showToast(`Exam "${exam.title}" published successfully!`, 'success');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <ToastContainer />

      <Navbar
        title=""
        showLogout
        onLogout={handleLogout}
        rightContent={
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              className="btn-outline"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => navigate('/analytics')}
            >
              📈 Analytics
            </button>
            <button
              className="btn-outline"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => navigate('/leaderboard')}
            >
              🏆 Leaderboard
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className="btn-outline"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={openNotif}
              >
                🔔 Notifications
              </button>
              {unread > 0 && (
                <div className="badge-count">{unread > 9 ? '9+' : unread}</div>
              )}
            </div>
          </div>
        }
      />

      {/* Notification Panel */}
      {notifOpen && (
        <div className="page-enter" style={{
          position: 'fixed', top: '70px', right: '1.5rem',
          background: 'rgba(22,33,62,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,184,255,0.2)',
          borderRadius: '16px',
          padding: '1.25rem',
          zIndex: 200,
          width: '360px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'Poppins', fontWeight: '600', color: '#c9b8ff', fontSize: '0.95rem' }}>
              Recent Submissions
            </span>
            <button style={{ background: 'none', border: 'none', color: 'rgba(201,184,255,0.5)', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setNotifOpen(false)}>×</button>
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <span className="empty-icon">📭</span>
              <p style={{ fontSize: '0.88rem' }}>No submissions yet</p>
            </div>
          ) : notifications.map((n, i) => (
            <div key={i} style={{
              background: n.exitViolation ? 'rgba(255,60,60,0.07)' : 'rgba(201,184,255,0.06)',
              border: `1px solid ${n.exitViolation ? 'rgba(255,80,80,0.3)' : 'rgba(201,184,255,0.12)'}`,
              borderRadius: '10px',
              padding: '0.9rem',
              marginBottom: '0.6rem',
              position: 'relative'
            }}>
              {n.exitViolation && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(255,60,60,0.18)',
                  border: '1px solid rgba(255,80,80,0.4)',
                  borderRadius: '6px',
                  padding: '0.15rem 0.55rem',
                  color: '#ff7070',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  letterSpacing: '0.03em'
                }}>
                  ⚠️ Exam Exited
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: '600', color: n.exitViolation ? '#ffaaaa' : 'rgba(230,225,255,0.9)', fontSize: '0.9rem' }}>
                  {n.studentName}
                </span>
                <span style={{
                  color: n.percentage >= 70 ? '#48c78e' : n.percentage >= 50 ? '#f0c040' : '#ff6b6b',
                  fontWeight: '700', fontSize: '0.9rem'
                }}>
                  {n.percentage}%
                </span>
              </div>
              {n.exitViolation && n.violationType && (
                <div style={{ color: 'rgba(255,150,150,0.65)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Violation: {n.violationType}
                </div>
              )}
              <div style={{ color: 'rgba(201,184,255,0.55)', fontSize: '0.8rem' }}>
                {n.studentClass} • {n.examTitle} • {n.score}/{n.total}
              </div>
              <div style={{ color: 'rgba(201,184,255,0.35)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {new Date(n.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="page-enter" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Exam Creator */}
        <ExamCreator onPublish={handlePublish} />

        {/* My Exams */}
        <div>
          <h2 style={{ fontFamily: 'Poppins', fontWeight: '700', fontSize: '1.4rem', color: '#c9b8ff', marginBottom: '1.25rem' }}>
            📚 My Exams
          </h2>

          {exams.length === 0 ? (
            <div className="glass empty-state">
              <span className="empty-icon">📋</span>
              <p style={{ color: 'rgba(201,184,255,0.5)', fontSize: '0.95rem' }}>No exams published yet. Create your first exam above!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {exams.map(exam => (
                <div key={exam.id} className="glass" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'Poppins', fontWeight: '600', color: 'rgba(230,225,255,0.95)', fontSize: '1rem', lineHeight: '1.3' }}>
                      {exam.title}
                    </h3>
                    <span className="status-active">Active</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(201,184,255,0.6)' }}>
                    <span>📚 {exam.class}</span>
                    <span>⏱ {exam.timerMinutes} min</span>
                    <span>❓ {exam.questions.length} Qs</span>
                    {exam.questions.some(q => q.image) && <span>📸 has images</span>}
                  </div>
                  <div style={{ marginTop: '0.5rem', color: 'rgba(201,184,255,0.4)', fontSize: '0.75rem' }}>
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
