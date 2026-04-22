
export default function Footer() {
  return (
    <footer style={{
      background: '#0d0d1a',
      borderTop: '0.5px solid rgba(201,184,255,0.35)',
      boxShadow: '0 -1px 20px rgba(201,184,255,0.08)',
      padding: '1.75rem 1.5rem 1.5rem',
      textAlign: 'center',
      fontFamily: 'Inter, sans-serif',
      animation: 'fadeIn 0.8s ease both',
      animationDelay: '0.3s',
    }}>
      {/* Owner line */}
      <p style={{
        fontSize: '0.8rem',
        letterSpacing: '0.06em',
        fontVariant: 'small-caps',
        marginBottom: '0.45rem',
        color: 'rgba(201,184,255,0.55)',
        fontStyle: 'italic',
        fontWeight: '300',
      }}>
        This website belongs to{'  '}
        <span style={{ letterSpacing: '0.04em' }}>✦</span>
        {'  '}
        <span style={{
          background: 'linear-gradient(90deg, #c9b8ff, #7ec8e3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '600',
          fontStyle: 'normal',
          fontSize: '0.85rem',
          letterSpacing: '0.05em',
        }}>
          Tarun Kanti Shib
        </span>
      </p>

      {/* Developer line */}
      <p style={{
        fontSize: '0.72rem',
        color: 'rgba(201,184,255,0.3)',
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
      }}>
        <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>&lt;/&gt;</span>
        <span>
          Developed with ❤️ by{' '}
          <span className="shimmer-text" style={{ fontWeight: '500', letterSpacing: '0.06em' }}>
            Sreshtangshu Gope
          </span>
        </span>
      </p>
    </footer>
  );
}
