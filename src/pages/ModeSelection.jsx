import { useNavigate, Link } from 'react-router-dom';
import { FaUserPlus, FaBuilding, FaArrowRight, FaCheckCircle, FaUserShield } from 'react-icons/fa';
import BackButton from "../components/Common/BackButton";
import './ModeSelection.css';

const ModeSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="mode-selection-overlay">
      <div className="mode-selection-container">
        <BackButton to="/" />

        <div className="mode-hero">
          <div className="mode-badge">Institutional Ecosystem</div>
          <h1>Choose Your Registry Mode</h1>
          <p>Select the registration path that aligns with your institutional role</p>
        </div>

        <div className="mode-cards-premium">
          {/* Solo Teacher Card */}
          <div className="mode-glass-card solo" onClick={() => navigate('/signup/teacher-solo')}>
            <div className="card-accent" />
            <div className="mode-icon-box">
              <FaUserPlus />
            </div>
            <h2>Private Account</h2>
            <p>Individual practitioners and personal exam management</p>
            <ul className="mode-features">
              <li><FaCheckCircle className="check" /> Independent Class Control</li>
              <li><FaCheckCircle className="check" /> Manual Student Enrollment</li>
              <li><FaCheckCircle className="check" /> Private Question Banks</li>
            </ul>
            <button className="mode-primary-btn">Register <FaArrowRight /></button>
          </div>

          {/* Organization Card */}
          <div className="mode-glass-card principal" onClick={() => navigate('/signup/principal')}>
            <div className="card-accent" />
            <div className="mode-icon-box">
              <FaBuilding />
            </div>
            <h2>Organization Account</h2>
            <p>Formal academic entities and multi-teacher departments</p>
            <ul className="mode-features">
              <li><FaCheckCircle className="check" /> Faculty Hierarchy Control</li>
              <li><FaCheckCircle className="check" /> Manage Curriculum</li>
              <li><FaCheckCircle className="check" /> Handle Organization as a Principal</li>
            </ul>
            <button className="mode-primary-btn">Register Organization<FaArrowRight /></button>
          </div>
        </div>

        <div className="mode-bottom-cta">
          <p>Already registered?</p>
          <Link to="/login" className="mode-login-btn">
            Account Authentication <FaArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
