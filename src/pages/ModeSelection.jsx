import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ModeSelection.css';

const ModeSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="mode-selection">
      <h1>Choose Your Mode</h1>

      <div className="mode-cards">
        {/* Solo Teacher Card */}
        <div
          className="mode-card"
          onClick={() => navigate('/signup/teacher-solo')}
        >
          <div className="icon">👨‍🏫</div>
          <h2>Solo Teacher</h2>
          <p>Individual tuition, coaching, or personal exams</p>
          <ul>
            <li>Full control over your classes</li>
            <li>Add students yourself</li>
            <li>Private exam management</li>
            <li>Perfect for tutors & coaches</li>
          </ul>
          <button>Start as Solo Teacher</button>
        </div>

        {/* Organization Card */}
        <div
          className="mode-card"
          onClick={() => navigate('/signup/principal')}
        >
          <div className="icon">🏫</div>
          <h2>Organization</h2>
          <p>Schools, colleges, universities</p>
          <ul>
            <li>Multi-teacher collaboration</li>
            <li>Principal dashboard</li>
            <li>Shared student database</li>
            <li>Department-wise management</li>
          </ul>
          <button>Create Organization</button>
        </div>
      </div>

      <p className="login-link">
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default ModeSelection;
