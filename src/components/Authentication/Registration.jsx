import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Registration.css';

const Registration = ({ role, mode }) => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    // Principal specific
    orgName: '',
    orgType: 'School',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const type = mode === 'solo' ? 'teacher-solo' : 'principal';
      await signup(formData, type);
      navigate('/TeacherHome');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-container">
      <div className="reg-box">
        <h2>{role === 'principal' ? 'Organization Registration' : 'Teacher Registration'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              className="reg-input"
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              className="reg-input"
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              className="reg-input"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <input
              className="reg-input"
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {role === 'principal' && (
            <>
              <div className="form-group">
                <input
                  className="reg-input"
                  type="text"
                  name="orgName"
                  placeholder="Organization/School Name"
                  value={formData.orgName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <select
                  className="reg-input"
                  name="orgType"
                  value={formData.orgType}
                  onChange={handleChange}
                >
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="coaching">Coaching Institute</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <textarea
                  className="reg-input"
                  name="address"
                  placeholder="Organization Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {error && <p className="error-msg">{error}</p>}

          <button className="reg-btn" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="reg-hypertext">
          Already Registered? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Registration;
