import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return res.data;
  };

  const signup = async (userData, type) => {
    const endpoint = type === 'teacher-solo'
      ? '/api/auth/signup/teacher-solo'
      : '/api/auth/signup/principal';
    const res = await axios.post(endpoint, userData);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
    isPrincipal: user?.role === 'principal',
    isStudent: user?.role === 'student',
    isSoloMode: user?.mode === 'solo',
    isOrgMode: user?.mode === 'organization',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
