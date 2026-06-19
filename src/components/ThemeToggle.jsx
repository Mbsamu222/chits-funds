import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      style={{
        position: 'relative',
        width: '56px',
        height: '30px',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        padding: '3px',
        background: isLight
          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isLight
          ? '0 2px 8px rgba(245, 158, 11, 0.3)'
          : '0 2px 8px rgba(99, 102, 241, 0.3)',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Sliding Circle */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transform: isLight ? 'translateX(26px)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLight ? (
          <FiSun style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
        ) : (
          <FiMoon style={{ width: '14px', height: '14px', color: '#6366f1' }} />
        )}
      </div>

      {/* Background Icons */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 7px',
          pointerEvents: 'none',
        }}
      >
        <FiMoon
          style={{
            width: '12px',
            height: '12px',
            color: 'white',
            opacity: isLight ? 0.3 : 0,
            transition: 'opacity 0.3s',
          }}
        />
        <FiSun
          style={{
            width: '12px',
            height: '12px',
            color: 'white',
            opacity: isLight ? 0 : 0.3,
            transition: 'opacity 0.3s',
          }}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
