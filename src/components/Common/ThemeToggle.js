import React, { useEffect, useState } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <HiSun /> : <HiMoon />}
    </button>
  );
};

export default ThemeToggle;
