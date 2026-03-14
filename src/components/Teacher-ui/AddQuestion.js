import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast from "../Toast";
import useToast from "../useToast";
import PopupModal from "../PopupModal";
import "./AddQuestion.css";
import { BASE_URL } from '../../config';

function AddQuestion() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [totalQuestionsAllowed, setTotalQuestionsAllowed] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, targetId: null });

  const { toasts, showToast, removeToast } = useToast();

  /* ================= FETCH EXAM DETAILS ================= */
  const fetchExam = async () => {
    const res = await fetch(`${BASE_URL}/exams`);
    const data = await res.json();
    const exam = data.find((e) => e._id === examId);
    if (exam) setTotalQuestionsAllowed(exam.totalQuestions);
  };

  /* ================= FETCH QUESTIONS ================= */
  const fetchQuestions = async () => {
    const res = await fetch(`${BASE_URL}/questions/${examId}`);
    const data = await res.json();
    setQuestions(data);
  };

  useEffect(() => {
    fetchExam();
    fetchQuestions();
    // eslint-disable-next-line
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && questions.length >= totalQuestionsAllowed) {
      showToast("Question limit reached. All questions have been added.", "warning");
      return;
    }

    // ✅ Trim everything before saving — fixes leading/trailing space bug
    const trimmedOptions = options.map((o) => o.trim());
    const trimmedCorrect = correctAnswer.trim();
    const trimmedQuestion = questionText.trim();

    // Validate correctAnswer is one of the trimmed options
    if (!trimmedOptions.includes(trimmedCorrect)) {
      showToast("Please select a valid correct answer.", "error");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Something went wrong. Please try again.", "error");
      return;
    }

    showToast(isEditing ? "Question updated successfully!" : "Question added successfully!", "success");
    resetForm();
    fetchQuestions();
  };

  /* ================= DELETE ================= */
  const deleteQuestion = async (id) => {
    await fetch(`${BASE_URL}/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
  };

  /* ================= EDIT ================= */
  const handleEdit = (q) => {
    // Trim when loading into form for editing too
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

  // ✅ Trimmed options for dropdown — prevents space mismatch in select
  const trimmedOptionsForDisplay = options.map((o) => o.trim());

  const isLimitReached = questions.length >= totalQuestionsAllowed && !isEditing;

  return (
    <div className="add-question-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="add-question-card">
        <h2>Add Questions</h2>

        <p>
          Questions Added: <b>{questions.length}</b> / <b>{totalQuestionsAllowed}</b>
        </p>

        {/* FORM */}
        {!isLimitReached && (
          <form onSubmit={handleSubmit} className="question-form">
            <input
              placeholder="Question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />

            {options.map((opt, i) => (
              <input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[i] = e.target.value;
                  setOptions(newOptions);
                  // Reset correctAnswer if the option it was set to changes
                  if (correctAnswer.trim() === options[i].trim()) {
                    setCorrectAnswer("");
                  }
                }}
                required
              />
            ))}

            <label>Correct Answer</label>
            <select
              value={correctAnswer.trim()}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              required
              disabled={trimmedOptionsForDisplay.filter((o) => o !== "").length === 0}
            >
              <option value="">-- Select Correct Answer --</option>
              {trimmedOptionsForDisplay
                .filter((opt) => opt !== "")
                .map((opt, i) => (
                  // ✅ value is trimmed — no more leading/trailing space saved
                  <option key={i} value={opt}>{opt}</option>
                ))}
            </select>

            <div className="btn-row">
              <button type="submit" className="add-btn">
                {isEditing ? "Update Question" : "Add Question"}
              </button>
              {isEditing && (
                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        )}

        {/* DONE BUTTON */}
        {isLimitReached && (
          <button className="done-btn" onClick={() => navigate("/exams")}>Done</button>
        )}

        {/* QUESTION LIST */}
        <h3 className="list-title">Added Questions</h3>

        {questions.map((q, index) => (
          <div className="question-item" key={q._id}>
            <p><b>Q{index + 1}:</b> {q.questionText}</p>
            <ul>
              {q.options.map((op, i) => (
                <li key={i}><b>{["A", "B", "C", "D"][i]})</b> {stripPrefix(op)}</li>
              ))}
            </ul>
            <p className="correct">✔ Correct: {stripPrefix(q.correctAnswer)}</p>
            <div className="btn-row">
              <button className="edit-btn" onClick={() => handleEdit(q)}>Edit</button>
              <button className="delete-btn" onClick={() => setDeleteModal({ open: true, targetId: q._id })}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation PopupModal */}
      <PopupModal
        isOpen={deleteModal.open}
        type="error"
        title="Delete Question?"
        message="This question will be permanently deleted and cannot be recovered."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="#dc2626"
        onConfirm={async () => {
          await deleteQuestion(deleteModal.targetId);
          setDeleteModal({ open: false, targetId: null });
          showToast("Question deleted.", "info");
        }}
        onCancel={() => setDeleteModal({ open: false, targetId: null })}
      />
    </div>
  );
}

export default AddQuestion;