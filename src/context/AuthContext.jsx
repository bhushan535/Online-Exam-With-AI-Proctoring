import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

// BASE_URL is http://localhost:5000/api
axios.defaults.baseURL = BASE_URL.replace(/\/api$/, ''); 

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
  const [org, setOrg] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
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
      if (res.data.organization) setOrg(res.data.organization);
      if (res.data.teacherProfile) setTeacherProfile(res.data.teacherProfile);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const refreshOrg = async () => {
    if (!token) return;
    try {
      const detailRes = await axios.get('/api/org/details');
      if (detailRes.data.success) {
        setOrg(detailRes.data.organization);
      }
    } catch (error) {
      console.error('Failed to refresh organization data:', error);
    }
  };

  const login = async (email, password, role, mode) => {
    const res = await axios.post('/api/auth/login', { email, password, role, mode });
    const { token, user, organization, teacherProfile } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setToken(token);
    setUser(user);
    if (organization) setOrg(organization);
    if (teacherProfile) setTeacherProfile(teacherProfile);
    return res.data;
  };

  const studentLogin = async (enrollment, password) => {
    const res = await axios.post('/api/student/login', { enrollment, password });
    const { token, user, organization } = res.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setToken(token);
    setUser(user);
    if (organization) setOrg(organization);
    
    // Legacy support for components that look for "student" in localStorage
    localStorage.setItem('student', JSON.stringify({
      ...user,
      enrollment: user.enrollment || enrollment
    }));
    
    return res.data;
  };

  const signup = async (userData, type) => {
    const endpoint = type === 'teacher-solo'
      ? '/api/auth/signup/teacher-solo'
      : '/api/auth/signup/principal';
    const res = await axios.post(endpoint, userData);
    const { token, user, organization, teacherProfile } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setToken(token);
    setUser(user);
    if (organization) setOrg(organization);
    if (teacherProfile) setTeacherProfile(teacherProfile);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('student');
    setToken(null);
    setUser(null);
    setOrg(null);
    setTeacherProfile(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    org,
    teacherProfile,
    token,
    loading,
    login,
    studentLogin,
    signup,
    logout,
    refreshOrg,
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
