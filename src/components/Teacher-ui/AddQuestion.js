import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AddQuestion.css";

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

  /* ================= FETCH EXAM DETAILS ================= */
  const fetchExam = async () => {
    const res = await fetch(`http://localhost:5000/api/exams`);
    const data = await res.json();
    const exam = data.find((e) => e._id === examId);
    if (exam) {
      setTotalQuestionsAllowed(exam.totalQuestions);
    }
  };

  /* ================= FETCH QUESTIONS ================= */
  const fetchQuestions = async () => {
    const res = await fetch(`http://localhost:5000/api/questions/${examId}`);
    const data = await res.json();
    setQuestions(data);
  };

  useEffect(() => {
    fetchExam();
    fetchQuestions();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && questions.length >= totalQuestionsAllowed) {
      alert("Question limit reached");
      return;
    }

    const payload = {
      examId,
      questionText,
      options,
      correctAnswer,
    };

    let url = "http://localhost:5000/api/questions";
    let method = "POST";

    if (isEditing) {
      url = `http://localhost:5000/api/questions/${editId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error");
      return;
    }

    alert(isEditing ? "Question Updated" : "Question Added");

    resetForm();
    fetchQuestions();
  };

  /* ================= DELETE ================= */
  const deleteQuestion = async (id) => {
    await fetch(`http://localhost:5000/api/questions/${id}`, {
      method: "DELETE",
    });
    fetchQuestions();
  };

  /* ================= EDIT ================= */
  const handleEdit = (q) => {
    setQuestionText(q.questionText);
    setOptions(q.options);
    setCorrectAnswer(q.correctAnswer);
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

  const isLimitReached =
    questions.length >= totalQuestionsAllowed && !isEditing;

  return (
    <div className="add-question-page">
      <div className="add-question-card">
        <h2>Add Questions</h2>

        <p>
          Questions Added: <b>{questions.length}</b> /{" "}
          <b>{totalQuestionsAllowed}</b>
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
                }}
                required
              />
            ))}

            <input
              placeholder="Correct Answer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              required
            />

            <div className="btn-row">
              <button type="submit" className="add-btn">
                {isEditing ? "Update Question" : "Add Question"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* DONE BUTTON */}
        {isLimitReached && (
          <button
            className="done-btn"
            onClick={() => navigate("/exams")}
          >
            Done
          </button>
        )}

        {/* QUESTION LIST */}
        <h3 className="list-title">Added Questions</h3>

        {questions.map((q, index) => (
          <div className="question-item" key={q._id}>
            <p>
              <b>Q{index + 1}:</b> {q.questionText}
            </p>

            <ul>
              {q.options.map((op, i) => (
                <li key={i}>{op}</li>
              ))}
            </ul>

            <p className="correct">✔ {q.correctAnswer}</p>

            <div className="btn-row">
              <button className="edit-btn" onClick={() => handleEdit(q)}>
                Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteQuestion(q._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AddQuestion;
