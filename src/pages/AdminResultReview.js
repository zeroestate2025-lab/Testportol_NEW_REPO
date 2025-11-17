import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/AdminDashboard.css"; // reuse same styling

export default function AdminResultReview() {
  const navigate = useNavigate();
  const { resultId } = useParams(); // expects route like /admin/result/:resultId

  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch test result and questions
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");

    fetchResult();
    fetchQuestions();
  }, []);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tests/${resultId}`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load test result.");
    } finally {
      setLoading(false);
    }
  };

 const fetchQuestions = async () => {
  try {
    const res = await API.get("/questions");

    // ✅ Fix: normalize response
    const list = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data.questions)
      ? res.data.questions
      : [];

    setQuestions(list);
    console.log("✅ Loaded questions:", list.length);
  } catch (err) {
    console.error(err);
    alert("❌ Failed to load questions.");
  }
};

  // ✅ Handle mark change for each answer
  const handleMarkChange = (questionId, value) => {
    setMarks((prev) => ({
      ...prev,
      [questionId]: Number(value) || 0,
    }));
  };

  // ✅ Save validation marks
  const handleSaveValidation = async () => {
    if (!window.confirm("Are you sure you want to submit the validation?")) return;
    try {
      setSaving(true);

      // Calculate total correct marks and percentage
      const totalMarks = Object.values(marks).reduce((a, b) => a + b, 0);
      const totalQuestions = result.answers?.length || 0;
      const scorePercent = totalQuestions
        ? ((totalMarks / totalQuestions) * 100).toFixed(2)
        : 0;

      // Update test result on backend
      await API.put(`/tests/${resultId}/validate`, {
        marks,
        totalMarks,
        scorePercent,
      });

      alert("✅ Validation saved successfully!");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save validation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !result)
    return (
      <div className="admin-dashboard">
        <div className="card">
          <h4>Loading result details...</h4>
        </div>
      </div>
    );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Result Review</h2>
        <button className="logout-btn" onClick={() => navigate("/admin/dashboard")}>
          ⬅ Back
        </button>
      </div>

      <div className="card">
        <h5>Candidate Details</h5>
        <p>
          <b>Name:</b> {result.name}
        </p>
        <p>
          <b>Email:</b> {result.email}
        </p>
        <p>
          <b>Status:</b>{" "}
          <span
            style={{
              color: result.status === "Validated" ? "green" : "orange",
              fontWeight: 600,
            }}
          >
            {result.status || "Validation Pending"}
          </span>
        </p>
      </div>

      <div className="card">
        <h5>Answers Review</h5>
        {(result.submittedAnswers && result.submittedAnswers.length > 0) ? (
  result.submittedAnswers.map((a, idx) => {
    const q = questions.find(
      (q) => q.questionText.trim().toLowerCase() === a.question.trim().toLowerCase()
    );
    const modelAnswer = q?.correctAnswer || "—";

    return (
      <div key={idx} className="question-item" style={{ marginBottom: "15px" }}>
        <strong>Q{idx + 1}:</strong> {a.question}
        <div style={{ marginTop: 5 }}>
          <b>Candidate Answer:</b> <br />
          <span>{a.userAnswer || "No answer"}</span>
        </div>
        <div style={{ marginTop: 5, color: "green" }}>
          <b>Model Answer:</b> <br />
          <span>{modelAnswer}</span>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>
            <b>Mark:</b>{" "}
            <input
              type="number"
              min="0"
              max="1"
              step="0.5"
              className="form-control"
              style={{ width: "80px", display: "inline-block" }}
              value={marks[a.questionId || a.question] || ""}
              onChange={(e) =>
                handleMarkChange(a.questionId || a.question, e.target.value)
              }
              placeholder="0/1"
            />
          </label>
        </div>
      </div>
    );
  })
) : (
  <div className="text-muted">No answers found.</div>
)}


        <div className="d-flex gap-2" style={{ marginTop: "20px" }}>
          <button
            className="btn btn-success"
            onClick={handleSaveValidation}
            disabled={saving}
          >
            {saving ? "Saving..." : "✅ Save Validation"}
          </button>
        </div>
      </div>
    </div>
  );
}
