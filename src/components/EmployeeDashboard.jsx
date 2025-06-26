import React, { useState } from 'react';
import ResultTable from './ResultTable';
import EntityTable from './EntityTable';
import './EmployeeDashboard.css';

// --- Skill name to code mapping (expand as needed) ---
const skillNameToCode = {
  '5S': 'sk01',
  // Add more mappings as needed
};

// --- Helper: Convert level number to code string ---
const levelToCode = (level) => `l${level}`;

/**
 * EmployeeDashboard component
 * Shows employee info, required skills/tests, and allows test taking
 */
const EmployeeDashboard = ({
  employeeInfo,
  employeeRoles,
  employeeSkills,
  selectedRole,
  setSelectedRole,
  roles,
  roleCompetencies,
  competencies,
  competencyMap
}) => {
  // --- State ---
  const [clickedTests, setClickedTests] = useState([]); // Track test button clicks
  const [testQuestions, setTestQuestions] = useState(null); // MCQ questions for modal
  const [testSkill, setTestSkill] = useState(null); // Current skill for modal
  const [loadingTest, setLoadingTest] = useState(false); // Loading state for test fetch
  const [testClickCounts, setTestClickCounts] = useState({}); // Click count per test
  const [showAllResults, setShowAllResults] = useState(false); // Show all results table
  const [allResults, setAllResults] = useState([]); // All employee results

  // --- Handle test button click: increment counter and open JotForm ---
  const handleTestClick = async (idx, skill, level) => {
    setTestClickCounts((prev) => {
      const newCount = (prev[idx] || 0) + 1;
      // Log button click details
      console.log(`Take Test clicked: Skill='${skill}', Level='${level}', Click Count=${newCount}`);
      return { ...prev, [idx]: newCount };
    });
    // Redirect to JotForm for any skill
    const empName = encodeURIComponent(employeeInfo?.name || '');
    const skillParam = encodeURIComponent(skill);
    const levelParam = encodeURIComponent(level);
    const url = `https://cdn.jotfor.ms/250913387928064?&emp=${empName}&competencyTopic=${skillParam}-${levelParam}`;
    window.open(url, '_blank');
    return;
    // --- (Unused: fetch MCQ test from backend) ---
    // setLoadingTest(true);
    // setTestSkill(`${skill} (Level ${level})`);
    // const skillCode = skillNameToCode[skill] || skill;
    // const levelCode = levelToCode(level);
    // try {
    //   const res = await fetch(`/api/test/get-test/${encodeURIComponent(skillCode)}/${encodeURIComponent(levelCode)}`);
    //   const questions = await res.json();
    //   setTestQuestions(questions);
    // } catch (e) {
    //   setTestQuestions([]);
    // }
    // setLoadingTest(false);
  };

  // --- Close MCQ Test Modal ---
  const closeTestModal = () => {
    setTestQuestions(null);
    setTestSkill(null);
  };

  // --- Filter skills by selected role using competencyMap if available ---
  let filteredSkills = employeeSkills;
  if (selectedRole && competencyMap && competencyMap.data && competencyMap.headers) {
    // Find the row for the selected role
    const row = competencyMap.data.find(r => r.Role && r.Role.trim().toLowerCase() === selectedRole.trim().toLowerCase());
    if (row) {
      // Get all skill columns with a number (not empty or '-')
      const requiredSkills = competencyMap.headers.filter(h => h !== 'Role' && row[h] && !isNaN(Number(row[h])));
      filteredSkills = employeeSkills.filter(s => requiredSkills.includes(s.skill));
      // Add missing skills from map if not in employeeSkills
      if (filteredSkills.length < requiredSkills.length) {
        const missing = requiredSkills.filter(skill => !filteredSkills.some(s => s.skill === skill));
        filteredSkills = filteredSkills.concat(missing.map(skill => ({ skill, level: row[skill] })));
      }
    } else {
      filteredSkills = [];
    }
  }

  // --- Helper: check if user is CEO, Director, or HR (superuser) ---
  const isSuperUser = employeeRoles.some(role => {
    const r = role.toLowerCase();
    return r.includes('ceo') || r.includes('director') || r.includes('hr');
  });

  // --- Fetch all employee results (for superusers) ---
  const handleShowAllResults = async () => {
    const res = await fetch('/api/employee_assessment_results/all');
    const data = await res.json();
    setAllResults(data);
    setShowAllResults(true);
  };

  // --- Render ---
  return (
    <div className="employee-dashboard-root">
      {/* --- Main Card --- */}
      <div className="employee-dashboard-card">
        <h2 className="employee-dashboard-title">Welcome!</h2>
        {/* --- Name Row --- */}
        <div className="employee-dashboard-row">
          <div className="employee-dashboard-label">Name:</div>
          <div className="employee-dashboard-value">{employeeInfo?.name || 'N/A'}</div>
        </div>
        {/* --- Designations/Roles Row --- */}
        <div className="employee-dashboard-row" style={{alignItems: employeeRoles && employeeRoles.length > 1 ? 'flex-start' : 'center'}}>
          <div className="employee-dashboard-label">Designations/Roles:</div>
          <div className="employee-dashboard-value">
            {employeeRoles && employeeRoles.length > 0 ? (
              employeeRoles.length === 1 ? (
                <span>{employeeRoles[0]}</span>
              ) : (
                <ul className="employee-dashboard-list">
                  {employeeRoles.map((role, idx) => (
                    <li key={idx}>{role}</li>
                  ))}
                </ul>
              )
            ) : (
              <span>{employeeInfo?.department || 'N/A'}</span>
            )}
          </div>
        </div>
        {/* --- Required Skills/Tests Section --- */}
        <div className="employee-dashboard-skills-section">
          <strong>Required Skills/Tests{selectedRole ? ` for ${selectedRole}` : ''}:</strong>
          <ul className="employee-dashboard-skills-list">
            {filteredSkills && filteredSkills.length > 0 ? (
              filteredSkills.map((s, idx) => (
                <li key={idx} className="employee-dashboard-skill-item">
                  <span className="employee-dashboard-skill-label">
                    {s.skill} <span className="employee-dashboard-skill-level">(Level: {s.level})</span>
                  </span>
                  <button
                    className="employee-dashboard-btn"
                    onClick={() => handleTestClick(idx, s.skill, s.level)}
                  >
                    Take Test
                  </button>
                  {testClickCounts[idx] ? (
                    <span className="employee-dashboard-click-count">
                      Clicked {testClickCounts[idx]} times
                    </span>
                  ) : null}
                </li>
              ))
            ) : (
              <li>No skills/tests found.</li>
            )}
          </ul>
        </div>
      </div>

      {/* --- MCQ Test Modal --- */}
      {testQuestions && (
        <div className="employee-dashboard-modal-bg">
          <div className="employee-dashboard-modal">
            <h3 className="employee-dashboard-modal-title">
              MCQ Test: {testSkill}
            </h3>
            {testQuestions.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                No questions found for this skill/level.
              </div>
            ) : (
              <ol style={{ paddingLeft: 18 }}>
                {testQuestions.map((q, i) => (
                  <li key={q.QuestionID || i} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {q.Question || q.question}
                    </div>
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                      {[q.Option1, q.Option2, q.Option3, q.Option4].map((opt, j) => (
                        <li key={j} style={{ marginBottom: 2 }}>
                          <input type="radio" name={`q${i}`} /> {opt}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
            <button
              className="employee-dashboard-modal-close"
              onClick={closeTestModal}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- Superuser: View All Employee Performance Button --- */}
      {isSuperUser && (
        <div>
          <button
            className="employee-dashboard-superuser-btn"
            onClick={handleShowAllResults}
          >
            View All Employee Performance
          </button>
        </div>
      )}

      {/* --- Superuser: Results Table --- */}
      {showAllResults && (
        <div className="employee-dashboard-results-table">
          <button
            className="employee-dashboard-hide-table-btn"
            onClick={() => setShowAllResults(false)}
          >
            Hide Performance Table
          </button>
          <ResultTable results={allResults} />
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
