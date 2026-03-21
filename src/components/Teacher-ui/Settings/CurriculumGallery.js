import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { BASE_URL } from "../../../config";
import "./CurriculumGallery.css";
import BackButton from "../../Common/BackButton";
import { 
  FaLayerGroup, 
  FaBook, 
  FaSearch, 
  FaFilter,
  FaGraduationCap
} from "react-icons/fa";

function CurriculumGallery() {
  const { org, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");

  const branches = org?.branches || [];
  const semesters = org?.semesters || [];
  const subjects = org?.subjects || [];

  const filteredBranches = selectedBranch === "All" 
    ? branches 
    : branches.filter(b => b === selectedBranch);

  return (
    <div className="curriculum-gallery-container">
      <BackButton to="/TeacherHome" />
      
      <div className="gallery-header">
        <div className="header-content">
          <h1><FaLayerGroup className="header-icon" /> Institutional Curriculum</h1>
          <p>Explore branches, semesters, and subjects configured by the Principal.</p>
        </div>

        <div className="gallery-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search subjects or codes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="All">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="curriculum-main-grid">
        {filteredBranches.length > 0 ? (
          filteredBranches.map(branch => {
            // Check if there are subjects in ANY semester for this branch that match the search
            const branchMatchesSearch = semesters.some(sem => {
              const semSubjs = subjects.filter(s => 
                s.branch === branch && 
                s.semester === sem && 
                (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))
              );
              return semSubjs.length > 0;
            }) || searchTerm === "";

            if (!branchMatchesSearch) return null;

            return (
              <div key={branch} className="branch-section-card">
                <div className="branch-section-header">
                  <FaGraduationCap className="branch-icon" />
                  <h2>{branch} Department</h2>
                </div>
                
                <div className="semesters-stack">
                  {semesters.map(sem => {
                    const semSubjs = subjects.filter(s => 
                      s.branch === branch && 
                      s.semester === sem &&
                      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (semSubjs.length === 0 && searchTerm !== "") return null;

                    return (
                      <div key={sem} className="semester-group">
                        <div className="semester-label">Semester {sem}</div>
                        <div className="subjects-grid">
                          {semSubjs.length > 0 ? (
                            semSubjs.map(sub => (
                              <div key={sub.code} className="subject-premium-card">
                                <div className="sub-icon"><FaBook /></div>
                                <div className="sub-details">
                                  <span className="sub-name">{sub.name}</span>
                                  <code className="sub-code">{sub.code}</code>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="empty-subjects">No subjects defined</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-data-gallery">
            <FaLayerGroup className="large-icon" />
            <h3>No Curriculum Defined</h3>
            <p>Please configure branches and subjects in Organization Settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CurriculumGallery;
