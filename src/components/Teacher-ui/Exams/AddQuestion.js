import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import { FaPlus, FaTrash, FaEdit, FaCheckCircle, FaQuestionCircle, FaListOl, FaCheck, FaTimes, FaSave, FaExclamationTriangle, FaInfoCircle, FaDatabase } from 'react-icons/fa';
import BackButton from "../../Common/BackButton";
import "./AddQuestion.css";
import { BASE_URL } from '../../../config';

function AddQuestion() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [totalQuestionsAllowed, setTotalQuestionsAllowed] = useState(0);
  const [examName, setExamName] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, targetId: null });

  const { toasts, showToast, removeToast } = useToast();

  /* ================= FETCH EXAM DETAILS ================= */
  const fetchExam = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${BASE_URL}/exams/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data._id) {
        setTotalQuestionsAllowed(data.totalQuestions);
        setExamName(data.examName);
      }
    } catch (err) {
      console.error("FETCH EXAM ERROR:", err);
    }
  };

  /* ================= FETCH QUESTIONS ================= */
  const fetchQuestions = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${BASE_URL}/questions/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuestions(data);
      }
    } catch (err) {
      console.error("FETCH QUESTIONS ERROR:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExam();
      fetchQuestions();
    }
  }, [token, examId]);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && questions.length >= totalQuestionsAllowed) {
      showToast("Inventory full. Question limit has been reached.", "warning");
      return;
    }

    const trimmedOptions = options.map((o) => o.trim());
    const trimmedCorrect = correctAnswer.trim();
    const trimmedQuestion = questionText.trim();

    if (!trimmedOptions.includes(trimmedCorrect)) {
      showToast("Correct answer must match one of the provided options.", "error");
      return;
    }

    const payload = {
      examId,
      questionText: trimmedQuestion,
      options: trimmedOptions,
      correctAnswer: trimmedCorrect,
    };

    let url = `${BASE_URL}/questions`;
    let method = "POST";

    if (isEditing) {
      url = `${BASE_URL}/questions/${editId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to save question. Server error.", "error");
      return;
    }

    showToast(isEditing ? "Question updated!" : "Question added successfully!", "success");
    resetForm();
    fetchQuestions();
  };

  /* ================= DELETE ================= */
  const deleteQuestion = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/questions/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchQuestions();
        showToast("Question removed.", "info");
      } else {
        showToast("Failed to delete question.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (q) => {
    setQuestionText(q.questionText.trim());
    setOptions(q.options.map((o) => o.trim()));
    setCorrectAnswer(q.correctAnswer.trim());
    setEditId(q._id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= RESET ================= */
  const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setIsEditing(false);
    setEditId(null);
  };

  const stripPrefix = (text) => {
    if (!text) return "";
    return text.replace(/^\s*[\(\[]?[A-Da-d][\)\]\.]\s*/, "").trim();
  };

  const trimmedOptionsForDisplay = options.map((o) => o.trim());
  const isLimitReached = questions.length >= totalQuestionsAllowed && !isEditing;

  return (
    <div className="add-question-container">
      <BackButton to="/Exams" />
      <Toast toasts={toasts} removeToast={removeToast} />

      <header className="aq-header">
        <div className="aq-badge">{examName || "Exam"} Question Bank</div>
        <h1><FaQuestionCircle /> Manage Questions</h1>
        <p>Create and edit questions for your exam. Ensure all options are distinct and accurate.</p>
      </header>

      <div className="aq-dashboard-grid">
        {/* Progress Tracker */}
        <div className="aq-info-section glass-v2">
          <div className="section-head">
            <FaDatabase />
            <h3>Storage Status</h3>
          </div>
          <div className="stack-progress-v2">
            <div className="progress-pills">
              {Array.from({ length: totalQuestionsAllowed }).map((_, i) => (
                <div key={i} className={`pill ${i < questions.length ? 'filled' : ''}`}></div>
              ))}
            </div>
            <div className="progress-meta">
              <span><b>{questions.length}</b> questions added</span>
              <span><b>{totalQuestionsAllowed - questions.length}</b> slots remaining</span>
            </div>
          </div>
          {isLimitReached && (
            <div className="aq-limit-banner">
              <FaCheckCircle />
              <p>Question limit reached. You can now finalize the exam.</p>
              <button className="aq-done-btn" onClick={() => navigate("/Exams")}>Finalize Questions</button>
            </div>
          )}
        </div>

        {/* Editor Form */}
        {!isLimitReached && (
          <div className="aq-editor-section glass-v2 animate-slide-up">
            <div className="section-head">
              {isEditing ? <FaEdit /> : <FaPlus />}
              <h3>{isEditing ? "Revise Question" : "New Question Input"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="aq-form-v2">
              <div className="aq-group">
                <label>Question </label>
                <textarea
                  placeholder="Type the question content here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </div>

              <div className="aq-options-grid">
                {options.map((opt, i) => (
                  <div className="aq-group" key={i}>
                    <label>Option {["A", "B", "C", "D"][i]}</label>
                    <input
                      placeholder={`Enter option ${i + 1}...`}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[i] = e.target.value;
                        setOptions(newOptions);
                        if (correctAnswer.trim() === options[i].trim()) {
                          setCorrectAnswer("");
                        }
                      }}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="aq-group">
                <label>Correct Answer </label>
                <div className="aq-select-wrapper">
                  <select
                    value={correctAnswer.trim()}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    required
                    disabled={trimmedOptionsForDisplay.filter((o) => o !== "").length === 0}
                  >
                    <option value="">-- Select Answer  --</option>
                    {trimmedOptionsForDisplay
                      .filter((opt) => opt !== "")
                      .map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="aq-actions">
                <button type="submit" className="aq-save-btn">
                  {isEditing ? <><FaSave /> Update Question</> : <><FaPlus /> Add Question</>}
                </button>
                {isEditing && (
                  <button type="button" className="aq-cancel-btn" onClick={resetForm}>
                    <FaTimes /> Discard Edits
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* QUESTION LIST */}
      <div className="aq-bank-section">
        <div className="section-head">
          <FaCheckCircle />
          <h3>Question List ({questions.length})</h3>
        </div>
        <div className="aq-cards-grid">
          {questions.length === 0 ? (
            <div className="aq-empty-state glass-v2">
              <FaInfoCircle />
              <p>No benchmarks found in the current assessment matrix.</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div className="aq-item-card glass-v2 animate-pop-in" key={q._id} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="aq-card-header">
                  <span className="q-index">Que {index + 1}</span>
                  <div className="q-actions">
                    <button className="aq-icon-btn edit" title="Edit" onClick={() => handleEdit(q)}><FaEdit /></button>
                    <button className="aq-icon-btn delete" title="Delete" onClick={() => setDeleteModal({ open: true, targetId: q._id })}><FaTrash /></button>
                  </div>
                </div>
                <div className="aq-card-body">
                  <h4 className="q-text">{q.questionText}</h4>
                  <div className="q-options-list">
                    {q.options.map((op, i) => (
                      <div key={i} className={`q-opt-item ${stripPrefix(op) === stripPrefix(q.correctAnswer) ? 'correct' : ''}`}>
                        <span className="opt-label">{["A", "B", "C", "D"][i]}</span>
                        <span className="opt-text">{stripPrefix(op)}</span>
                        {stripPrefix(op) === stripPrefix(q.correctAnswer) && <FaCheck className="check-v" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PopupModal
        isOpen={deleteModal.open}
        type="error"
        title="Delete Question?"
        message="This question will be permanently removed from the exam structure."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        confirmColor="var(--accent-color)"
        onConfirm={async () => {
          await deleteQuestion(deleteModal.targetId);
          setDeleteModal({ open: false, targetId: null });
        }}
        onCancel={() => setDeleteModal({ open: false, targetId: null })}
      />
    </div>
  );
}

export default AddQuestion;
