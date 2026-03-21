import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { BASE_URL } from '../../../config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { motion } from 'framer-motion';
import { FaChartLine, FaUsers, FaUserGraduate, FaFileAlt, FaChartPie, FaChartBar } from 'react-icons/fa';
import BackButton from "../../Common/BackButton";
import "./Analytics.css";

const Analytics = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${BASE_URL}/principal/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setData(result.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  if (loading) return (
    <div className="analytics-loading">
        <div className="pulse-loader"></div>
        <p>Synthesizing institutional intelligence...</p>
    </div>
  );
  
  if (!data) return (
    <div className="analytics-error">
        <FaChartLine />
        <h3>Data Unavailable</h3>
        <p>No analytics patterns detected for this cycle.</p>
        <BackButton to="/TeacherHome" />
    </div>
  );

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1><FaChartLine /> Institutional Analytics</h1>
        <p>Real-time data insights for your organization</p>
      </header>

      <div className="charts-grid">
        {/* Branch Distribution */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3><FaUsers /> Students by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.branchStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1a73e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Grade Distribution */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3><FaFileAlt /> Result Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.gradeStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="_id"
                label
              >
                {data.gradeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Exam Status */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3><FaUserGraduate /> Exam Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.examStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="_id" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Participation Stats */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3><FaUsers /> Participation Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.participationStats}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="_id"
                label
              >
                {data.participationStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry._id === 'active' ? '#10b981' : '#f43f5e'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Subject Performance */}
        <motion.div 
          className="chart-card wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3><FaFileAlt /> Subject Performance (Avg Score)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="_id" angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
