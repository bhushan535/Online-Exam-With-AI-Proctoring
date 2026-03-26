import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HiSun, HiMoon } from 'react-icons/hi';
import './ThemeToggle.css';

// Routes where the theme toggle should be hidden (exam-taking flow)
const HIDDEN_ROUTES = ['/attempt-exam/', '/exam-countdown/', '/camera-check/'];

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Hide on exam routes to prevent overlapping with Submit button and proctoring UI
  const isHidden = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
  if (isHidden) return null;

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
