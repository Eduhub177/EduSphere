
import { useLocation } from 'wouter';

interface NavbarProps {
  title?: string;
  showLogout?: boolean;
  onLogout?: () => void;
  rightContent?: React.ReactNode;
}

export default function Navbar({ title, showLogout, onLogout, rightContent }: NavbarProps) {
  const [, navigate] = useLocation();

  return (
    <nav className="navbar">
      <div
        className="logo-text cursor-pointer select-none"
        onClick={() => navigate('/')}
        style={{ fontSize: '1.3rem' }}
      >
        ⬡ EduSphere
      </div>
      {title && (
        <div style={{ color: 'rgba(201,184,255,0.6)', fontFamily: 'Inter', fontSize: '0.9rem' }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {rightContent}
        {showLogout && (
          <button className="btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
