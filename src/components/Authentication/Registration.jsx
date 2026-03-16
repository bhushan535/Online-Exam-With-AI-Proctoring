import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from "../Common/BackButton";
import { 
  FaUser, FaEnvelope, FaLock, FaPhone, 
  FaBuilding, FaMapMarkerAlt, FaGraduationCap 
} from 'react-icons/fa';
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
    <div className="reg-overlay">
      <div className="reg-glass-card">
        <BackButton to="/" />
        <div className="reg-header">
          <div className="reg-icon-wrapper">
            <FaGraduationCap />
          </div>
          <h2>{role === 'principal' ? 'Institution Roster' : 'Faculty Onboarding'}</h2>
          <p>Create your administrative profile to begin</p>
        </div>
        
        <form onSubmit={handleSubmit} className="reg-form-premium">
          <div className="reg-grid">
            <div className="reg-input-group">
              <label><FaUser /> Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Dr. John Carter"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reg-input-group">
              <label><FaEnvelope /> Institutional Email</label>
              <input
                type="email"
                name="email"
                placeholder="name@institution.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="reg-input-group">
              <label><FaLock /> Access Security</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <div className="reg-input-group">
              <label><FaPhone /> Contact Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            {role === 'principal' && (
              <>
                <div className="reg-input-group full-width">
                  <label><FaBuilding /> Organization Identity</label>
                  <input
                    type="text"
                    name="orgName"
                    placeholder="Official Institution Name"
                    value={formData.orgName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="reg-input-group">
                  <label><FaBuilding /> Registry Type</label>
                  <select
                    name="orgType"
                    value={formData.orgType}
                    onChange={handleChange}
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="institute">Coaching Institute</option>
                    <option value="other">Other Entity</option>
                  </select>
                </div>

                <div className="reg-input-group full-width">
                  <label><FaMapMarkerAlt /> Physical Address</label>
                  <textarea
                    name="address"
                    placeholder="Complete headquarters or campus address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {error && <div className="reg-error-toast">{error}</div>}

          <div className="reg-footer">
            <button className="reg-submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="loader-small"></span>
              ) : (
                <>Establish Account</>
              )}
            </button>

            <p className="reg-switch-link">
              Already have an account? <a href="/login">Authenticate Here</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
