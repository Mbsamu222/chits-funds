import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-slate-700 dark:bg-slate-600 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sliding Circle */}
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
          theme === 'light' ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {theme === 'light' ? (
          <FiSun className="w-3 h-3 text-amber-500" />
        ) : (
          <FiMoon className="w-3 h-3 text-indigo-600" />
        )}
      </div>
      
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <FiMoon className={`w-3 h-3 transition-opacity duration-300 ${theme === 'dark' ? 'text-slate-400 opacity-70' : 'text-slate-500 opacity-30'}`} />
        <FiSun className={`w-3 h-3 transition-opacity duration-300 ${theme === 'light' ? 'text-amber-400 opacity-70' : 'text-amber-500 opacity-30'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
