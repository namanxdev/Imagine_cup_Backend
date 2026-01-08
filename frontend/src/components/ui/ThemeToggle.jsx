import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <motion.button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      whileTap={{ scale: 0.95 }}
      className={`
        relative p-3 rounded-full flex items-center justify-center
        transition-all duration-300
        bg-neu-base dark:bg-neu-base-dark
        shadow-neu-flat dark:shadow-neu-flat-dark
        text-neu-text dark:text-neu-text-dark
        hover:text-primary dark:hover:text-blue-400
      `}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-6 h-6" />
      ) : (
        <Moon className="w-6 h-6" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;
