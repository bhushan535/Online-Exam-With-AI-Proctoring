import React from "react";
import { useAuth } from "../../../context/AuthContext";
import "./TeacherHome.css";

// Import mode-specific dashboards
import SoloTeacherDashboard from "./SoloTeacherDashboard";
import OrgTeacherDashboard from "./OrgTeacherDashboard";

function TeacherHome() {
  const { user, org, token, logout } = useAuth();

  // If loading user data, show a brief state (though AuthContext handles most of this)
  if (!user) return (
    <div className="teacher-home-loading glass-premium">
      <div className="loader"></div>
      <p>Preparing your workspace...</p>
    </div>
  );

  const isSolo = user?.mode === 'solo';

  return (
    <div className={`teacher-home-orchestrator ${isSolo ? 'solo-mode-active' : 'org-mode-active'}`}>
      {isSolo ? (
        <SoloTeacherDashboard
          user={user}
          logout={logout}
          token={token}
        />
      ) : (
        <div className="teacher-home-container">
          {/* Header wrapper for Org Mode (shared top context if needed) */}
          <div className="top-bar">
            <div className="branding-header">
              {org?.logo ? (
                <img src={org.logo} alt="Org Logo" className="header-logo" />
              ) : (
                <div className="header-logo-placeholder">{org?.name?.charAt(0) || 'O'}</div>
              )}
              <div className="branding-info">
                <h1 className="welcome-text">
                  {org?.organizationName || org?.name || 'Academic Dashboard'}
                </h1>
                <div className="user-welcome-row">
                  <p className="user-welcome">Welcome back, {user?.name || "User"}</p>
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>

          <OrgTeacherDashboard
            user={user}
            org={org}
            token={token}
          />
        </div>
      )}
    </div>
  );
}

export default TeacherHome;
