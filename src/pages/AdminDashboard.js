import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("questions");
  const [form, setForm] = useState({
    questionText: "",
    answerText: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 🧩 Test control state
  const [testControl, setTestControl] = useState({
    isActive: false,
    questionLimit: 10,
    timeLimit: 30,
  });

  // 🟢 Check admin login
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");
  }, [navigate]);

  // 🟢 Initial fetch
  useEffect(() => {
    fetchQuestions();
    fetchResults();
    fetchTestControl();
  }, []);

  // ✅ Fetch Test Control
  const fetchTestControl = async () => {
    try {
      const res = await API.testcontrol.get();
      if (res.data) setTestControl(res.data);
    } catch (err) {
      console.error("Error fetching test control:", err);
    }
  };

  // ✅ Update Test Control + Activate users
  const handleStartTest = async () => {
    try {
      await API.testcontrol.update({
        isActive: true,
        questionLimit: testControl.questionLimit,
        timeLimit: testControl.timeLimit,
      });

      const res = await API.user.activateAll();
      alert(res.data.message || "✅ Test started, all users activated!");
      await fetchWaitingUsers();
    } catch (err) {
      console.error("❌ Failed to start test:", err);
      alert("❌ Failed to start test.");
    }
  };

  // ✅ Stop test
  const handleStopTest = async () => {
    try {
      await API.testcontrol.update({ isActive: false });
      alert("⏹️ Test stopped successfully!");
      await fetchTestControl();
    } catch (err) {
      console.error("❌ Error stopping test:", err);
      alert("Failed to stop test.");
    }
  };

  // ✅ Delete individual user by ID
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    
    try {
      const res = await API.waitingUsers.delete(userId);
      alert(res.data.message || "✅ User deleted successfully!");
      await fetchWaitingUsers();
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert(err.response?.data?.error || "Failed to delete user.");
    }
  };

  // ✅ Clear all users with ONE CLICK
  const handleClearAllUsers = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete ALL waiting users? This action cannot be undone!")) return;
    
    try {
      const res = await API.waitingUsers.deleteAll();
      alert(res.data.message || "✅ All users cleared successfully!");
      await fetchWaitingUsers();
    } catch (err) {
      console.error("❌ Error clearing all users:", err);
      alert(err.response?.data?.error || "Failed to clear all users.");
    }
  };

  // ✅ Fetch Questions
  const fetchQuestions = async () => {
    try {
      const res = await API.questions.getAll();
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.questions || [];
      setQuestions(data);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load questions.");
    }
  };

 // ✅ Fetch Results
const fetchResults = async () => {
  setLoadingResults(true);
  try {
    const res = await API.tests.getAll();
    setResults(res.data || []);
  } catch (err) {
    console.error(err);
    alert("❌ Failed to load test results.");
  } finally {
    setLoadingResults(false);
  }
};


  // 🟢 Waiting Users
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);

  const fetchWaitingUsers = async () => {
    try {
      const res = await API.waitingUsers.getAll();
      setWaitingUsers(res.data || []);
      setWaitingCount(res.data?.length || 0);
    } catch (err) {
      console.error("❌ Error fetching waiting users:", err);
    }
  };

  // 🔄 Periodically fetch users
  useEffect(() => {
    fetchWaitingUsers();
    const interval = setInterval(fetchWaitingUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const handleViewValidation = (id) => {
    navigate(`/admin/result/${id}`);
  };

  // ✅ Add / Update Question
  const handleAddOrUpdate = async (e) => {
    e.preventDefault();

    if (!form.questionText.trim()) {
      return alert("Please enter question text.");
    }

    setLoading(true);
    try {
      const payload = {
        questionType: "Theory",
        questionText: form.questionText,
        correctAnswer: form.answerText,
      };

      if (editingId) {
        await API.questions.update(editingId, payload);
        alert("✅ Question updated successfully!");
      } else {
        await API.questions.create(payload);
        alert("✅ Question added successfully!");
      }

      setForm({ questionText: "", answerText: "" });
      setEditingId(null);
      await fetchQuestions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "❌ Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setForm({
      questionText: q.questionText,
      answerText: q.correctAnswer || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      await API.questions.delete(id);
      alert("🗑️ Question deleted successfully!");
      await fetchQuestions();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete question.");
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file to upload.");
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await API.questions.uploadDoc(fd);
      alert(res.data.message || "✅ File uploaded successfully!");
      await fetchQuestions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "❌ File upload failed.");
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          🧩 Questions
        </button>
        <button
          className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          📊 Test Results
        </button>
      </div>

      {activeTab === "questions" ? (
        <div className="tab-content">
          {/* ✅ Test Control Panel */}
          <div className="card form-section">
            <h5>🕹️ Test Control Panel</h5>

            {/* ✅ Live Waiting Users Section */}
            <div className="waiting-users-section">
              <div className="waiting-header">
                <div className="waiting-title-wrapper">
                  <svg className="waiting-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h5 className="waiting-title">Live Waiting Users</h5>
                  <span className="waiting-badge">{waitingCount}</span>
                </div>
                
                <div className="delete-actions">
                  <button 
                    className="delete-btn delete-all" 
                    onClick={handleClearAllUsers}
                    title="Clear All Users - One Click Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Clear All Users
                  </button>
                </div>
              </div>

              {waitingUsers.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="empty-text">No users are waiting currently</p>
                </div>
              ) : (
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitingUsers.map((user, index) => (
                        <tr key={user._id} className="user-row" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td className="user-number">{index + 1}</td>
                          <td className="user-name">{user.fullName}</td>
                          <td className="user-email">{user.email}</td>
                          <td>
                            <span className={`status-badge status-${user.status.toLowerCase()}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="delete-user-btn"
                              onClick={() => handleDeleteUser(user._id, user.fullName)}
                              title="Delete User"
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label>Number of Questions</label>
              <input
                type="number"
                className="form-control"
                value={testControl.questionLimit}
                onChange={(e) =>
                  setTestControl({
                    ...testControl,
                    questionLimit: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-3">
              <label>Time Limit (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={testControl.timeLimit}
                onChange={(e) =>
                  setTestControl({
                    ...testControl,
                    timeLimit: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-3">
              <label>Status: </label>
              <span
                className={`ms-2 fw-bold ${
                  testControl.isActive ? "text-success" : "text-danger"
                }`}
              >
                {testControl.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={handleStartTest}>
                ▶️ Start Test
              </button>
              <button className="btn btn-danger" onClick={handleStopTest}>
                ⏹️ Stop Test
              </button>
            </div>
          </div>

          {/* ✅ Question Form */}
          <div className="card form-section mt-4">
            <h5>{editingId ? "✏️ Edit Question" : "➕ Add / Upload Questions"}</h5>

            <form onSubmit={handleAddOrUpdate}>
              <div className="mb-3">
                <label className="form-label">Question Text</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.questionText}
                  onChange={(e) =>
                    setForm({ ...form, questionText: e.target.value })
                  }
                  placeholder="Enter question here..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Answer Text</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.answerText}
                  onChange={(e) =>
                    setForm({ ...form, answerText: e.target.value })
                  }
                  placeholder="Enter answer here..."
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-success"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Question"
                    : "Add Question"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setForm({ questionText: "", answerText: "" });
                    setEditingId(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </form>

            <hr className="my-4" />

            {/* ✅ Upload Section */}
            <div className="upload-section">
              <label className="form-label">Upload File (.txt / .docx)</label>
              <input
                type="file"
                className="form-control"
                accept=".txt,.docx"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div className="mt-2">
                <button className="btn btn-primary" onClick={handleUpload}>
                  Upload
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Available Questions */}
          <div className="card available-questions mt-4">
            <h5>Available Questions</h5>

            {Array.isArray(questions) && questions.length === 0 && (
              <div className="text-muted">No questions yet</div>
            )}

            {Array.isArray(questions) &&
              questions.map((q, idx) => (
                <div key={q._id} className="question-item">
                  <strong>Q{idx + 1}:</strong> {q.questionText}
                  {q.correctAnswer && (
                    <div className="small text-success">
                      <b>Answer:</b> {q.correctAnswer}
                    </div>
                  )}
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleEdit(q)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(q._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        // ✅ Test Results Tab
        <div className="tab-content">
          <div className="card results-section">
            <h5>Candidate Test Results</h5>
            {loadingResults ? (
              <div>Loading test results...</div>
            ) : results.length === 0 ? (
              <div className="text-muted">No test results yet</div>
            ) : (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Correct</th>
                    <th>Score %</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.name}</td>
                      <td>{res.email}</td>
                      <td>{res.totalQuestions}</td>
                      <td>{res.correctAnswers}</td>
                      <td>{res.scorePercent}%</td>
                      <td>
                        <span
                          style={{
                            color:
                              res.status === "Validated" ? "green" : "orange",
                            fontWeight: 600,
                          }}
                        >
                          {res.status || "Validation Pending"}
                        </span>
                      </td>
                      <td>{new Date(res.submittedAt).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewValidation(res._id)}
                        >
                          View / Validate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import API from "../services/api";
// import { useNavigate } from "react-router-dom";
// import "../styles/AdminDashboard.css";

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const [questions, setQuestions] = useState([]);
//   const [results, setResults] = useState([]);
//   const [activeTab, setActiveTab] = useState("questions");
//   const [form, setForm] = useState({
//     questionText: "",
//     answerText: "",
//   });
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [loadingResults, setLoadingResults] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   // 🧩 Test control state
//   const [testControl, setTestControl] = useState({
//     isActive: false,
//     questionLimit: 10,
//     timeLimit: 30,
//   });

//   // 🟢 Check admin login
//   useEffect(() => {
//     const token = localStorage.getItem("adminToken");
//     if (!token) navigate("/admin/login");
//   }, [navigate]);

//   // 🟢 Initial fetch
//   useEffect(() => {
//     fetchQuestions();
//     fetchResults();
//     fetchTestControl();
//   }, []);

//   // ✅ Fetch Test Control
//   const fetchTestControl = async () => {
//     try {
//       const res = await API.testcontrol.get();
//       if (res.data) setTestControl(res.data);
//     } catch (err) {
//       console.error("Error fetching test control:", err);
//     }
//   };

//   // ✅ Update Test Control + Activate users
//   const handleStartTest = async () => {
//     try {
//       await API.testcontrol.update({
//         isActive: true,
//         questionLimit: testControl.questionLimit,
//         timeLimit: testControl.timeLimit,
//       });

//       const res = await API.user.activateAll();
//       alert(res.data.message || "✅ Test started, all users activated!");
//       await fetchWaitingUsers();
//     } catch (err) {
//       console.error("❌ Failed to start test:", err);
//       alert("❌ Failed to start test.");
//     }
//   };

//   // ✅ Stop test
//   const handleStopTest = async () => {
//     try {
//       await API.testcontrol.update({ isActive: false });
//       alert("⏹️ Test stopped successfully!");
//       await fetchTestControl();
//     } catch (err) {
//       console.error("❌ Error stopping test:", err);
//       alert("Failed to stop test.");
//     }
//   };

// // ✅ Clear last waiting user (by status or any)
// const handleClearLastWaitingUser = async (status = "") => {
//   const confirmMsg = status
//     ? `Delete last ${status} user?`
//     : "Delete last user (any status)?";

//   if (!window.confirm(confirmMsg)) return;
  
//   try {
//     const res = await API.waitingUsers.deleteLast(status);
//     alert(res.data.message || "✅ User deleted successfully!");
//     await fetchWaitingUsers();
//   } catch (err) {
//     console.error("❌ Error deleting last user:", err);
//     alert(err.response?.data?.error || "Failed to delete user.");
//   }
// };

// // ✅ Delete individual user by ID
// const handleDeleteUser = async (userId, userName) => {
//   if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
  
//   try {
//     const res = await API.waitingUsers.delete(userId);
//     alert(res.data.message || "✅ User deleted successfully!");
//     await fetchWaitingUsers();
//   } catch (err) {
//     console.error("❌ Error deleting user:", err);
//     alert(err.response?.data?.error || "Failed to delete user.");
//   }
// };

// // ✅ Clear all users
// const handleClearAllUsers = async () => {
//   if (!window.confirm("⚠️ Are you sure you want to delete ALL waiting users? This action cannot be undone!")) return;
  
//   try {
//     const res = await API.waitingUsers.deleteAll();
//     alert(res.data.message || "✅ All users cleared successfully!");
//     await fetchWaitingUsers();
//   } catch (err) {
//     console.error("❌ Error clearing all users:", err);
//     alert(err.response?.data?.error || "Failed to clear all users.");
//   }
// };


//   // ✅ Fetch Questions
//   const fetchQuestions = async () => {
//     try {
//       const res = await API.questions.getAll();
//       const data = Array.isArray(res.data)
//         ? res.data
//         : res.data.questions || [];
//       setQuestions(data);
//     } catch (err) {
//       console.error(err);
//       alert("❌ Failed to load questions.");
//     }
//   };

//   // ✅ Fetch Results
//   const fetchResults = async () => {
//     setLoadingResults(true);
//     try {
//       const res = await API.tests.getAll();
//       setResults(res.data || []);
//     } catch (err) {
//       console.error(err);
//       alert("❌ Failed to load test results.");
//     } finally {
//       setLoadingResults(false);
//     }
//   };

//   // 🟢 Waiting Users
//   const [waitingUsers, setWaitingUsers] = useState([]);
//   const [waitingCount, setWaitingCount] = useState(0);

//   const fetchWaitingUsers = async () => {
//     try {
//       const res = await API.waitingUsers.getAll();
//       setWaitingUsers(res.data || []);
//       setWaitingCount(res.data?.length || 0);
//     } catch (err) {
//       console.error("❌ Error fetching waiting users:", err);
//     }
//   };

//   // 🔄 Periodically fetch users
//   useEffect(() => {
//     fetchWaitingUsers();
//     const interval = setInterval(fetchWaitingUsers, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     navigate("/admin/login");
//   };

//   const handleViewValidation = (id) => {
//     navigate(`/admin/result/${id}`);
//   };

//   // ✅ Add / Update Question
//   const handleAddOrUpdate = async (e) => {
//     e.preventDefault();

//     if (!form.questionText.trim()) {
//       return alert("Please enter question text.");
//     }

//     setLoading(true);
//     try {
//       const payload = {
//         questionType: "Theory",
//         questionText: form.questionText,
//         correctAnswer: form.answerText,
//       };

//       if (editingId) {
//         await API.questions.update(editingId, payload);
//         alert("✅ Question updated successfully!");
//       } else {
//         await API.questions.create(payload);
//         alert("✅ Question added successfully!");
//       }

//       setForm({ questionText: "", answerText: "" });
//       setEditingId(null);
//       await fetchQuestions();
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.error || "❌ Operation failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (q) => {
//     setEditingId(q._id);
//     setForm({
//       questionText: q.questionText,
//       answerText: q.correctAnswer || "",
//     });
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this question?"))
//       return;
//     try {
//       await API.questions.delete(id);
//       alert("🗑️ Question deleted successfully!");
//       await fetchQuestions();
//     } catch (err) {
//       console.error(err);
//       alert("❌ Failed to delete question.");
//     }
//   };

//   const handleUpload = async () => {
//     if (!file) return alert("Please select a file to upload.");
//     const fd = new FormData();
//     fd.append("file", file);

//     try {
//       const res = await API.questions.uploadDoc(fd);
//       alert(res.data.message || "✅ File uploaded successfully!");
//       await fetchQuestions();
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.error || "❌ File upload failed.");
//     }
//   };

//   return (
//     <div className="admin-dashboard">
//       <div className="admin-header">
//         <h2>Admin Dashboard</h2>
//         <button className="logout-btn" onClick={handleLogout}>
//           Logout
//         </button>
//       </div>

//       {/* Tabs */}
//       <div className="tab-buttons">
//         <button
//           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
//           onClick={() => setActiveTab("questions")}
//         >
//           🧩 Questions
//         </button>
//         <button
//           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
//           onClick={() => setActiveTab("results")}
//         >
//           📊 Test Results
//         </button>
//       </div>

//       {activeTab === "questions" ? (
//         <div className="tab-content">
//           {/* ✅ Test Control Panel */}
//           <div className="card form-section">
//             <h5>🕹️ Test Control Panel</h5>

//             {/* ✅ Live Waiting Users Section */}
//             <div className="waiting-users-section">
//               <div className="waiting-header">
//                 <div className="waiting-title-wrapper">
//                   <svg className="waiting-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                   <h5 className="waiting-title">Live Waiting Users</h5>
//                   <span className="waiting-badge">{waitingCount}</span>
//                 </div>
                
//                 <div className="delete-actions">
//                   <button 
//                     className="delete-btn delete-all" 
//                     onClick={handleClearAllUsers}
//                     title="Clear All Users"
//                   >
//                     <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                     Clear All
//                   </button>
//                   <button 
//                     className="delete-btn delete-last" 
//                     onClick={() => handleClearLastWaitingUser()}
//                     title="Delete Last User"
//                   >
//                     <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                       <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                     Last User
//                   </button>
//                   <button 
//                     className="delete-btn delete-waiting" 
//                     onClick={() => handleClearLastWaitingUser("waiting")}
//                     title="Clear Last Waiting"
//                   >
//                     Waiting
//                   </button>
//                   <button 
//                     className="delete-btn delete-active" 
//                     onClick={() => handleClearLastWaitingUser("active")}
//                     title="Clear Last Active"
//                   >
//                     Active
//                   </button>
//                   <button 
//                     className="delete-btn delete-finished" 
//                     onClick={() => handleClearLastWaitingUser("finished")}
//                     title="Clear Last Finished"
//                   >
//                     Finished
//                   </button>
//                 </div>
//               </div>

//               {waitingUsers.length === 0 ? (
//                 <div className="empty-state">
//                   <svg className="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                   <p className="empty-text">No users are waiting currently</p>
//                 </div>
//               ) : (
//                 <div className="users-table-wrapper">
//                   <table className="users-table">
//                     <thead>
//                       <tr>
//                         <th>#</th>
//                         <th>Full Name</th>
//                         <th>Email</th>
//                         <th>Status</th>
//                         <th>Action</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {waitingUsers.map((user, index) => (
//                         <tr key={user._id} className="user-row" style={{ animationDelay: `${index * 0.05}s` }}>
//                           <td className="user-number">{index + 1}</td>
//                           <td className="user-name">{user.fullName}</td>
//                           <td className="user-email">{user.email}</td>
//                           <td>
//                             <span className={`status-badge status-${user.status.toLowerCase()}`}>
//                               {user.status}
//                             </span>
//                           </td>
//                           <td>
//                             <button 
//                               className="delete-user-btn"
//                               onClick={() => handleDeleteUser(user._id, user.fullName)}
//                               title="Delete User"
//                             >
//                               <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                               </svg>
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>

//             <div className="mb-3">
//               <label>Number of Questions</label>
//               <input
//                 type="number"
//                 className="form-control"
//                 value={testControl.questionLimit}
//                 onChange={(e) =>
//                   setTestControl({
//                     ...testControl,
//                     questionLimit: e.target.value,
//                   })
//                 }
//               />
//             </div>

//             <div className="mb-3">
//               <label>Time Limit (minutes)</label>
//               <input
//                 type="number"
//                 className="form-control"
//                 value={testControl.timeLimit}
//                 onChange={(e) =>
//                   setTestControl({
//                     ...testControl,
//                     timeLimit: e.target.value,
//                   })
//                 }
//               />
//             </div>

//             <div className="mb-3">
//               <label>Status: </label>
//               <span
//                 className={`ms-2 fw-bold ${
//                   testControl.isActive ? "text-success" : "text-danger"
//                 }`}
//               >
//                 {testControl.isActive ? "Active" : "Inactive"}
//               </span>
//             </div>

//             <div className="d-flex gap-2">
//               <button className="btn btn-success" onClick={handleStartTest}>
//                 ▶️ Start Test
//               </button>
//               <button className="btn btn-danger" onClick={handleStopTest}>
//                 ⏹️ Stop Test
//               </button>
//             </div>
//           </div>

//           {/* ✅ Question Form */}
//           <div className="card form-section mt-4">
//             <h5>{editingId ? "✏️ Edit Question" : "➕ Add / Upload Questions"}</h5>

//             <form onSubmit={handleAddOrUpdate}>
//               <div className="mb-3">
//                 <label className="form-label">Question Text</label>
//                 <textarea
//                   className="form-control"
//                   rows={3}
//                   value={form.questionText}
//                   onChange={(e) =>
//                     setForm({ ...form, questionText: e.target.value })
//                   }
//                   placeholder="Enter question here..."
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="form-label">Answer Text</label>
//                 <textarea
//                   className="form-control"
//                   rows={3}
//                   value={form.answerText}
//                   onChange={(e) =>
//                     setForm({ ...form, answerText: e.target.value })
//                   }
//                   placeholder="Enter answer here..."
//                 />
//               </div>

//               <div className="d-flex gap-2">
//                 <button
//                   className="btn btn-success"
//                   type="submit"
//                   disabled={loading}
//                 >
//                   {loading
//                     ? "Saving..."
//                     : editingId
//                     ? "Update Question"
//                     : "Add Question"}
//                 </button>
//                 <button
//                   type="button"
//                   className="btn btn-secondary"
//                   onClick={() => {
//                     setForm({ questionText: "", answerText: "" });
//                     setEditingId(null);
//                   }}
//                 >
//                   Clear
//                 </button>
//               </div>
//             </form>

//             <hr className="my-4" />

//             {/* ✅ Upload Section */}
//             <div className="upload-section">
//               <label className="form-label">Upload File (.txt / .docx)</label>
//               <input
//                 type="file"
//                 className="form-control"
//                 accept=".txt,.docx"
//                 onChange={(e) => setFile(e.target.files[0])}
//               />
//               <div className="mt-2">
//                 <button className="btn btn-primary" onClick={handleUpload}>
//                   Upload
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* ✅ Available Questions */}
//           <div className="card available-questions mt-4">
//             <h5>Available Questions</h5>

//             {Array.isArray(questions) && questions.length === 0 && (
//               <div className="text-muted">No questions yet</div>
//             )}

//             {Array.isArray(questions) &&
//               questions.map((q, idx) => (
//                 <div key={q._id} className="question-item">
//                   <strong>Q{idx + 1}:</strong> {q.questionText}
//                   {q.correctAnswer && (
//                     <div className="small text-success">
//                       <b>Answer:</b> {q.correctAnswer}
//                     </div>
//                   )}
//                   <div className="action-buttons">
//                     <button
//                       className="btn btn-sm btn-warning"
//                       onClick={() => handleEdit(q)}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       className="btn btn-sm btn-danger"
//                       onClick={() => handleDelete(q._id)}
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               ))}
//           </div>
//         </div>
//       ) : (
//         // ✅ Test Results Tab
//         <div className="tab-content">
//           <div className="card results-section">
//             <h5>Candidate Test Results</h5>
//             {loadingResults ? (
//               <div>Loading test results...</div>
//             ) : results.length === 0 ? (
//               <div className="text-muted">No test results yet</div>
//             ) : (
//               <table className="results-table">
//                 <thead>
//                   <tr>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Total</th>
//                     <th>Correct</th>
//                     <th>Score %</th>
//                     <th>Status</th>
//                     <th>Submitted At</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {results.map((res, idx) => (
//                     <tr key={idx}>
//                       <td>{res.name}</td>
//                       <td>{res.email}</td>
//                       <td>{res.totalQuestions}</td>
//                       <td>{res.correctAnswers}</td>
//                       <td>{res.scorePercent}%</td>
//                       <td>
//                         <span
//                           style={{
//                             color:
//                               res.status === "Validated" ? "green" : "orange",
//                             fontWeight: 600,
//                           }}
//                         >
//                           {res.status || "Validation Pending"}
//                         </span>
//                       </td>
//                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
//                       <td>
//                         <button
//                           className="btn btn-sm btn-primary"
//                           onClick={() => handleViewValidation(res._id)}
//                         >
//                           View / Validate
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // import React, { useEffect, useState } from "react";
// // import API from "../services/api";
// // import { useNavigate } from "react-router-dom";
// // import "../styles/AdminDashboard.css";

// // export default function AdminDashboard() {
// //   const navigate = useNavigate();
// //   const [questions, setQuestions] = useState([]);
// //   const [results, setResults] = useState([]);
// //   const [activeTab, setActiveTab] = useState("questions");
// //   const [form, setForm] = useState({
// //     questionText: "",
// //     answerText: "",
// //   });
// //   const [file, setFile] = useState(null);
// //   const [loading, setLoading] = useState(false);
// //   const [loadingResults, setLoadingResults] = useState(false);
// //   const [editingId, setEditingId] = useState(null);

// //   // 🧩 Test control state
// //   const [testControl, setTestControl] = useState({
// //     isActive: false,
// //     questionLimit: 10,
// //     timeLimit: 30,
// //   });

// //   // 🟢 Check admin login
// //   useEffect(() => {
// //     const token = localStorage.getItem("adminToken");
// //     if (!token) navigate("/admin/login");
// //   }, [navigate]);

// //   // 🟢 Initial fetch
// //   useEffect(() => {
// //     fetchQuestions();
// //     fetchResults();
// //     fetchTestControl();
// //   }, []);

// //   // ✅ Fetch Test Control
// //   const fetchTestControl = async () => {
// //     try {
// //       const res = await API.testcontrol.get();
// //       if (res.data) setTestControl(res.data);
// //     } catch (err) {
// //       console.error("Error fetching test control:", err);
// //     }
// //   };

// //   // ✅ Update Test Control + Activate users
// //   const handleStartTest = async () => {
// //     try {
// //       await API.testcontrol.update({
// //         isActive: true,
// //         questionLimit: testControl.questionLimit,
// //         timeLimit: testControl.timeLimit,
// //       });

// //       const res = await API.user.activateAll();
// //       alert(res.data.message || "✅ Test started, all users activated!");
// //       await fetchWaitingUsers();
// //     } catch (err) {
// //       console.error("❌ Failed to start test:", err);
// //       alert("❌ Failed to start test.");
// //     }
// //   };

// //   // ✅ Stop test
// //   const handleStopTest = async () => {
// //     try {
// //       await API.testcontrol.update({ isActive: false });
// //       alert("⏹️ Test stopped successfully!");
// //       await fetchTestControl();
// //     } catch (err) {
// //       console.error("❌ Error stopping test:", err);
// //       alert("Failed to stop test.");
// //     }
// //   };

// //   // ✅ Clear last waiting user (by status or any)
// //   const handleClearLastWaitingUser = async (status = "") => {
// //     const confirmMsg = status
// //       ? `Delete last ${status} user?`
// //       : "Delete last user (any status)?";

// //     if (!window.confirm(confirmMsg)) return;
// //     try {
// //       const res = await API.delete(
// //         `/waiting-users/last${status ? `?status=${status}` : ""}`
// //       );
// //       alert(res.data.message);
// //       await fetchWaitingUsers();
// //     } catch (err) {
// //       console.error("❌ Error deleting last user:", err);
// //       alert(err.response?.data?.error || "Failed to delete user.");
// //     }
// //   };

// //   // ✅ Fetch Questions
// //   const fetchQuestions = async () => {
// //     try {
// //       const res = await API.questions.getAll();
// //       const data = Array.isArray(res.data)
// //         ? res.data
// //         : res.data.questions || [];
// //       setQuestions(data);
// //     } catch (err) {
// //       console.error(err);
// //       alert("❌ Failed to load questions.");
// //     }
// //   };

// //   // ✅ Fetch Results
// //   const fetchResults = async () => {
// //     setLoadingResults(true);
// //     try {
// //       const res = await API.tests.getAll();
// //       setResults(res.data || []);
// //     } catch (err) {
// //       console.error(err);
// //       alert("❌ Failed to load test results.");
// //     } finally {
// //       setLoadingResults(false);
// //     }
// //   };

// //   // 🟢 Waiting Users
// //   const [waitingUsers, setWaitingUsers] = useState([]);
// //   const [waitingCount, setWaitingCount] = useState(0);

// //   const fetchWaitingUsers = async () => {
// //     try {
// //       const res = await API.waitingUsers.getAll();
// //       setWaitingUsers(res.data || []);
// //       setWaitingCount(res.data?.length || 0);
// //     } catch (err) {
// //       console.error("❌ Error fetching waiting users:", err);
// //     }
// //   };

// //   // 🔄 Periodically fetch users
// //   useEffect(() => {
// //     fetchWaitingUsers();
// //     const interval = setInterval(fetchWaitingUsers, 5000);
// //     return () => clearInterval(interval);
// //   }, []);

// //   const handleLogout = () => {
// //     localStorage.removeItem("adminToken");
// //     navigate("/admin/login");
// //   };

// //   const handleViewValidation = (id) => {
// //     navigate(`/admin/result/${id}`);
// //   };

// //   // ✅ Add / Update Question
// //   const handleAddOrUpdate = async (e) => {
// //     e.preventDefault();

// //     if (!form.questionText.trim()) {
// //       return alert("Please enter question text.");
// //     }

// //     setLoading(true);
// //     try {
// //       const payload = {
// //         questionType: "Theory",
// //         questionText: form.questionText,
// //         correctAnswer: form.answerText,
// //       };

// //       if (editingId) {
// //         await API.questions.update(editingId, payload);
// //         alert("✅ Question updated successfully!");
// //       } else {
// //         await API.questions.create(payload);
// //         alert("✅ Question added successfully!");
// //       }

// //       setForm({ questionText: "", answerText: "" });
// //       setEditingId(null);
// //       await fetchQuestions();
// //     } catch (err) {
// //       console.error(err);
// //       alert(err.response?.data?.error || "❌ Operation failed.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleEdit = (q) => {
// //     setEditingId(q._id);
// //     setForm({
// //       questionText: q.questionText,
// //       answerText: q.correctAnswer || "",
// //     });
// //     window.scrollTo({ top: 0, behavior: "smooth" });
// //   };

// //   const handleDelete = async (id) => {
// //     if (!window.confirm("Are you sure you want to delete this question?"))
// //       return;
// //     try {
// //       await API.questions.delete(id);
// //       alert("🗑️ Question deleted successfully!");
// //       await fetchQuestions();
// //     } catch (err) {
// //       console.error(err);
// //       alert("❌ Failed to delete question.");
// //     }
// //   };

// //   const handleUpload = async () => {
// //     if (!file) return alert("Please select a file to upload.");
// //     const fd = new FormData();
// //     fd.append("file", file);

// //     try {
// //       const res = await API.questions.uploadDoc(fd);
// //       alert(res.data.message || "✅ File uploaded successfully!");
// //       await fetchQuestions();
// //     } catch (err) {
// //       console.error(err);
// //       alert(err.response?.data?.error || "❌ File upload failed.");
// //     }
// //   };

// //   return (
// //     <div className="admin-dashboard">
// //       <div className="admin-header">
// //         <h2>Admin Dashboard</h2>
// //         <button className="logout-btn" onClick={handleLogout}>
// //           Logout
// //         </button>
// //       </div>

// //       {/* Tabs */}
// //       <div className="tab-buttons">
// //         <button
// //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// //           onClick={() => setActiveTab("questions")}
// //         >
// //           🧩 Questions
// //         </button>
// //         <button
// //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// //           onClick={() => setActiveTab("results")}
// //         >
// //           📊 Test Results
// //         </button>
// //       </div>

// //       {activeTab === "questions" ? (
// //         <div className="tab-content">
// //           {/* ✅ Test Control Panel */}
// //           <div className="card form-section">
// //             <h5>🕹️ Test Control Panel</h5>

// //             {/* ✅ Live Waiting Users Section */}
// //             <div className="card form-section mt-4">
// //               <div className="d-flex justify-content-between align-items-center">
// //                 <h5>🕒 Live Waiting Users</h5>
// //                 <button onClick={() => handleClearLastWaitingUser()}>
// //                   🗑️ Clear Any Last User
// //                 </button>
// //                 <button onClick={() => handleClearLastWaitingUser("waiting")}>
// //                   🗑️ Clear Waiting
// //                 </button>
// //                 <button onClick={() => handleClearLastWaitingUser("active")}>
// //                   🗑️ Clear Active
// //                 </button>
// //                 <button onClick={() => handleClearLastWaitingUser("finished")}>
// //                   🗑️ Clear Finished
// //                 </button>
// //               </div>

// //               <p className="text-muted mb-2">
// //                 Total Waiting: <strong>{waitingCount}</strong>
// //               </p>

// //               {waitingUsers.length === 0 ? (
// //                 <div className="text-secondary small">
// //                   No users are waiting currently.
// //                 </div>
// //               ) : (
// //                 <table className="table table-sm table-bordered">
// //                   <thead>
// //                     <tr>
// //                       <th>#</th>
// //                       <th>Full Name</th>
// //                       <th>Email</th>
// //                       <th>Status</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {waitingUsers.map((user, index) => (
// //                       <tr key={user._id}>
// //                         <td>{index + 1}</td>
// //                         <td>{user.fullName}</td>
// //                         <td>{user.email}</td>
// //                         <td>{user.status}</td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               )}
// //             </div>

// //             <div className="mb-3">
// //               <label>Number of Questions</label>
// //               <input
// //                 type="number"
// //                 className="form-control"
// //                 value={testControl.questionLimit}
// //                 onChange={(e) =>
// //                   setTestControl({
// //                     ...testControl,
// //                     questionLimit: e.target.value,
// //                   })
// //                 }
// //               />
// //             </div>

// //             <div className="mb-3">
// //               <label>Time Limit (minutes)</label>
// //               <input
// //                 type="number"
// //                 className="form-control"
// //                 value={testControl.timeLimit}
// //                 onChange={(e) =>
// //                   setTestControl({
// //                     ...testControl,
// //                     timeLimit: e.target.value,
// //                   })
// //                 }
// //               />
// //             </div>

// //             <div className="mb-3">
// //               <label>Status: </label>
// //               <span
// //                 className={`ms-2 fw-bold ${
// //                   testControl.isActive ? "text-success" : "text-danger"
// //                 }`}
// //               >
// //                 {testControl.isActive ? "Active" : "Inactive"}
// //               </span>
// //             </div>

// //             <div className="d-flex gap-2">
// //               <button className="btn btn-success" onClick={handleStartTest}>
// //                 ▶️ Start Test
// //               </button>
// //               <button className="btn btn-danger" onClick={handleStopTest}>
// //                 ⏹️ Stop Test
// //               </button>
// //             </div>
// //           </div>

// //           {/* ✅ Question Form */}
// //           <div className="card form-section mt-4">
// //             <h5>{editingId ? "✏️ Edit Question" : "➕ Add / Upload Questions"}</h5>

// //             <form onSubmit={handleAddOrUpdate}>
// //               <div className="mb-3">
// //                 <label className="form-label">Question Text</label>
// //                 <textarea
// //                   className="form-control"
// //                   rows={3}
// //                   value={form.questionText}
// //                   onChange={(e) =>
// //                     setForm({ ...form, questionText: e.target.value })
// //                   }
// //                   placeholder="Enter question here..."
// //                 />
// //               </div>

// //               <div className="mb-3">
// //                 <label className="form-label">Answer Text</label>
// //                 <textarea
// //                   className="form-control"
// //                   rows={3}
// //                   value={form.answerText}
// //                   onChange={(e) =>
// //                     setForm({ ...form, answerText: e.target.value })
// //                   }
// //                   placeholder="Enter answer here..."
// //                 />
// //               </div>

// //               <div className="d-flex gap-2">
// //                 <button
// //                   className="btn btn-success"
// //                   type="submit"
// //                   disabled={loading}
// //                 >
// //                   {loading
// //                     ? "Saving..."
// //                     : editingId
// //                     ? "Update Question"
// //                     : "Add Question"}
// //                 </button>
// //                 <button
// //                   type="button"
// //                   className="btn btn-secondary"
// //                   onClick={() => {
// //                     setForm({ questionText: "", answerText: "" });
// //                     setEditingId(null);
// //                   }}
// //                 >
// //                   Clear
// //                 </button>
// //               </div>
// //             </form>

// //             <hr className="my-4" />

// //             {/* ✅ Upload Section */}
// //             <div className="upload-section">
// //               <label className="form-label">Upload File (.txt / .docx)</label>
// //               <input
// //                 type="file"
// //                 className="form-control"
// //                 accept=".txt,.docx"
// //                 onChange={(e) => setFile(e.target.files[0])}
// //               />
// //               <div className="mt-2">
// //                 <button className="btn btn-primary" onClick={handleUpload}>
// //                   Upload
// //                 </button>
// //               </div>
// //             </div>
// //           </div>

// //           {/* ✅ Available Questions */}
// //           <div className="card available-questions mt-4">
// //             <h5>Available Questions</h5>

// //             {Array.isArray(questions) && questions.length === 0 && (
// //               <div className="text-muted">No questions yet</div>
// //             )}

// //             {Array.isArray(questions) &&
// //               questions.map((q, idx) => (
// //                 <div key={q._id} className="question-item">
// //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// //                   {q.correctAnswer && (
// //                     <div className="small text-success">
// //                       <b>Answer:</b> {q.correctAnswer}
// //                     </div>
// //                   )}
// //                   <div className="action-buttons">
// //                     <button
// //                       className="btn btn-sm btn-warning"
// //                       onClick={() => handleEdit(q)}
// //                     >
// //                       Edit
// //                     </button>
// //                     <button
// //                       className="btn btn-sm btn-danger"
// //                       onClick={() => handleDelete(q._id)}
// //                     >
// //                       Delete
// //                     </button>
// //                   </div>
// //                 </div>
// //               ))}
// //           </div>
// //         </div>
// //       ) : (
// //         // ✅ Test Results Tab
// //         <div className="tab-content">
// //           <div className="card results-section">
// //             <h5>Candidate Test Results</h5>
// //             {loadingResults ? (
// //               <div>Loading test results...</div>
// //             ) : results.length === 0 ? (
// //               <div className="text-muted">No test results yet</div>
// //             ) : (
// //               <table className="results-table">
// //                 <thead>
// //                   <tr>
// //                     <th>Name</th>
// //                     <th>Email</th>
// //                     <th>Total</th>
// //                     <th>Correct</th>
// //                     <th>Score %</th>
// //                     <th>Status</th>
// //                     <th>Submitted At</th>
// //                     <th>Action</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {results.map((res, idx) => (
// //                     <tr key={idx}>
// //                       <td>{res.name}</td>
// //                       <td>{res.email}</td>
// //                       <td>{res.totalQuestions}</td>
// //                       <td>{res.correctAnswers}</td>
// //                       <td>{res.scorePercent}%</td>
// //                       <td>
// //                         <span
// //                           style={{
// //                             color:
// //                               res.status === "Validated" ? "green" : "orange",
// //                             fontWeight: 600,
// //                           }}
// //                         >
// //                           {res.status || "Validation Pending"}
// //                         </span>
// //                       </td>
// //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// //                       <td>
// //                         <button
// //                           className="btn btn-sm btn-primary"
// //                           onClick={() => handleViewValidation(res._id)}
// //                         >
// //                           View / Validate
// //                         </button>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             )}
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // // import React, { useEffect, useState } from "react";
// // // import API from "../services/api";
// // // import { useNavigate } from "react-router-dom";
// // // import "../styles/AdminDashboard.css";

// // // export default function AdminDashboard() {
// // //   const navigate = useNavigate();
// // //   const [questions, setQuestions] = useState([]);
// // //   const [results, setResults] = useState([]);
// // //   const [activeTab, setActiveTab] = useState("questions");
// // //   const [form, setForm] = useState({
// // //     questionText: "",
// // //     answerText: "",
// // //   });
// // //   const [file, setFile] = useState(null);
// // //   const [loading, setLoading] = useState(false);
// // //   const [loadingResults, setLoadingResults] = useState(false);
// // //   const [editingId, setEditingId] = useState(null);

// // //   // 🧩 Test control state
// // //   const [testControl, setTestControl] = useState({
// // //     isActive: false,
// // //     questionLimit: 10,
// // //     timeLimit: 30,
// // //   });

// // //   // 🟢 Check admin login
// // //   useEffect(() => {
// // //     const token = localStorage.getItem("adminToken");
// // //     if (!token) navigate("/admin/login");
// // //   }, [navigate]);

// // //   // 🟢 Initial fetch
// // //   useEffect(() => {
// // //     fetchQuestions();
// // //     fetchResults();
// // //     fetchTestControl();
// // //   }, []);

// // //   // ✅ Fetch Test Control
// // //   const fetchTestControl = async () => {
// // //     try {
// // //       const res = await API.testcontrol.get();
// // //       if (res.data) setTestControl(res.data);
// // //     } catch (err) {
// // //       console.error("Error fetching test control:", err);
// // //     }
// // //   };

// // //   // ✅ Update Test Control + Activate users
// // //   const handleStartTest = async () => {
// // //     try {
// // //       // 1️⃣ Start the test
// // //       await API.testcontrol.update({
// // //         isActive: true,
// // //         questionLimit: testControl.questionLimit,
// // //         timeLimit: testControl.timeLimit,
// // //       });

// // //       // 2️⃣ Activate all waiting users
// // //       const res = await API.user.activateAll();
// // //       alert(res.data.message || "✅ Test started, all users activated!");
// // //       await fetchWaitingUsers();
// // //     } catch (err) {
// // //       console.error("❌ Failed to start test:", err);
// // //       alert("❌ Failed to start test.");
// // //     }
// // //   };

// // //   // ✅ Stop test
// // //   const handleStopTest = async () => {
// // //     try {
// // //       await API.testcontrol.update({ isActive: false });
// // //       alert("⏹️ Test stopped successfully!");
// // //       await fetchTestControl();
// // //     } catch (err) {
// // //       console.error("❌ Error stopping test:", err);
// // //       alert("Failed to stop test.");
// // //     }
// // //   };

// // //   // ✅ Clear last waiting user
// // //  const handleClearLastWaitingUser = async (status = "") => {
// // //   const confirmMsg = status
// // //     ? `Delete last ${status} user?`
// // //     : "Delete last user (any status)?";

// // //   if (!window.confirm(confirmMsg)) return;
// // //   try {
// // //     const res = await API.delete(`/waiting-users/last${status ? `?status=${status}` : ""}`);
// // //     alert(res.data.message);
// // //     await fetchWaitingUsers();
// // //   } catch (err) {
// // //     console.error("❌ Error deleting last user:", err);
// // //     alert(err.response?.data?.error || "Failed to delete user.");
// // //   }
// // // };

// // //   // ✅ Fetch Questions
// // //   const fetchQuestions = async () => {
// // //     try {
// // //       const res = await API.questions.getAll();
// // //       const data = Array.isArray(res.data)
// // //         ? res.data
// // //         : res.data.questions || [];
// // //       setQuestions(data);
// // //     } catch (err) {
// // //       console.error(err);
// // //       alert("❌ Failed to load questions.");
// // //     }
// // //   };

// // //   // ✅ Fetch Results
// // //   const fetchResults = async () => {
// // //     setLoadingResults(true);
// // //     try {
// // //       const res = await API.tests.getAll();
// // //       setResults(res.data || []);
// // //     } catch (err) {
// // //       console.error(err);
// // //       alert("❌ Failed to load test results.");
// // //     } finally {
// // //       setLoadingResults(false);
// // //     }
// // //   };

// // //   // 🟢 Waiting Users
// // //   const [waitingUsers, setWaitingUsers] = useState([]);
// // //   const [waitingCount, setWaitingCount] = useState(0);

// // //   const fetchWaitingUsers = async () => {
// // //     try {
// // //       const res = await API.waitingUsers.getAll();
// // //       setWaitingUsers(res.data || []);
// // //       setWaitingCount(res.data?.length || 0);
// // //     } catch (err) {
// // //       console.error("❌ Error fetching waiting users:", err);
// // //     }
// // //   };

// // //   // 🔄 Periodically fetch users
// // //   useEffect(() => {
// // //     fetchWaitingUsers();
// // //     const interval = setInterval(fetchWaitingUsers, 5000);
// // //     return () => clearInterval(interval);
// // //   }, []);

// // //   const handleLogout = () => {
// // //     localStorage.removeItem("adminToken");
// // //     navigate("/admin/login");
// // //   };

// // //   const handleViewValidation = (id) => {
// // //     navigate(`/admin/result/${id}`);
// // //   };

// // //   // ✅ Add / Update Question
// // //   const handleAddOrUpdate = async (e) => {
// // //     e.preventDefault();

// // //     if (!form.questionText.trim()) {
// // //       return alert("Please enter question text.");
// // //     }

// // //     setLoading(true);
// // //     try {
// // //       const payload = {
// // //         questionType: "Theory",
// // //         questionText: form.questionText,
// // //         correctAnswer: form.answerText,
// // //       };

// // //       if (editingId) {
// // //         await API.questions.update(editingId, payload);
// // //         alert("✅ Question updated successfully!");
// // //       } else {
// // //         await API.questions.create(payload);
// // //         alert("✅ Question added successfully!");
// // //       }

// // //       setForm({ questionText: "", answerText: "" });
// // //       setEditingId(null);
// // //       await fetchQuestions();
// // //     } catch (err) {
// // //       console.error(err);
// // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const handleEdit = (q) => {
// // //     setEditingId(q._id);
// // //     setForm({
// // //       questionText: q.questionText,
// // //       answerText: q.correctAnswer || "",
// // //     });
// // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // //   };

// // //   const handleDelete = async (id) => {
// // //     if (!window.confirm("Are you sure you want to delete this question?")) return;
// // //     try {
// // //       await API.questions.delete(id);
// // //       alert("🗑️ Question deleted successfully!");
// // //       await fetchQuestions();
// // //     } catch (err) {
// // //       console.error(err);
// // //       alert("❌ Failed to delete question.");
// // //     }
// // //   };

// // //   const handleUpload = async () => {
// // //     if (!file) return alert("Please select a file to upload.");
// // //     const fd = new FormData();
// // //     fd.append("file", file);

// // //     try {
// // //       const res = await API.questions.uploadDoc(fd);
// // //       alert(res.data.message || "✅ File uploaded successfully!");
// // //       await fetchQuestions();
// // //     } catch (err) {
// // //       console.error(err);
// // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // //     }
// // //   };

// // //   return (
// // //     <div className="admin-dashboard">
// // //       <div className="admin-header">
// // //         <h2>Admin Dashboard</h2>
// // //         <button className="logout-btn" onClick={handleLogout}>
// // //           Logout
// // //         </button>
// // //       </div>

// // //       {/* Tabs */}
// // //       <div className="tab-buttons">
// // //         <button
// // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // //           onClick={() => setActiveTab("questions")}
// // //         >
// // //           🧩 Questions
// // //         </button>
// // //         <button
// // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // //           onClick={() => setActiveTab("results")}
// // //         >
// // //           📊 Test Results
// // //         </button>
// // //       </div>

// // //       {activeTab === "questions" ? (
// // //         <div className="tab-content">
// // //           {/* ✅ Test Control Panel */}
// // //           <div className="card form-section">
// // //             <h5>🕹️ Test Control Panel</h5>

// // //             {/* ✅ Live Waiting Users Section */}
// // //             <div className="card form-section mt-4">
// // //               <div className="d-flex justify-content-between align-items-center">
// // //                 <h5>🕒 Live Waiting Users</h5>
// // //                <button onClick={() => handleClearLastWaitingUser()}>🗑️ Clear Any Last User</button>
// // //                 <button onClick={() => handleClearLastWaitingUser("waiting")}>🗑️ Clear Waiting</button>
// // //                 <button onClick={() => handleClearLastWaitingUser("active")}>🗑️ Clear Active</button>
// // //                 <button onClick={() => handleClearLastWaitingUser("finished")}>🗑️ Clear Finished</button>

// // //               </div>

// // //               <p className="text-muted mb-2">
// // //                 Total Waiting: <strong>{waitingCount}</strong>
// // //               </p>

// // //               {waitingUsers.length === 0 ? (
// // //                 <div className="text-secondary small">No users are waiting currently.</div>
// // //               ) : (
// // //                 <table className="table table-sm table-bordered">
// // //                   <thead>
// // //                     <tr>
// // //                       <th>#</th>
// // //                       <th>Full Name</th>
// // //                       <th>Email</th>
// // //                       <th>Status</th>
// // //                     </tr>
// // //                   </thead>
// // //                   <tbody>
// // //                     {waitingUsers.map((user, index) => (
// // //                       <tr key={user._id}>
// // //                         <td>{index + 1}</td>
// // //                         <td>{user.fullName}</td>
// // //                         <td>{user.email}</td>
// // //                         <td>{user.status}</td>
// // //                       </tr>
// // //                     ))}
// // //                   </tbody>
// // //                 </table>
// // //               )}
// // //             </div>

// // //             <div className="mb-3">
// // //               <label>Number of Questions</label>
// // //               <input
// // //                 type="number"
// // //                 className="form-control"
// // //                 value={testControl.questionLimit}
// // //                 onChange={(e) =>
// // //                   setTestControl({
// // //                     ...testControl,
// // //                     questionLimit: e.target.value,
// // //                   })
// // //                 }
// // //               />
// // //             </div>

// // //             <div className="mb-3">
// // //               <label>Time Limit (minutes)</label>
// // //               <input
// // //                 type="number"
// // //                 className="form-control"
// // //                 value={testControl.timeLimit}
// // //                 onChange={(e) =>
// // //                   setTestControl({
// // //                     ...testControl,
// // //                     timeLimit: e.target.value,
// // //                   })
// // //                 }
// // //               />
// // //             </div>

// // //             <div className="mb-3">
// // //               <label>Status: </label>
// // //               <span
// // //                 className={`ms-2 fw-bold ${
// // //                   testControl.isActive ? "text-success" : "text-danger"
// // //                 }`}
// // //               >
// // //                 {testControl.isActive ? "Active" : "Inactive"}
// // //               </span>
// // //             </div>

// // //             <div className="d-flex gap-2">
// // //               <button className="btn btn-success" onClick={handleStartTest}>
// // //                 ▶️ Start Test
// // //               </button>
// // //               <button className="btn btn-danger" onClick={handleStopTest}>
// // //                 ⏹️ Stop Test
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       ) : (
// // //         // ✅ Test Results Tab
// // //         <div className="tab-content">
// // //           <div className="card results-section">
// // //             <h5>Candidate Test Results</h5>
// // //             {loadingResults ? (
// // //               <div>Loading test results...</div>
// // //             ) : results.length === 0 ? (
// // //               <div className="text-muted">No test results yet</div>
// // //             ) : (
// // //               <table className="results-table">
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Name</th>
// // //                     <th>Email</th>
// // //                     <th>Total</th>
// // //                     <th>Correct</th>
// // //                     <th>Score %</th>
// // //                     <th>Status</th>
// // //                     <th>Submitted At</th>
// // //                     <th>Action</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {results.map((res, idx) => (
// // //                     <tr key={idx}>
// // //                       <td>{res.name}</td>
// // //                       <td>{res.email}</td>
// // //                       <td>{res.totalQuestions}</td>
// // //                       <td>{res.correctAnswers}</td>
// // //                       <td>{res.scorePercent}%</td>
// // //                       <td>
// // //                         <span
// // //                           style={{
// // //                             color:
// // //                               res.status === "Validated" ? "green" : "orange",
// // //                             fontWeight: 600,
// // //                           }}
// // //                         >
// // //                           {res.status || "Validation Pending"}
// // //                         </span>
// // //                       </td>
// // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // //                       <td>
// // //                         <button
// // //                           className="btn btn-sm btn-primary"
// // //                           onClick={() => handleViewValidation(res._id)}
// // //                         >
// // //                           View / Validate
// // //                         </button>
// // //                       </td>
// // //                     </tr>
// // //                   ))}
// // //                 </tbody>
// // //               </table>
// // //             )}
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // // import React, { useEffect, useState } from "react";
// // // // import API from "../services/api";
// // // // import { useNavigate } from "react-router-dom";
// // // // import "../styles/AdminDashboard.css";

// // // // export default function AdminDashboard() {
// // // //   const navigate = useNavigate();
// // // //   const [questions, setQuestions] = useState([]);
// // // //   const [results, setResults] = useState([]);
// // // //   const [activeTab, setActiveTab] = useState("questions");
// // // //   const [form, setForm] = useState({
// // // //     questionText: "",
// // // //     answerText: "",
// // // //   });
// // // //   const [file, setFile] = useState(null);
// // // //   const [loading, setLoading] = useState(false);
// // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // //   const [editingId, setEditingId] = useState(null);

// // // //   // 🧩 Test control state
// // // //   const [testControl, setTestControl] = useState({
// // // //     isActive: false,
// // // //     questionLimit: 10,
// // // //     timeLimit: 30,
// // // //   });

// // // //   // 🟢 Check admin login
// // // //   useEffect(() => {
// // // //     const token = localStorage.getItem("adminToken");
// // // //     if (!token) navigate("/admin/login");
// // // //   }, [navigate]);

// // // //   // 🟢 Initial fetch
// // // //   useEffect(() => {
// // // //     fetchQuestions();
// // // //     fetchResults();
// // // //     fetchTestControl();
// // // //   }, []);

// // // //   // ✅ Fetch Test Control
// // // //   const fetchTestControl = async () => {
// // // //     try {
// // // //       const res = await API.testcontrol.get();
// // // //       if (res.data) setTestControl(res.data);
// // // //     } catch (err) {
// // // //       console.error("Error fetching test control:", err);
// // // //     }
// // // //   };

// // // //     const handleClearLastWaitingUser = async () => {
// // // //     if (!window.confirm("Are you sure you want to delete the last waiting user?")) return;
// // // //     try {
// // // //       const res = await API.waitingUsers.deleteLast();
// // // //       alert(res.data.message || "Last waiting user deleted.");
// // // //       // Refresh the waiting list immediately
// // // //       const updated = await API.waitingUsers.getAll();
// // // //       setWaitingUsers(updated.data || []);
// // // //       setWaitingCount(updated.data?.length || 0);
// // // //     } catch (err) {
// // // //       console.error("❌ Error deleting last waiting user:", err);
// // // //       alert(err.response?.data?.error || "Failed to delete last waiting user.");
// // // //     }
// // // //   };



// // // //   // ✅ Update Test Control
// // // //   const updateTestControl = async (updates) => {
// // // //     try {
// // // //       const res = await API.testcontrol.update(updates);
// // // //       if (res.data) setTestControl(res.data);
// // // //       alert("✅ Test control updated successfully!");
// // // //     } catch (err) {
// // // //       console.error("❌ Failed to update test control:", err);
// // // //       alert("❌ Failed to update test control.");
// // // //     }
// // // //   };

// // // //   // ✅ Fetch Questions
// // // //   const fetchQuestions = async () => {
// // // //     try {
// // // //       const res = await API.questions.getAll();
// // // //       const data = Array.isArray(res.data)
// // // //         ? res.data
// // // //         : res.data.questions || [];
// // // //       setQuestions(data);
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //       alert("❌ Failed to load questions.");
// // // //     }
// // // //   };

// // // //   // ✅ Fetch Results
// // // //   const fetchResults = async () => {
// // // //     setLoadingResults(true);
// // // //     try {
// // // //       const res = await API.tests.getAll();
// // // //       setResults(res.data || []);
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //       alert("❌ Failed to load test results.");
// // // //     } finally {
// // // //       setLoadingResults(false);
// // // //     }
// // // //   };

// // // //   // ✅ Add / Update Question
// // // //   const handleAddOrUpdate = async (e) => {
// // // //     e.preventDefault();

// // // //     if (!form.questionText.trim()) {
// // // //       return alert("Please enter question text.");
// // // //     }

// // // //     setLoading(true);
// // // //     try {
// // // //       const payload = {
// // // //         questionType: "Theory",
// // // //         questionText: form.questionText,
// // // //         correctAnswer: form.answerText,
// // // //       };

// // // //       if (editingId) {
// // // //         await API.questions.update(editingId, payload);
// // // //         alert("✅ Question updated successfully!");
// // // //       } else {
// // // //         await API.questions.create(payload);
// // // //         alert("✅ Question added successfully!");
// // // //       }

// // // //       setForm({ questionText: "", answerText: "" });
// // // //       setEditingId(null);
// // // //       await fetchQuestions();
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // ✅ Delete Question
// // // //   const handleDelete = async (id) => {
// // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;
// // // //     try {
// // // //       await API.questions.delete(id);
// // // //       alert("🗑️ Question deleted successfully!");
// // // //       await fetchQuestions();
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //       alert("❌ Failed to delete question.");
// // // //     }
// // // //   };

// // // //   // ✅ Edit Question
// // // //   const handleEdit = (q) => {
// // // //     setEditingId(q._id);
// // // //     setForm({
// // // //       questionText: q.questionText,
// // // //       answerText: q.correctAnswer || "",
// // // //     });
// // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // //   };

// // // //   // ✅ Upload File
// // // //   const handleUpload = async () => {
// // // //     if (!file) return alert("Please select a file to upload.");
// // // //     const fd = new FormData();
// // // //     fd.append("file", file);

// // // //     try {
// // // //       const res = await API.questions.uploadDoc(fd);
// // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // //       await fetchQuestions();
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // //     }
// // // //   };

// // // //   const handleLogout = () => {
// // // //     localStorage.removeItem("adminToken");
// // // //     navigate("/admin/login");
// // // //   };

// // // //   const handleViewValidation = (id) => {
// // // //     navigate(`/admin/result/${id}`);
// // // //   };
// // // //     // 🟢 Waiting Users
// // // //   const [waitingUsers, setWaitingUsers] = useState([]);
// // // //   const [waitingCount, setWaitingCount] = useState(0);

// // // //   // 🔄 Fetch waiting users periodically
// // // //   useEffect(() => {
// // // //     const fetchWaitingUsers = async () => {
// // // //       try {
// // // //         const res = await API.waitingUsers.getAll();
// // // //         setWaitingUsers(res.data || []);
// // // //         setWaitingCount(res.data?.length || 0);
// // // //       } catch (err) {
// // // //         console.error("❌ Error fetching waiting users:", err);
// // // //       }
// // // //     };

// // // //     fetchWaitingUsers();
// // // //     const interval = setInterval(fetchWaitingUsers, 5000); // refresh every 5s
// // // //     return () => clearInterval(interval);
// // // //   }, []);


// // // //   return (
// // // //     <div className="admin-dashboard">
// // // //       {/* Header */}
// // // //       <div className="admin-header">
// // // //         <h2>Admin Dashboard</h2>
// // // //         <button className="logout-btn" onClick={handleLogout}>
// // // //           Logout
// // // //         </button>
// // // //       </div>

// // // //       {/* Tabs */}
// // // //       <div className="tab-buttons">
// // // //         <button
// // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // //           onClick={() => setActiveTab("questions")}
// // // //         >
// // // //           🧩 Questions
// // // //         </button>
// // // //         <button
// // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // //           onClick={() => setActiveTab("results")}
// // // //         >
// // // //           📊 Test Results
// // // //         </button>
// // // //       </div>

// // // //       {activeTab === "questions" ? (
// // // //         <div className="tab-content">
// // // //           {/* ✅ Test Control Panel */}
// // // //           <div className="card form-section">
// // // //             <h5>🕹️ Test Control Panel</h5>


// // // //           {/* ✅ Live Waiting Users Section */}
// // // // <div className="card form-section mt-4">
// // // //   <div className="d-flex justify-content-between align-items-center">
// // // //     <h5>🕒 Live Waiting Users</h5>
// // // //     <button
// // // //       className="btn btn-sm btn-outline-danger"
// // // //       onClick={handleClearLastWaitingUser}
// // // //       disabled={waitingUsers.length === 0}
// // // //     >
// // // //       🗑️ Clear Last Entry
// // // //     </button>
// // // //   </div>

// // // //   <p className="text-muted mb-2">
// // // //     Total Waiting: <strong>{waitingCount}</strong>
// // // //   </p>

// // // //   {waitingUsers.length === 0 ? (
// // // //     <div className="text-secondary small">No users are waiting currently.</div>
// // // //   ) : (
// // // //     <table className="table table-sm table-bordered">
// // // //       <thead>
// // // //         <tr>
// // // //           <th>#</th>
// // // //           <th>Full Name</th>
// // // //           <th>Email</th>
// // // //         </tr>
// // // //       </thead>
// // // //       <tbody>
// // // //         {waitingUsers.map((user, index) => (
// // // //           <tr key={user._id}>
// // // //             <td>{index + 1}</td>
// // // //             <td>{user.fullName}</td>
// // // //             <td>{user.email}</td>
// // // //           </tr>
// // // //         ))}
// // // //       </tbody>
// // // //     </table>
// // // //   )}
// // // // </div>

 
// // // //             <div className="mb-3">
// // // //               <label>Number of Questions</label>
// // // //               <input
// // // //                 type="number"
// // // //                 className="form-control"
// // // //                 value={testControl.questionLimit}
// // // //                 onChange={(e) =>
// // // //                   setTestControl({
// // // //                     ...testControl,
// // // //                     questionLimit: e.target.value,
// // // //                   })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="mb-3">
// // // //               <label>Time Limit (minutes)</label>
// // // //               <input
// // // //                 type="number"
// // // //                 className="form-control"
// // // //                 value={testControl.timeLimit}
// // // //                 onChange={(e) =>
// // // //                   setTestControl({
// // // //                     ...testControl,
// // // //                     timeLimit: e.target.value,
// // // //                   })
// // // //                 }
// // // //               />
// // // //             </div>

// // // //             <div className="mb-3">
// // // //               <label>Status: </label>
// // // //               <span
// // // //                 className={`ms-2 fw-bold ${
// // // //                   testControl.isActive ? "text-success" : "text-danger"
// // // //                 }`}
// // // //               >
// // // //                 {testControl.isActive ? "Active" : "Inactive"}
// // // //               </span>
// // // //             </div>

// // // //             <div className="d-flex gap-2">
// // // //               <button
// // // //                 className="btn btn-success"
// // // //                 onClick={() =>
// // // //                   updateTestControl({
// // // //                     isActive: true,
// // // //                     questionLimit: testControl.questionLimit,
// // // //                     timeLimit: testControl.timeLimit,
// // // //                   })
// // // //                 }
// // // //               >
// // // //                 ▶️ Start Test
// // // //               </button>
// // // //               <button
// // // //                 className="btn btn-danger"
// // // //                 onClick={() =>
// // // //                   updateTestControl({
// // // //                     isActive: false,
// // // //                   })
// // // //                 }
// // // //               >
// // // //                 ⏹️ Stop Test
// // // //               </button>
// // // //             </div>
// // // //           </div>

// // // //           {/* ✅ Question Form */}
// // // //           <div className="card form-section mt-4">
// // // //             <h5>
// // // //               {editingId ? "✏️ Edit Theory Question" : "➕ Add / Upload Questions"}
// // // //             </h5>

// // // //             <form onSubmit={handleAddOrUpdate}>
// // // //               <div className="mb-3">
// // // //                 <label className="form-label">Question Text</label>
// // // //                 <textarea
// // // //                   className="form-control"
// // // //                   rows={3}
// // // //                   value={form.questionText}
// // // //                   onChange={(e) =>
// // // //                     setForm({ ...form, questionText: e.target.value })
// // // //                   }
// // // //                   placeholder="Enter your theory question here..."
// // // //                 />
// // // //               </div>

// // // //               <div className="mb-3">
// // // //                 <label className="form-label">Model Answer</label>
// // // //                 <textarea
// // // //                   className="form-control"
// // // //                   rows={4}
// // // //                   value={form.answerText}
// // // //                   onChange={(e) =>
// // // //                     setForm({ ...form, answerText: e.target.value })
// // // //                   }
// // // //                   placeholder="Enter model answer for theory question"
// // // //                 />
// // // //               </div>

// // // //               <div className="d-flex gap-2">
// // // //                 <button
// // // //                   className="btn btn-success"
// // // //                   type="submit"
// // // //                   disabled={loading}
// // // //                 >
// // // //                   {loading
// // // //                     ? "Saving..."
// // // //                     : editingId
// // // //                     ? "Update Question"
// // // //                     : "Add Question"}
// // // //                 </button>
// // // //                 <button
// // // //                   type="button"
// // // //                   className="btn btn-secondary"
// // // //                   onClick={() => {
// // // //                     setForm({ questionText: "", answerText: "" });
// // // //                     setEditingId(null);
// // // //                   }}
// // // //                 >
// // // //                   Clear
// // // //                 </button>
// // // //               </div>
// // // //             </form>

// // // //             <hr className="my-4" />

// // // //             {/* ✅ Upload Section */}
// // // //             <div className="upload-section">
// // // //               <label className="form-label">Upload File (.txt / .docx)</label>
// // // //               <input
// // // //                 type="file"
// // // //                 className="form-control"
// // // //                 accept=".txt,.docx"
// // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // //               />
// // // //               <div className="mt-2">
// // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // //                   Upload
// // // //                 </button>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* ✅ Available Questions */}
// // // //           <div className="card available-questions mt-4">
// // // //             <h5>Available Theory Questions</h5>

// // // //             {Array.isArray(questions) &&
// // // //               questions.length === 0 && (
// // // //                 <div className="text-muted">No theory questions yet</div>
// // // //               )}

// // // //             {Array.isArray(questions) &&
// // // //               questions.map((q, idx) => (
// // // //                 <div key={q._id} className="question-item">
// // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // //                   {q.correctAnswer && (
// // // //                     <div className="small text-success">
// // // //                       <b>Model Answer:</b> {q.correctAnswer}
// // // //                     </div>
// // // //                   )}
// // // //                   <div className="action-buttons">
// // // //                     <button
// // // //                       className="btn btn-sm btn-warning"
// // // //                       onClick={() => handleEdit(q)}
// // // //                     >
// // // //                       Edit
// // // //                     </button>
// // // //                     <button
// // // //                       className="btn btn-sm btn-danger"
// // // //                       onClick={() => handleDelete(q._id)}
// // // //                     >
// // // //                       Delete
// // // //                     </button>
// // // //                   </div>
// // // //                 </div>
// // // //               ))}
// // // //           </div>
// // // //         </div>
// // // //       ) : (
// // // //         // ✅ Test Results Tab
// // // //         <div className="tab-content">
// // // //           <div className="card results-section">
// // // //             <h5>Candidate Test Results</h5>
// // // //             {loadingResults ? (
// // // //               <div>Loading test results...</div>
// // // //             ) : results.length === 0 ? (
// // // //               <div className="text-muted">No test results yet</div>
// // // //             ) : (
// // // //               <table className="results-table">
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Name</th>
// // // //                     <th>Email</th>
// // // //                     <th>Total</th>
// // // //                     <th>Correct</th>
// // // //                     <th>Score %</th>
// // // //                     <th>Status</th>
// // // //                     <th>Submitted At</th>
// // // //                     <th>Action</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {results.map((res, idx) => (
// // // //                     <tr key={idx}>
// // // //                       <td>{res.name}</td>
// // // //                       <td>{res.email}</td>
// // // //                       <td>{res.totalQuestions}</td>
// // // //                       <td>{res.correctAnswers}</td>
// // // //                       <td>{res.scorePercent}%</td>
// // // //                       <td>
// // // //                         <span
// // // //                           style={{
// // // //                             color:
// // // //                               res.status === "Validated" ? "green" : "orange",
// // // //                             fontWeight: 600,
// // // //                           }}
// // // //                         >
// // // //                           {res.status || "Validation Pending"}
// // // //                         </span>
// // // //                       </td>
// // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // //                       <td>
// // // //                         <button
// // // //                           className="btn btn-sm btn-primary"
// // // //                           onClick={() => handleViewValidation(res._id)}
// // // //                         >
// // // //                           View / Validate
// // // //                         </button>
// // // //                       </td>
// // // //                     </tr>
// // // //                   ))}
// // // //                 </tbody>
// // // //               </table>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // }
// // // // // import React, { useEffect, useState } from "react";
// // // // // import API from "../services/api";
// // // // // import { useNavigate } from "react-router-dom";
// // // // // import "../styles/AdminDashboard.css";

// // // // // export default function AdminDashboard() {
// // // // //   const navigate = useNavigate();
// // // // //   const [questions, setQuestions] = useState([]);
// // // // //   const [results, setResults] = useState([]);
// // // // //   const [activeTab, setActiveTab] = useState("questions");
// // // // //   const [form, setForm] = useState({
// // // // //     questionText: "",
// // // // //     answerText: "",
// // // // //   });
// // // // //   const [file, setFile] = useState(null);
// // // // //   const [loading, setLoading] = useState(false);
// // // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // // //   const [editingId, setEditingId] = useState(null);

// // // // //   // 🧩 Test control state
// // // // //   const [testControl, setTestControl] = useState({
// // // // //     isActive: false,
// // // // //     questionLimit: 10,
// // // // //     timeLimit: 30,
// // // // //   });

// // // // //   // 🟢 Check admin login
// // // // //   useEffect(() => {
// // // // //     const token = localStorage.getItem("adminToken");
// // // // //     if (!token) navigate("/admin/login");
// // // // //   }, [navigate]);

// // // // //   // 🟢 Initial fetch
// // // // //   useEffect(() => {
// // // // //     fetchQuestions();
// // // // //     fetchResults();
// // // // //     fetchTestControl();
// // // // //   }, []);

// // // // //   // ✅ Fetch Test Control
// // // // //   const fetchTestControl = async () => {
// // // // //     try {
// // // // //       const res = await API.testcontrol.get();
// // // // //       if (res.data) setTestControl(res.data);
// // // // //     } catch (err) {
// // // // //       console.error("Error fetching test control:", err);
// // // // //     }
// // // // //   };

// // // // //   // ✅ Update Test Control
// // // // //   const updateTestControl = async (updates) => {
// // // // //     try {
// // // // //       const res = await API.testcontrol.update(updates);
// // // // //       if (res.data) setTestControl(res.data);
// // // // //       alert("✅ Test control updated successfully!");
// // // // //     } catch (err) {
// // // // //       console.error("❌ Failed to update test control:", err);
// // // // //       alert("❌ Failed to update test control.");
// // // // //     }
// // // // //   };

// // // // //   // ✅ Fetch Questions
// // // // //   const fetchQuestions = async () => {
// // // // //     try {
// // // // //       const res = await API.questions.getAll();
// // // // //       const data = Array.isArray(res.data)
// // // // //         ? res.data
// // // // //         : res.data.questions || [];
// // // // //       setQuestions(data);
// // // // //     } catch (err) {
// // // // //       console.error(err);
// // // // //       alert("❌ Failed to load questions.");
// // // // //     }
// // // // //   };

// // // // //   // ✅ Fetch Results
// // // // //   const fetchResults = async () => {
// // // // //     setLoadingResults(true);
// // // // //     try {
// // // // //       const res = await API.tests.getAll();
// // // // //       setResults(res.data || []);
// // // // //     } catch (err) {
// // // // //       console.error(err);
// // // // //       alert("❌ Failed to load test results.");
// // // // //     } finally {
// // // // //       setLoadingResults(false);
// // // // //     }
// // // // //   };
// // // // //   const [waitingCount, setWaitingCount] = useState(0);

// // // // // const fetchWaitingCount = async () => {
// // // // //   try {
// // // // //     const res = await API.get("/waiting-users/count");
// // // // //     setWaitingCount(res.data.count);
// // // // //   } catch (err) {
// // // // //     console.error("Error fetching waiting users count:", err);
// // // // //   }
// // // // // };

// // // // // // Fetch waiting count once when page loads
// // // // // useEffect(() => {
// // // // //   fetchWaitingCount();
// // // // //   const interval = setInterval(fetchWaitingCount, 10000); // refresh every 10s
// // // // //   return () => clearInterval(interval);
// // // // // }, []);

// // // // //   // ✅ Add / Update Question
// // // // //   const handleAddOrUpdate = async (e) => {
// // // // //     e.preventDefault();

// // // // //     if (!form.questionText.trim()) {
// // // // //       return alert("Please enter question text.");
// // // // //     }

// // // // //     setLoading(true);
// // // // //     try {
// // // // //       const payload = {
// // // // //         questionType: "Theory",
// // // // //         questionText: form.questionText,
// // // // //         correctAnswer: form.answerText,
// // // // //       };

// // // // //       if (editingId) {
// // // // //         await API.questions.update(editingId, payload);
// // // // //         alert("✅ Question updated successfully!");
// // // // //       } else {
// // // // //         await API.questions.create(payload);
// // // // //         alert("✅ Question added successfully!");
// // // // //       }

// // // // //       setForm({ questionText: "", answerText: "" });
// // // // //       setEditingId(null);
// // // // //       await fetchQuestions();
// // // // //     } catch (err) {
// // // // //       console.error(err);
// // // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   };

// // // // //   // ✅ Delete Question
// // // // //   const handleDelete = async (id) => {
// // // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;
// // // // //     try {
// // // // //       await API.questions.delete(id);
// // // // //       alert("🗑️ Question deleted successfully!");
// // // // //       await fetchQuestions();
// // // // //     } catch (err) {
// // // // //       console.error(err);
// // // // //       alert("❌ Failed to delete question.");
// // // // //     }
// // // // //   };

// // // // //   // ✅ Edit Question
// // // // //   const handleEdit = (q) => {
// // // // //     setEditingId(q._id);
// // // // //     setForm({
// // // // //       questionText: q.questionText,
// // // // //       answerText: q.correctAnswer || "",
// // // // //     });
// // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // //   };

// // // // //   // ✅ Upload File
// // // // //   const handleUpload = async () => {
// // // // //     if (!file) return alert("Please select a file to upload.");
// // // // //     const fd = new FormData();
// // // // //     fd.append("file", file);

// // // // //     try {
// // // // //       const res = await API.questions.uploadDoc(fd);
// // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // //       await fetchQuestions();
// // // // //     } catch (err) {
// // // // //       console.error(err);
// // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // //     }
// // // // //   };

// // // // //   const handleLogout = () => {
// // // // //     localStorage.removeItem("adminToken");
// // // // //     navigate("/admin/login");
// // // // //   };

// // // // //   const handleViewValidation = (id) => {
// // // // //     navigate(`/admin/result/${id}`);
// // // // //   };

// // // // //   return (
// // // // //     <div className="admin-dashboard">
// // // // //       {/* Header */}
// // // // //       <div className="admin-header">
// // // // //         <h2>Admin Dashboard</h2>
// // // // //         <button className="logout-btn" onClick={handleLogout}>
// // // // //           Logout
// // // // //         </button>
// // // // //       </div>

// // // // //       {/* Tabs */}
// // // // //       <div className="tab-buttons">
// // // // //         <button
// // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // //           onClick={() => setActiveTab("questions")}
// // // // //         >
// // // // //           🧩 Questions
// // // // //         </button>
// // // // //         <button
// // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // //           onClick={() => setActiveTab("results")}
// // // // //         >
// // // // //           📊 Test Results
// // // // //         </button>
// // // // //       </div>

// // // // //       {activeTab === "questions" ? (
// // // // //         <div className="tab-content">
// // // // //           {/* ✅ Test Control Panel */}
// // // // //           <div className="card form-section">
// // // // //             <h5>🕹️ Test Control Panel</h5>

// // // // //             <div className="mb-3">
// // // // //               <label>Number of Questions</label>
// // // // //               <input
// // // // //                 type="number"
// // // // //                 className="form-control"
// // // // //                 value={testControl.questionLimit}
// // // // //                 onChange={(e) =>
// // // // //                   setTestControl({
// // // // //                     ...testControl,
// // // // //                     questionLimit: e.target.value,
// // // // //                   })
// // // // //                 }
// // // // //               />
// // // // //             </div>

// // // // //                   <div className="card form-section mt-4">
// // // // //         <h5>🧍‍♂️ Waiting Users</h5>
// // // // //         <p className="text-muted">
// // // // //           Number of candidates waiting to start the test:
// // // // //         </p>
// // // // //         <h3 className="fw-bold text-primary">{waitingCount}</h3>
// // // // //       </div>


// // // // //             <div className="mb-3">
// // // // //               <label>Time Limit (minutes)</label>
// // // // //               <input
// // // // //                 type="number"
// // // // //                 className="form-control"
// // // // //                 value={testControl.timeLimit}
// // // // //                 onChange={(e) =>
// // // // //                   setTestControl({
// // // // //                     ...testControl,
// // // // //                     timeLimit: e.target.value,
// // // // //                   })
// // // // //                 }
// // // // //               />
// // // // //             </div>

// // // // //             <div className="mb-3">
// // // // //               <label>Status: </label>
// // // // //               <span
// // // // //                 className={`ms-2 fw-bold ${
// // // // //                   testControl.isActive ? "text-success" : "text-danger"
// // // // //                 }`}
// // // // //               >
// // // // //                 {testControl.isActive ? "Active" : "Inactive"}
// // // // //               </span>
// // // // //             </div>

// // // // //             <div className="d-flex gap-2">
// // // // //               <button
// // // // //                 className="btn btn-success"
// // // // //                 onClick={() =>
// // // // //                   updateTestControl({
// // // // //                     isActive: true,
// // // // //                     questionLimit: testControl.questionLimit,
// // // // //                     timeLimit: testControl.timeLimit,
// // // // //                   })
// // // // //                 }
// // // // //               >
// // // // //                 ▶️ Start Test
// // // // //               </button>
// // // // //               <button
// // // // //                 className="btn btn-danger"
// // // // //                 onClick={() =>
// // // // //                   updateTestControl({
// // // // //                     isActive: false,
// // // // //                   })
// // // // //                 }
// // // // //               >
// // // // //                 ⏹️ Stop Test
// // // // //               </button>
// // // // //             </div>
// // // // //           </div>

// // // // //           {/* ✅ Question Form */}
// // // // //           <div className="card form-section mt-4">
// // // // //             <h5>
// // // // //               {editingId ? "✏️ Edit Theory Question" : "➕ Add / Upload Questions"}
// // // // //             </h5>

// // // // //             <form onSubmit={handleAddOrUpdate}>
// // // // //               <div className="mb-3">
// // // // //                 <label className="form-label">Question Text</label>
// // // // //                 <textarea
// // // // //                   className="form-control"
// // // // //                   rows={3}
// // // // //                   value={form.questionText}
// // // // //                   onChange={(e) =>
// // // // //                     setForm({ ...form, questionText: e.target.value })
// // // // //                   }
// // // // //                   placeholder="Enter your theory question here..."
// // // // //                 />
// // // // //               </div>

// // // // //               <div className="mb-3">
// // // // //                 <label className="form-label">Model Answer</label>
// // // // //                 <textarea
// // // // //                   className="form-control"
// // // // //                   rows={4}
// // // // //                   value={form.answerText}
// // // // //                   onChange={(e) =>
// // // // //                     setForm({ ...form, answerText: e.target.value })
// // // // //                   }
// // // // //                   placeholder="Enter model answer for theory question"
// // // // //                 />
// // // // //               </div>

// // // // //               <div className="d-flex gap-2">
// // // // //                 <button
// // // // //                   className="btn btn-success"
// // // // //                   type="submit"
// // // // //                   disabled={loading}
// // // // //                 >
// // // // //                   {loading
// // // // //                     ? "Saving..."
// // // // //                     : editingId
// // // // //                     ? "Update Question"
// // // // //                     : "Add Question"}
// // // // //                 </button>
// // // // //                 <button
// // // // //                   type="button"
// // // // //                   className="btn btn-secondary"
// // // // //                   onClick={() => {
// // // // //                     setForm({ questionText: "", answerText: "" });
// // // // //                     setEditingId(null);
// // // // //                   }}
// // // // //                 >
// // // // //                   Clear
// // // // //                 </button>
// // // // //               </div>
// // // // //             </form>

// // // // //             <hr className="my-4" />

// // // // //             {/* ✅ Upload Section */}
// // // // //             <div className="upload-section">
// // // // //               <label className="form-label">Upload File (.txt / .docx)</label>
// // // // //               <input
// // // // //                 type="file"
// // // // //                 className="form-control"
// // // // //                 accept=".txt,.docx"
// // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // //               />
// // // // //               <div className="mt-2">
// // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // //                   Upload
// // // // //                 </button>
// // // // //               </div>
// // // // //             </div>
// // // // //           </div>

// // // // //           {/* ✅ Available Questions */}
// // // // //           <div className="card available-questions mt-4">
// // // // //             <h5>Available Theory Questions</h5>

// // // // //             {Array.isArray(questions) &&
// // // // //               questions.length === 0 && (
// // // // //                 <div className="text-muted">No theory questions yet</div>
// // // // //               )}

// // // // //             {Array.isArray(questions) &&
// // // // //               questions.map((q, idx) => (
// // // // //                 <div key={q._id} className="question-item">
// // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // //                   {q.correctAnswer && (
// // // // //                     <div className="small text-success">
// // // // //                       <b>Model Answer:</b> {q.correctAnswer}
// // // // //                     </div>
// // // // //                   )}
// // // // //                   <div className="action-buttons">
// // // // //                     <button
// // // // //                       className="btn btn-sm btn-warning"
// // // // //                       onClick={() => handleEdit(q)}
// // // // //                     >
// // // // //                       Edit
// // // // //                     </button>
// // // // //                     <button
// // // // //                       className="btn btn-sm btn-danger"
// // // // //                       onClick={() => handleDelete(q._id)}
// // // // //                     >
// // // // //                       Delete
// // // // //                     </button>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               ))}
// // // // //           </div>
// // // // //         </div>
// // // // //       ) : (
// // // // //         // ✅ Test Results Tab
// // // // //         <div className="tab-content">
// // // // //           <div className="card results-section">
// // // // //             <h5>Candidate Test Results</h5>
// // // // //             {loadingResults ? (
// // // // //               <div>Loading test results...</div>
// // // // //             ) : results.length === 0 ? (
// // // // //               <div className="text-muted">No test results yet</div>
// // // // //             ) : (
// // // // //               <table className="results-table">
// // // // //                 <thead>
// // // // //                   <tr>
// // // // //                     <th>Name</th>
// // // // //                     <th>Email</th>
// // // // //                     <th>Total</th>
// // // // //                     <th>Correct</th>
// // // // //                     <th>Score %</th>
// // // // //                     <th>Status</th>
// // // // //                     <th>Submitted At</th>
// // // // //                     <th>Action</th>
// // // // //                   </tr>
// // // // //                 </thead>
// // // // //                 <tbody>
// // // // //                   {results.map((res, idx) => (
// // // // //                     <tr key={idx}>
// // // // //                       <td>{res.name}</td>
// // // // //                       <td>{res.email}</td>
// // // // //                       <td>{res.totalQuestions}</td>
// // // // //                       <td>{res.correctAnswers}</td>
// // // // //                       <td>{res.scorePercent}%</td>
// // // // //                       <td>
// // // // //                         <span
// // // // //                           style={{
// // // // //                             color:
// // // // //                               res.status === "Validated" ? "green" : "orange",
// // // // //                             fontWeight: 600,
// // // // //                           }}
// // // // //                         >
// // // // //                           {res.status || "Validation Pending"}
// // // // //                         </span>
// // // // //                       </td>
// // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // //                       <td>
// // // // //                         <button
// // // // //                           className="btn btn-sm btn-primary"
// // // // //                           onClick={() => handleViewValidation(res._id)}
// // // // //                         >
// // // // //                           View / Validate
// // // // //                         </button>
// // // // //                       </td>
// // // // //                     </tr>
// // // // //                   ))}
// // // // //                 </tbody>
// // // // //               </table>
// // // // //             )}
// // // // //           </div>
// // // // //         </div>
// // // // //       )}
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // // // import React, { useEffect, useState } from "react";
// // // // // // import API from "../services/api";
// // // // // // import { useNavigate } from "react-router-dom";
// // // // // // import "../styles/AdminDashboard.css";

// // // // // // export default function AdminDashboard() {
// // // // // //   const navigate = useNavigate();
// // // // // //   const [questions, setQuestions] = useState([]);
// // // // // //   const [results, setResults] = useState([]);
// // // // // //   const [activeTab, setActiveTab] = useState("questions");
// // // // // //   const [form, setForm] = useState({
// // // // // //     questionText: "",
// // // // // //     answerText: "",
// // // // // //   });
// // // // // //   const [file, setFile] = useState(null);
// // // // // //   const [loading, setLoading] = useState(false);
// // // // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // // // //   const [editingId, setEditingId] = useState(null);

// // // // // //   // 🧠 Test Control
// // // // // //   const [control, setControl] = useState({
// // // // // //     isActive: false,
// // // // // //     questionLimit: 10,
// // // // // //     timeLimit: 10,
// // // // // //   });

// // // // // //   // 🟢 Check admin login
// // // // // //   useEffect(() => {
// // // // // //     const token = localStorage.getItem("adminToken");
// // // // // //     if (!token) navigate("/admin/login");
// // // // // //   }, [navigate]);

// // // // // //   // 🟢 Initial fetch
// // // // // //   useEffect(() => {
// // // // // //     fetchControl();
// // // // // //     fetchQuestions();
// // // // // //     fetchResults();
// // // // // //   }, []);

// // // // // //   const fetchControl = async () => {
// // // // // //     try {
// // // // // //       const res = await API.get("/testcontrol");
// // // // // //       if (res.data) setControl(res.data);
// // // // // //     } catch (err) {
// // // // // //       console.error(err);
// // // // // //     }
// // // // // //   };

// // // // // //   const updateControl = async () => {
// // // // // //     try {
// // // // // //       await API.post("/testcontrol/update", control, {
// // // // // //         headers: { Authorization: localStorage.getItem("adminToken") },
// // // // // //       });
// // // // // //       alert("✅ Test control updated successfully!");
// // // // // //       await fetchControl();
// // // // // //     } catch (err) {
// // // // // //       console.error(err);
// // // // // //       alert("❌ Failed to update test control.");
// // // // // //     }
// // // // // //   };

// // // // // //  const fetchQuestions = async () => {
// // // // // //   try {
// // // // // //     const res = await API.questions.getAll();
// // // // // //     // Handle both array or object response
// // // // // //     const data = Array.isArray(res.data)
// // // // // //       ? res.data
// // // // // //       : res.data.questions || [];
// // // // // //     setQuestions(data);
// // // // // //   } catch (err) {
// // // // // //     console.error(err);
// // // // // //     alert("❌ Failed to load questions.");
// // // // // //   }
// // // // // // };

// // // // // //   const fetchResults = async () => {
// // // // // //     setLoadingResults(true);
// // // // // //     try {
// // // // // //       const res = await API.tests.getAll();
// // // // // //       setResults(res.data || []);
// // // // // //     } catch (err) {
// // // // // //       console.error(err);
// // // // // //       alert("❌ Failed to load test results.");
// // // // // //     } finally {
// // // // // //       setLoadingResults(false);
// // // // // //     }
// // // // // //   };

// // // // // //   // 🟢 Add or Update Question (Theory only)
// // // // // //   const handleAddOrUpdate = async (e) => {
// // // // // //     e.preventDefault();
// // // // // //     if (!form.questionText.trim()) {
// // // // // //       return alert("Please enter question text.");
// // // // // //     }

// // // // // //     setLoading(true);
// // // // // //     try {
// // // // // //       const payload = {
// // // // // //         questionType: "Theory",
// // // // // //         questionText: form.questionText,
// // // // // //         correctAnswer: form.answerText,
// // // // // //       };

// // // // // //       if (editingId) {
// // // // // //         await API.questions.update(editingId, payload);
// // // // // //         alert("✅ Question updated successfully!");
// // // // // //       } else {
// // // // // //         await API.questions.create(payload);
// // // // // //         alert("✅ Question added successfully!");
// // // // // //       }

// // // // // //       setForm({ questionText: "", answerText: "" });
// // // // // //       setEditingId(null);
// // // // // //       await fetchQuestions();
// // // // // //     } catch (err) {
// // // // // //       console.error(err);
// // // // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // // // //     } finally {
// // // // // //       setLoading(false);
// // // // // //     }
// // // // // //   };

// // // // // //   // 🟢 Delete Question
// // // // // //   const handleDelete = async (id) => {
// // // // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;
// // // // // //     try {
// // // // // //       await API.questions.delete(id);
// // // // // //       alert("🗑️ Question deleted successfully!");
// // // // // //       await fetchQuestions();
// // // // // //     } catch (err) {
// // // // // //       console.error(err);
// // // // // //       alert("❌ Failed to delete question.");
// // // // // //     }
// // // // // //   };

// // // // // //   // 🟢 Edit Question
// // // // // //   const handleEdit = (q) => {
// // // // // //     setEditingId(q._id);
// // // // // //     setForm({
// // // // // //       questionText: q.questionText,
// // // // // //       answerText: q.correctAnswer || "",
// // // // // //     });
// // // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // // //   };

// // // // // //   // 🟢 Upload File (TXT or DOCX)
// // // // // //   const handleUpload = async () => {
// // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // //     const fd = new FormData();
// // // // // //     fd.append("file", file);

// // // // // //     try {
// // // // // //       const res = await API.questions.uploadDoc(fd);
// // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // //       await fetchQuestions();
// // // // // //     } catch (err) {
// // // // // //       console.error(err);
// // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // //     }
// // // // // //   };

// // // // // //   const handleLogout = () => {
// // // // // //     localStorage.removeItem("adminToken");
// // // // // //     navigate("/admin/login");
// // // // // //   };

// // // // // //   const handleViewValidation = (id) => {
// // // // // //     navigate(`/admin/result/${id}`);
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="admin-dashboard">
// // // // // //       {/* 🔧 Test Control Panel */}
// // // // // //       <div className="card control-panel">
// // // // // //         <h4>🕹️ Test Control Panel</h4>
// // // // // //         <div className="row">
// // // // // //           <div className="col">
// // // // // //             <label>Number of Questions</label>
// // // // // //             <input
// // // // // //               type="number"
// // // // // //               className="form-control"
// // // // // //               value={control.questionLimit}
// // // // // //               onChange={(e) =>
// // // // // //                 setControl({ ...control, questionLimit: e.target.value })
// // // // // //               }
// // // // // //             />
// // // // // //           </div>
// // // // // //           <div className="col">
// // // // // //             <label>Time Limit (minutes)</label>
// // // // // //             <input
// // // // // //               type="number"
// // // // // //               className="form-control"
// // // // // //               value={control.timeLimit}
// // // // // //               onChange={(e) =>
// // // // // //                 setControl({ ...control, timeLimit: e.target.value })
// // // // // //               }
// // // // // //             />
// // // // // //           </div>
// // // // // //           <div className="col">
// // // // // //             <label>Status</label>
// // // // // //             <select
// // // // // //               className="form-select"
// // // // // //               value={control.isActive ? "true" : "false"}
// // // // // //               onChange={(e) =>
// // // // // //                 setControl({ ...control, isActive: e.target.value === "true" })
// // // // // //               }
// // // // // //             >
// // // // // //               <option value="false">Inactive</option>
// // // // // //               <option value="true">Active</option>
// // // // // //             </select>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //         <button onClick={updateControl} className="btn btn-primary mt-3">
// // // // // //           Update Test Control
// // // // // //         </button>
// // // // // //       </div>

// // // // // //       {/* Tabs */}
// // // // // //       <div className="tab-buttons mt-4">
// // // // // //         <button
// // // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // // //           onClick={() => setActiveTab("questions")}
// // // // // //         >
// // // // // //           🧩 Questions
// // // // // //         </button>
// // // // // //         <button
// // // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // // //           onClick={() => setActiveTab("results")}
// // // // // //         >
// // // // // //           📊 Test Results
// // // // // //         </button>
// // // // // //       </div>

// // // // // //       {/* 🧩 THEORY QUESTIONS TAB */}
// // // // // //       {activeTab === "questions" ? (
// // // // // //         <div className="tab-content">
// // // // // //           <div className="card form-section">
// // // // // //             <h5>{editingId ? "✏️ Edit Theory Question" : "➕ Add or Upload Theory Questions"}</h5>

// // // // // //             <form onSubmit={handleAddOrUpdate}>
// // // // // //               <div className="mb-3">
// // // // // //                 <label className="form-label">Question Text</label>
// // // // // //                 <textarea
// // // // // //                   className="form-control"
// // // // // //                   rows={3}
// // // // // //                   value={form.questionText}
// // // // // //                   onChange={(e) => setForm({ ...form, questionText: e.target.value })}
// // // // // //                   placeholder="Enter your theory question here..."
// // // // // //                 />
// // // // // //               </div>

// // // // // //               <div className="mb-3">
// // // // // //                 <label className="form-label">Model Answer</label>
// // // // // //                 <textarea
// // // // // //                   className="form-control"
// // // // // //                   rows={4}
// // // // // //                   value={form.answerText}
// // // // // //                   onChange={(e) => setForm({ ...form, answerText: e.target.value })}
// // // // // //                   placeholder="Enter model answer for theory question"
// // // // // //                 />
// // // // // //               </div>

// // // // // //               <div className="d-flex gap-2">
// // // // // //                 <button className="btn btn-success" type="submit" disabled={loading}>
// // // // // //                   {loading ? "Saving..." : editingId ? "Update Question" : "Add Question"}
// // // // // //                 </button>
// // // // // //                 <button
// // // // // //                   type="button"
// // // // // //                   className="btn btn-secondary"
// // // // // //                   onClick={() => {
// // // // // //                     setForm({ questionText: "", answerText: "" });
// // // // // //                     setEditingId(null);
// // // // // //                   }}
// // // // // //                 >
// // // // // //                   Clear
// // // // // //                 </button>
// // // // // //               </div>
// // // // // //             </form>

// // // // // //             <hr className="my-4" />

// // // // // //             <div className="upload-section">
// // // // // //               <label className="form-label">Upload File (.txt or .docx)</label>
// // // // // //               <input
// // // // // //                 type="file"
// // // // // //                 className="form-control"
// // // // // //                 accept=".txt,.docx"
// // // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // // //               />
// // // // // //               <div className="mt-2">
// // // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // // //                   Upload
// // // // // //                 </button>
// // // // // //               </div>
// // // // // //             </div>
// // // // // //           </div>

// // // // // //           <div className="card available-questions">
// // // // // //             <h5>Available Theory Questions</h5>

// // // // // //             {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // //               <div className="text-muted">No theory questions yet</div>
// // // // // //             )}

// // // // // //             {questions
// // // // // //               .filter((q) => q.questionType === "Theory")
// // // // // //               .map((q, idx) => (
// // // // // //                 <div key={q._id} className="question-item">
// // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // //                   {q.correctAnswer && (
// // // // // //                     <div className="small text-success">
// // // // // //                       <b>Model Answer:</b> {q.correctAnswer}
// // // // // //                     </div>
// // // // // //                   )}
// // // // // //                   <div className="action-buttons">
// // // // // //                     <button
// // // // // //                       className="btn btn-sm btn-warning"
// // // // // //                       onClick={() => handleEdit(q)}
// // // // // //                     >
// // // // // //                       Edit
// // // // // //                     </button>
// // // // // //                     <button
// // // // // //                       className="btn btn-sm btn-danger"
// // // // // //                       onClick={() => handleDelete(q._id)}
// // // // // //                     >
// // // // // //                       Delete
// // // // // //                     </button>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               ))}
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       ) : (
// // // // // //         // 📊 TEST RESULTS TAB
// // // // // //         <div className="tab-content">
// // // // // //           <div className="card results-section">
// // // // // //             <h5>Candidate Test Results</h5>
// // // // // //             {loadingResults ? (
// // // // // //               <div>Loading test results...</div>
// // // // // //             ) : results.length === 0 ? (
// // // // // //               <div className="text-muted">No test results yet</div>
// // // // // //             ) : (
// // // // // //               <table className="results-table">
// // // // // //                 <thead>
// // // // // //                   <tr>
// // // // // //                     <th>Name</th>
// // // // // //                     <th>Email</th>
// // // // // //                     <th>Total</th>
// // // // // //                     <th>Correct</th>
// // // // // //                     <th>Score %</th>
// // // // // //                     <th>Status</th>
// // // // // //                     <th>Submitted At</th>
// // // // // //                     <th>Action</th>
// // // // // //                   </tr>
// // // // // //                 </thead>
// // // // // //                 <tbody>
// // // // // //                   {results.map((res, idx) => (
// // // // // //                     <tr key={idx}>
// // // // // //                       <td>{res.name}</td>
// // // // // //                       <td>{res.email}</td>
// // // // // //                       <td>{res.totalQuestions}</td>
// // // // // //                       <td>{res.correctAnswers}</td>
// // // // // //                       <td>{res.scorePercent}%</td>
// // // // // //                       <td>
// // // // // //                         <span
// // // // // //                           style={{
// // // // // //                             color: res.status === "Validated" ? "green" : "orange",
// // // // // //                             fontWeight: 600,
// // // // // //                           }}
// // // // // //                         >
// // // // // //                           {res.status || "Validation Pending"}
// // // // // //                         </span>
// // // // // //                       </td>
// // // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // //                       <td>
// // // // // //                         <button
// // // // // //                           className="btn btn-sm btn-primary"
// // // // // //                           onClick={() => handleViewValidation(res._id)}
// // // // // //                         >
// // // // // //                           View / Validate
// // // // // //                         </button>
// // // // // //                       </td>
// // // // // //                     </tr>
// // // // // //                   ))}
// // // // // //                 </tbody>
// // // // // //               </table>
// // // // // //             )}
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       )}
// // // // // //     </div>
// // // // // //   );
// // // // // // }

// // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // import API from "../services/api";
// // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // export default function AdminDashboard() {
// // // // // // //   const navigate = useNavigate();
// // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // //   const [results, setResults] = useState([]);
// // // // // // //   const [activeTab, setActiveTab] = useState("questions");
// // // // // // //   const [form, setForm] = useState({
// // // // // // //     questionText: "",
// // // // // // //     answerText: "", // admin-entered model answer for theory
// // // // // // //   });
// // // // // // //   const [file, setFile] = useState(null);
// // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // // // // //   const [editingId, setEditingId] = useState(null);

// // // // // // //   // 🟢 Check admin login
// // // // // // //   useEffect(() => {
// // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // //     if (!token) navigate("/admin/login");
// // // // // // //   }, [navigate]);

// // // // // // //   // 🟢 Initial fetch
// // // // // // //   useEffect(() => {
// // // // // // //     fetchQuestions();
// // // // // // //     fetchResults();
// // // // // // //   }, []);

// // // // // // //   const fetchQuestions = async () => {
// // // // // // //     try {
// // // // // // //       const res = await API.questions.getAll();
// // // // // // //       setQuestions(res.data || []);
// // // // // // //     } catch (err) {
// // // // // // //       console.error(err);
// // // // // // //       alert("❌ Failed to load questions.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const fetchResults = async () => {
// // // // // // //     setLoadingResults(true);
// // // // // // //     try {
// // // // // // //       const res = await API.tests.getAll();
// // // // // // //       setResults(res.data || []);
// // // // // // //     } catch (err) {
// // // // // // //       console.error(err);
// // // // // // //       alert("❌ Failed to load test results.");
// // // // // // //     } finally {
// // // // // // //       setLoadingResults(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   // 🟢 Add or Update Question (Theory only)
// // // // // // //   const handleAddOrUpdate = async (e) => {
// // // // // // //     e.preventDefault();

// // // // // // //     if (!form.questionText.trim()) {
// // // // // // //       return alert("Please enter question text.");
// // // // // // //     }

// // // // // // //     setLoading(true);
// // // // // // //     try {
// // // // // // //       const payload = {
// // // // // // //         questionType: "Theory",
// // // // // // //         questionText: form.questionText,
// // // // // // //         correctAnswer: form.answerText,
// // // // // // //       };
// // // // // // //       console.log("Submitting payload ->", payload);

// // // // // // //       if (editingId) {
// // // // // // //         await API.questions.update(editingId, payload);
// // // // // // //         alert("✅ Question updated successfully!");
// // // // // // //       } else {
// // // // // // //         await API.questions.create(payload);
// // // // // // //         alert("✅ Question added successfully!");
// // // // // // //       }

// // // // // // //       setForm({ questionText: "", answerText: "" });
// // // // // // //       setEditingId(null);
// // // // // // //       await fetchQuestions();
// // // // // // //     } catch (err) {
// // // // // // //       console.error(err);
// // // // // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // // // // //     } finally {
// // // // // // //       setLoading(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   // 🟢 Delete Question
// // // // // // //   const handleDelete = async (id) => {
// // // // // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;
// // // // // // //     try {
// // // // // // //       await API.questions.delete(id);
// // // // // // //       alert("🗑️ Question deleted successfully!");
// // // // // // //       await fetchQuestions();
// // // // // // //     } catch (err) {
// // // // // // //       console.error(err);
// // // // // // //       alert("❌ Failed to delete question.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   // 🟢 Edit Question
// // // // // // //   const handleEdit = (q) => {
// // // // // // //     setEditingId(q._id);
// // // // // // //     setForm({
// // // // // // //       questionText: q.questionText,
// // // // // // //       answerText: q.correctAnswer || "",
// // // // // // //     });
// // // // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // // // //   };

// // // // // // //   // 🟢 Upload File (TXT or DOCX for Theory)
// // // // // // //   const handleUpload = async () => {
// // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // //     const fd = new FormData();
// // // // // // //     fd.append("file", file);

// // // // // // //     try {
// // // // // // //       const res = await API.questions.uploadDoc(fd);
// // // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // // //       await fetchQuestions();
// // // // // // //     } catch (err) {
// // // // // // //       console.error(err);
// // // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const handleLogout = () => {
// // // // // // //     localStorage.removeItem("adminToken");
// // // // // // //     navigate("/admin/login");
// // // // // // //   };

// // // // // // //   // 🟢 Navigate to validation page
// // // // // // //   const handleViewValidation = (id) => {
// // // // // // //     navigate(`/admin/result/${id}`);
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="admin-dashboard">
// // // // // // //       {/* Tabs */}
// // // // // // //       <div className="tab-buttons">
// // // // // // //         <button
// // // // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // // // //           onClick={() => setActiveTab("questions")}
// // // // // // //         >
// // // // // // //           🧩 Questions
// // // // // // //         </button>
// // // // // // //         <button
// // // // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // // // //           onClick={() => setActiveTab("results")}
// // // // // // //         >
// // // // // // //           📊 Test Results
// // // // // // //         </button>
// // // // // // //       </div>

// // // // // // //       {/* 🧩 THEORY QUESTIONS TAB */}
// // // // // // //       {activeTab === "questions" ? (
// // // // // // //         <div className="tab-content">
// // // // // // //           <div className="card form-section">
// // // // // // //             <h5>{editingId ? "✏️ Edit Theory Question" : "➕ Add or Upload Theory Questions"}</h5>

// // // // // // //             <form onSubmit={handleAddOrUpdate}>
// // // // // // //               <div className="mb-3">
// // // // // // //                 <label className="form-label">Question Text</label>
// // // // // // //                 <textarea
// // // // // // //                   className="form-control"
// // // // // // //                   rows={3}
// // // // // // //                   value={form.questionText}
// // // // // // //                   onChange={(e) => setForm({ ...form, questionText: e.target.value })}
// // // // // // //                   placeholder="Enter your theory question here..."
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="mb-3">
// // // // // // //                 <label className="form-label">Model Answer</label>
// // // // // // //                 <textarea
// // // // // // //                   className="form-control"
// // // // // // //                   rows={4}
// // // // // // //                   value={form.answerText}
// // // // // // //                   onChange={(e) => setForm({ ...form, answerText: e.target.value })}
// // // // // // //                   placeholder="Enter model answer for theory question"
// // // // // // //                 />
// // // // // // //               </div>

// // // // // // //               <div className="d-flex gap-2">
// // // // // // //                 <button className="btn btn-success" type="submit" disabled={loading}>
// // // // // // //                   {loading
// // // // // // //                     ? "Saving..."
// // // // // // //                     : editingId
// // // // // // //                     ? "Update Question"
// // // // // // //                     : "Add Question"}
// // // // // // //                 </button>
// // // // // // //                 <button
// // // // // // //                   type="button"
// // // // // // //                   className="btn btn-secondary"
// // // // // // //                   onClick={() => {
// // // // // // //                     setForm({ questionText: "", answerText: "" });
// // // // // // //                     setEditingId(null);
// // // // // // //                   }}
// // // // // // //                 >
// // // // // // //                   Clear
// // // // // // //                 </button>
// // // // // // //               </div>
// // // // // // //             </form>

// // // // // // //             <hr className="my-4" />

// // // // // // //             {/* Upload Section */}
// // // // // // //             <div className="upload-section">
// // // // // // //               <label className="form-label">Upload File (.txt or .docx)</label>
// // // // // // //               <input
// // // // // // //                 type="file"
// // // // // // //                 className="form-control"
// // // // // // //                 accept=".txt,.docx"
// // // // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // // // //               />
// // // // // // //               <div className="mt-2">
// // // // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // //                   Upload
// // // // // // //                 </button>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Display Theory Questions */}
// // // // // // //           <div className="card available-questions">
// // // // // // //             <h5>Available Theory Questions</h5>

// // // // // // //             {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // //               <div className="text-muted">No theory questions yet</div>
// // // // // // //             )}

// // // // // // //             {questions
// // // // // // //               .filter((q) => q.questionType === "Theory")
// // // // // // //               .map((q, idx) => (
// // // // // // //                 <div key={q._id} className="question-item">
// // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // //                   {q.correctAnswer && (
// // // // // // //                     <div className="small text-success">
// // // // // // //                       <b>Model Answer:</b> {q.correctAnswer}
// // // // // // //                     </div>
// // // // // // //                   )}
// // // // // // //                   <div className="action-buttons">
// // // // // // //                     <button
// // // // // // //                       className="btn btn-sm btn-warning"
// // // // // // //                       onClick={() => handleEdit(q)}
// // // // // // //                     >
// // // // // // //                       Edit
// // // // // // //                     </button>
// // // // // // //                     <button
// // // // // // //                       className="btn btn-sm btn-danger"
// // // // // // //                       onClick={() => handleDelete(q._id)}
// // // // // // //                     >
// // // // // // //                       Delete
// // // // // // //                     </button>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               ))}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       ) : (
// // // // // // //         // 📊 TEST RESULTS TAB
// // // // // // //         <div className="tab-content">
// // // // // // //           <div className="card results-section">
// // // // // // //             <h5>Candidate Test Results</h5>
// // // // // // //             {loadingResults ? (
// // // // // // //               <div>Loading test results...</div>
// // // // // // //             ) : results.length === 0 ? (
// // // // // // //               <div className="text-muted">No test results yet</div>
// // // // // // //             ) : (
// // // // // // //               <table className="results-table">
// // // // // // //                 <thead>
// // // // // // //                   <tr>
// // // // // // //                     <th>Name</th>
// // // // // // //                     <th>Email</th>
// // // // // // //                     <th>Total</th>
// // // // // // //                     <th>Correct</th>
// // // // // // //                     <th>Score %</th>
// // // // // // //                     <th>Status</th>
// // // // // // //                     <th>Submitted At</th>
// // // // // // //                     <th>Action</th>
// // // // // // //                   </tr>
// // // // // // //                 </thead>
// // // // // // //                 <tbody>
// // // // // // //                   {results.map((res, idx) => (
// // // // // // //                     <tr key={idx}>
// // // // // // //                       <td>{res.name}</td>
// // // // // // //                       <td>{res.email}</td>
// // // // // // //                       <td>{res.totalQuestions}</td>
// // // // // // //                       <td>{res.correctAnswers}</td>
// // // // // // //                       <td>{res.scorePercent}%</td>
// // // // // // //                       <td>
// // // // // // //                         <span
// // // // // // //                           style={{
// // // // // // //                             color:
// // // // // // //                               res.status === "Validated" ? "green" : "orange",
// // // // // // //                             fontWeight: 600,
// // // // // // //                           }}
// // // // // // //                         >
// // // // // // //                           {res.status || "Validation Pending"}
// // // // // // //                         </span>
// // // // // // //                       </td>
// // // // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // // //                       <td>
// // // // // // //                         <button
// // // // // // //                           className="btn btn-sm btn-primary"
// // // // // // //                           onClick={() => handleViewValidation(res._id)}
// // // // // // //                         >
// // // // // // //                           View / Validate
// // // // // // //                         </button>
// // // // // // //                       </td>
// // // // // // //                     </tr>
// // // // // // //                   ))}
// // // // // // //                 </tbody>
// // // // // // //               </table>
// // // // // // //             )}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // }

// // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // import API from "../services/api";
// // // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // // export default function AdminDashboard() {
// // // // // // // //   const navigate = useNavigate();
// // // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // // //   const [results, setResults] = useState([]);
// // // // // // // //   const [activeTab, setActiveTab] = useState("questions");
// // // // // // // //   const [form, setForm] = useState({
// // // // // // // //     questionText: "",
// // // // // // // //     optionsText: "",
// // // // // // // //     correctAnswer: "",
// // // // // // // //     answerText: "", // admin-entered model answer for theory
// // // // // // // //   });
// // // // // // // //   const [questionType, setQuestionType] = useState("MCQ");
// // // // // // // //   const [file, setFile] = useState(null);
// // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // // // // // //   const [editingId, setEditingId] = useState(null);

// // // // // // // //   // 🟢 Check admin login
// // // // // // // //   useEffect(() => {
// // // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // // //     if (!token) navigate("/admin/login");
// // // // // // // //   }, [navigate]);

// // // // // // // //   // 🟢 Initial fetch
// // // // // // // //   useEffect(() => {
// // // // // // // //     fetchQuestions();
// // // // // // // //     fetchResults();
// // // // // // // //   }, []);

// // // // // // // //   const fetchQuestions = async () => {
// // // // // // // //     try {
// // // // // // // //       const res = await API.questions.getAll();
// // // // // // // //       setQuestions(res.data || []);
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert("❌ Failed to load questions.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const fetchResults = async () => {
// // // // // // // //     setLoadingResults(true);
// // // // // // // //     try {
// // // // // // // //       const res = await API.tests.getAll();
// // // // // // // //       setResults(res.data || []);
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert("❌ Failed to load test results.");
// // // // // // // //     } finally {
// // // // // // // //       setLoadingResults(false);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 🟢 Add or Update Question
// // // // // // // //   const handleAddOrUpdate = async (e) => {
// // // // // // // //     e.preventDefault();
// // // // // // // //     const opts =
// // // // // // // //       questionType === "MCQ"
// // // // // // // //         ? form.optionsText.split("|").map((s) => s.trim()).filter(Boolean)
// // // // // // // //         : [];

// // // // // // // //     if (!form.questionText.trim()) {
// // // // // // // //       return alert("Please enter question text.");
// // // // // // // //     }

// // // // // // // //     setLoading(true);
// // // // // // // //     try {
// // // // // // // //       const payload = {
// // // // // // // //         questionType,
// // // // // // // //         questionText: form.questionText,
// // // // // // // //         options: opts,
// // // // // // // //         correctAnswer: questionType === "MCQ" ? form.correctAnswer : form.answerText,
// // // // // // // //       };
// // // // // // // //       console.log("Submitting payload ->", payload);

// // // // // // // //       if (editingId) {
// // // // // // // //         await API.questions.update(editingId, payload);
// // // // // // // //         alert("✅ Question updated successfully!");
// // // // // // // //       } else {
// // // // // // // //         await API.questions.create(payload);
// // // // // // // //         alert("✅ Question added successfully!");
// // // // // // // //       }

// // // // // // // //       setForm({ questionText: "", optionsText: "", correctAnswer: "", answerText: "" });
// // // // // // // //       setEditingId(null);
// // // // // // // //       await fetchQuestions();
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // // // // // //     } finally {
// // // // // // // //       setLoading(false);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 🟢 Delete Question
// // // // // // // //   const handleDelete = async (id) => {
// // // // // // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;
// // // // // // // //     try {
// // // // // // // //       await API.questions.delete(id);
// // // // // // // //       alert("🗑️ Question deleted successfully!");
// // // // // // // //       await fetchQuestions();
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert("❌ Failed to delete question.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 🟢 Edit Question
// // // // // // // //   const handleEdit = (q) => {
// // // // // // // //     setEditingId(q._id);
// // // // // // // //     setQuestionType(q.questionType);
// // // // // // // //     setForm({
// // // // // // // //       questionText: q.questionText,
// // // // // // // //       optionsText: q.options ? q.options.join(" | ") : "",
// // // // // // // //       correctAnswer: q.correctAnswer || "",
// // // // // // // //       answerText: q.questionType === "Theory" ? q.correctAnswer || "" : "",
// // // // // // // //     });
// // // // // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // // // // //   };

// // // // // // // //   // 🟢 Upload File
// // // // // // // //   const handleUpload = async () => {
// // // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // // //     const fd = new FormData();
// // // // // // // //     fd.append("file", file);

// // // // // // // //     try {
// // // // // // // //       const res = await API.questions.uploadDoc(fd);
// // // // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // // // //       await fetchQuestions();
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const handleLogout = () => {
// // // // // // // //     localStorage.removeItem("adminToken");
// // // // // // // //     navigate("/admin/login");
// // // // // // // //   };

// // // // // // // //   // 🟢 Navigate to validation page
// // // // // // // //   const handleViewValidation = (id) => {
// // // // // // // //     navigate(`/admin/result/${id}`);
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <div className="admin-dashboard">
// // // // // // // //       {/* Header */}
// // // // // // // //       {/* <div className="admin-header">
// // // // // // // //         <h2>Admin Dashboard</h2>
// // // // // // // //         <button className="logout-btn" onClick={handleLogout}>
// // // // // // // //           Logout
// // // // // // // //         </button>
// // // // // // // //       </div> */}

// // // // // // // //       {/* Tabs */}
// // // // // // // //       <div className="tab-buttons">
// // // // // // // //         <button
// // // // // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // // // // //           onClick={() => setActiveTab("questions")}
// // // // // // // //         >
// // // // // // // //           🧩 Questions
// // // // // // // //         </button>
// // // // // // // //         <button
// // // // // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // // // // //           onClick={() => setActiveTab("results")}
// // // // // // // //         >
// // // // // // // //           📊 Test Results
// // // // // // // //         </button>
// // // // // // // //       </div>

// // // // // // // //       {/* 🧩 QUESTIONS TAB */}
// // // // // // // //       {activeTab === "questions" ? (
// // // // // // // //         <div className="tab-content">
// // // // // // // //           <div className="card form-section">
// // // // // // // //             <h5>{editingId ? "✏️ Edit Question" : "➕ Add or Upload Questions"}</h5>

// // // // // // // //             <form onSubmit={handleAddOrUpdate}>
// // // // // // // //               <div className="mb-3">
// // // // // // // //                 <label className="form-label">Question Type</label>
// // // // // // // //                 <select
// // // // // // // //                   className="form-select"
// // // // // // // //                   value={questionType}
// // // // // // // //                   onChange={(e) => setQuestionType(e.target.value)}
// // // // // // // //                 >
// // // // // // // //                   <option value="MCQ">MCQ</option>
// // // // // // // //                   <option value="Theory">Theory</option>
// // // // // // // //                 </select>
// // // // // // // //               </div>

// // // // // // // //               <div className="mb-3">
// // // // // // // //                 <label className="form-label">Question Text</label>
// // // // // // // //                 <textarea
// // // // // // // //                   className="form-control"
// // // // // // // //                   rows={questionType === "Theory" ? 3 : 2}
// // // // // // // //                   value={form.questionText}
// // // // // // // //                   onChange={(e) =>
// // // // // // // //                     setForm({ ...form, questionText: e.target.value })
// // // // // // // //                   }
// // // // // // // //                   placeholder="Enter your question here..."
// // // // // // // //                 />
// // // // // // // //               </div>

// // // // // // // //               {questionType === "Theory" && (
// // // // // // // //                 <div className="mb-3">
// // // // // // // //                   <label className="form-label">Answer / Model Answer</label>
// // // // // // // //                   <textarea
// // // // // // // //                     className="form-control"
// // // // // // // //                     rows={4}
// // // // // // // //                     value={form.answerText}
// // // // // // // //                     onChange={(e) =>
// // // // // // // //                       setForm({ ...form, answerText: e.target.value })
// // // // // // // //                     }
// // // // // // // //                     placeholder="Enter the model answer for theory questions (this will be stored as the correct answer)"
// // // // // // // //                   />
// // // // // // // //                 </div>
// // // // // // // //               )}

// // // // // // // //               {questionType === "MCQ" && (
// // // // // // // //                 <>
// // // // // // // //                   <div className="mb-3">
// // // // // // // //                     <label className="form-label">Options (separate by |)</label>
// // // // // // // //                     <input
// // // // // // // //                       className="form-control"
// // // // // // // //                       value={form.optionsText}
// // // // // // // //                       onChange={(e) =>
// // // // // // // //                         setForm({ ...form, optionsText: e.target.value })
// // // // // // // //                       }
// // // // // // // //                       placeholder="Option A | Option B | Option C | Option D"
// // // // // // // //                     />
// // // // // // // //                   </div>

// // // // // // // //                   <div className="mb-3">
// // // // // // // //                     <label className="form-label">Correct Answer</label>
// // // // // // // //                     <input
// // // // // // // //                       className="form-control"
// // // // // // // //                       value={form.correctAnswer}
// // // // // // // //                       onChange={(e) =>
// // // // // // // //                         setForm({ ...form, correctAnswer: e.target.value })
// // // // // // // //                       }
// // // // // // // //                       placeholder="Enter correct answer text"
// // // // // // // //                     />
// // // // // // // //                   </div>
// // // // // // // //                 </>
// // // // // // // //               )}

// // // // // // // //               <div className="d-flex gap-2">
// // // // // // // //                 <button className="btn btn-success" type="submit" disabled={loading}>
// // // // // // // //                   {loading
// // // // // // // //                     ? "Saving..."
// // // // // // // //                     : editingId
// // // // // // // //                     ? "Update Question"
// // // // // // // //                     : "Add Question"}
// // // // // // // //                 </button>
// // // // // // // //                 <button
// // // // // // // //                   type="button"
// // // // // // // //                   className="btn btn-secondary"
// // // // // // // //                   onClick={() => {
// // // // // // // //                     setForm({
// // // // // // // //                       questionText: "",
// // // // // // // //                       optionsText: "",
// // // // // // // //                       correctAnswer: "",
// // // // // // // //                       answerText: "",
// // // // // // // //                     });
// // // // // // // //                     setEditingId(null);
// // // // // // // //                   }}
// // // // // // // //                 >
// // // // // // // //                   Clear
// // // // // // // //                 </button>
// // // // // // // //               </div>
// // // // // // // //             </form>

// // // // // // // //             <hr className="my-4" />

// // // // // // // //             {/* Upload Section */}
// // // // // // // //             <div className="upload-section">
// // // // // // // //               <label className="form-label">Upload Document (.docx)</label>
// // // // // // // //               <input
// // // // // // // //                 type="file"
// // // // // // // //                 className="form-control"
// // // // // // // //                 accept=".docx"
// // // // // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // // // // //               />
// // // // // // // //               <div className="mt-2">
// // // // // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // // //                   Upload
// // // // // // // //                 </button>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           </div>

// // // // // // // //           {/* Display Questions */}
// // // // // // // //           <div className="card available-questions">
// // // // // // // //             <h5>Available Questions</h5>

// // // // // // // //             <h6 className="mt-3 text-primary">MCQ Questions</h6>
// // // // // // // //             {questions.filter((q) => q.questionType === "MCQ").length === 0 && (
// // // // // // // //               <div className="text-muted">No MCQs yet</div>
// // // // // // // //             )}
// // // // // // // //             {questions
// // // // // // // //               .filter((q) => q.questionType === "MCQ")
// // // // // // // //               .map((q, idx) => (
// // // // // // // //                 <div key={q._id} className="question-item">
// // // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // //                   <div className="small text-muted">
// // // // // // // //                     Options: {q.options.join(" | ")}
// // // // // // // //                   </div>
// // // // // // // //                   <div className="small text-success">
// // // // // // // //                     Correct: {q.correctAnswer}
// // // // // // // //                   </div>
// // // // // // // //                   <div className="action-buttons">
// // // // // // // //                     <button
// // // // // // // //                       className="btn btn-sm btn-warning"
// // // // // // // //                       onClick={() => handleEdit(q)}
// // // // // // // //                     >
// // // // // // // //                       Edit
// // // // // // // //                     </button>
// // // // // // // //                     <button
// // // // // // // //                       className="btn btn-sm btn-danger"
// // // // // // // //                       onClick={() => handleDelete(q._id)}
// // // // // // // //                     >
// // // // // // // //                       Delete
// // // // // // // //                     </button>
// // // // // // // //                   </div>
// // // // // // // //                 </div>
// // // // // // // //               ))}

// // // // // // // //             <h6 className="mt-4 text-primary">Theory Questions</h6>
// // // // // // // //             {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // // //               <div className="text-muted">No theory questions yet</div>
// // // // // // // //             )}
// // // // // // // //             {questions
// // // // // // // //               .filter((q) => q.questionType === "Theory")
// // // // // // // //               .map((q, idx) => (
// // // // // // // //                 <div key={q._id} className="question-item">
// // // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // //                   {q.correctAnswer && (
// // // // // // // //                     <div className="small text-success">
// // // // // // // //                       <b>Model Answer:</b> {q.correctAnswer}
// // // // // // // //                     </div>
// // // // // // // //                   )}
// // // // // // // //                   <div className="action-buttons">
// // // // // // // //                     <button
// // // // // // // //                       className="btn btn-sm btn-warning"
// // // // // // // //                       onClick={() => handleEdit(q)}
// // // // // // // //                     >
// // // // // // // //                       Edit
// // // // // // // //                     </button>
// // // // // // // //                     <button
// // // // // // // //                       className="btn btn-sm btn-danger"
// // // // // // // //                       onClick={() => handleDelete(q._id)}
// // // // // // // //                     >
// // // // // // // //                       Delete
// // // // // // // //                     </button>
// // // // // // // //                   </div>
// // // // // // // //                 </div>
// // // // // // // //               ))}
// // // // // // // //           </div>
// // // // // // // //         </div>
// // // // // // // //       ) : (
// // // // // // // //         // 📊 TEST RESULTS TAB
// // // // // // // //         <div className="tab-content">
// // // // // // // //           <div className="card results-section">
// // // // // // // //             <h5>Candidate Test Results</h5>
// // // // // // // //             {loadingResults ? (
// // // // // // // //               <div>Loading test results...</div>
// // // // // // // //             ) : results.length === 0 ? (
// // // // // // // //               <div className="text-muted">No test results yet</div>
// // // // // // // //             ) : (
// // // // // // // //               <table className="results-table">
// // // // // // // //                 <thead>
// // // // // // // //                   <tr>
// // // // // // // //                     <th>Name</th>
// // // // // // // //                     <th>Email</th>
// // // // // // // //                     <th>Total</th>
// // // // // // // //                     <th>Correct</th>
// // // // // // // //                     <th>Score %</th>
// // // // // // // //                     <th>Status</th>
// // // // // // // //                     <th>Submitted At</th>
// // // // // // // //                     <th>Action</th>
// // // // // // // //                   </tr>
// // // // // // // //                 </thead>
// // // // // // // //                 <tbody>
// // // // // // // //                   {results.map((res, idx) => (
// // // // // // // //                     <tr key={idx}>
// // // // // // // //                       <td>{res.name}</td>
// // // // // // // //                       <td>{res.email}</td>
// // // // // // // //                       <td>{res.totalQuestions}</td>
// // // // // // // //                       <td>{res.correctAnswers}</td>
// // // // // // // //                       <td>{res.scorePercent}%</td>
// // // // // // // //                       <td>
// // // // // // // //                         <span
// // // // // // // //                           style={{
// // // // // // // //                             color:
// // // // // // // //                               res.status === "Validated" ? "green" : "orange",
// // // // // // // //                             fontWeight: 600,
// // // // // // // //                           }}
// // // // // // // //                         >
// // // // // // // //                           {res.status || "Validation Pending"}
// // // // // // // //                         </span>
// // // // // // // //                       </td>
// // // // // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // // // //                       <td>
// // // // // // // //                         <button
// // // // // // // //                           className="btn btn-sm btn-primary"
// // // // // // // //                           onClick={() => handleViewValidation(res._id)}
// // // // // // // //                         >
// // // // // // // //                           View / Validate
// // // // // // // //                         </button>
// // // // // // // //                       </td>
// // // // // // // //                     </tr>
// // // // // // // //                   ))}
// // // // // // // //                 </tbody>
// // // // // // // //               </table>
// // // // // // // //             )}
// // // // // // // //           </div>
// // // // // // // //         </div>
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // }

// // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // import API from "../services/api";
// // // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // // export default function AdminDashboard() {
// // // // // // // //   const navigate = useNavigate();
// // // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // // //   const [results, setResults] = useState([]);
// // // // // // // //   const [activeTab, setActiveTab] = useState("questions");
// // // // // // // //   const [form, setForm] = useState({
// // // // // // // //     questionText: "",
// // // // // // // //     optionsText: "",
// // // // // // // //     correctAnswer: "",
// // // // // // // //     answerText: "", // <-- ADDED: admin-entered answer for Theory
// // // // // // // //   });
// // // // // // // //   const [questionType, setQuestionType] = useState("MCQ");
// // // // // // // //   const [file, setFile] = useState(null);
// // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // // // // // //   const [editingId, setEditingId] = useState(null);

// // // // // // // //   // 🟢 Check admin login
// // // // // // // //   useEffect(() => {
// // // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // // //     if (!token) navigate("/admin/login");
// // // // // // // //   }, [navigate]);

// // // // // // // //   // 🟢 Initial fetch
// // // // // // // //   useEffect(() => {
// // // // // // // //     fetchQuestions();
// // // // // // // //     fetchResults();
// // // // // // // //   }, []);

// // // // // // // //   const fetchQuestions = async () => {
// // // // // // // //     try {
// // // // // // // //       const res = await API.get("/questions");
// // // // // // // //       setQuestions(res.data || []);
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert("❌ Failed to load questions.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const fetchResults = async () => {
// // // // // // // //     setLoadingResults(true);
// // // // // // // //     try {
// // // // // // // //       const res = await API.get("/tests");
// // // // // // // //       setResults(res.data || []);
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert("❌ Failed to load test results.");
// // // // // // // //     } finally {
// // // // // // // //       setLoadingResults(false);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 🟢 Add or Update Question
// // // // // // // //   const handleAddOrUpdate = async (e) => {
// // // // // // // //     e.preventDefault();
// // // // // // // //     const opts =
// // // // // // // //       questionType === "MCQ"
// // // // // // // //         ? form.optionsText.split("|").map((s) => s.trim()).filter(Boolean)
// // // // // // // //         : [];

// // // // // // // //     if (!form.questionText.trim()) {
// // // // // // // //       return alert("Please enter question text.");
// // // // // // // //     }

// // // // // // // //     setLoading(true);
// // // // // // // //     try {
// // // // // // // //       const payload = {
// // // // // // // //         questionType,
// // // // // // // //         questionText: form.questionText,
// // // // // // // //         options: opts,
// // // // // // // //         // for MCQ use form.correctAnswer, for Theory use form.answerText as the 'correctAnswer' stored on backend
// // // // // // // //         correctAnswer: questionType === "MCQ" ? form.correctAnswer : form.answerText,
// // // // // // // //       };
// // // // // // // //        console.log("Submitting payload ->", payload); // inspect this in Network/Console

// // // // // // // //       if (editingId) {
// // // // // // // //         await API.put(`/questions/${editingId}`, payload);
// // // // // // // //         alert("✅ Question updated successfully!");
// // // // // // // //       } else {
// // // // // // // //         await API.post("/questions", payload);
// // // // // // // //         alert("✅ Question added successfully!");
// // // // // // // //       }

// // // // // // // //       setForm({ questionText: "", optionsText: "", correctAnswer: "", answerText: "" });
// // // // // // // //       setEditingId(null);
// // // // // // // //       await fetchQuestions();
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // // // // // //     } finally {
// // // // // // // //       setLoading(false);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 🟢 Delete Question
// // // // // // // //   const handleDelete = async (id) => {
// // // // // // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;

// // // // // // // //     try {
// // // // // // // //       await API.delete(`/questions/${id}`);
// // // // // // // //       alert("🗑️ Question deleted successfully!");
// // // // // // // //       await fetchQuestions();
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert("❌ Failed to delete question.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 🟢 Edit Question
// // // // // // // //   const handleEdit = (q) => {
// // // // // // // //     setEditingId(q._id);
// // // // // // // //     setQuestionType(q.questionType);
// // // // // // // //     setForm({
// // // // // // // //       questionText: q.questionText,
// // // // // // // //       optionsText: q.options ? q.options.join(" | ") : "",
// // // // // // // //       correctAnswer: q.correctAnswer || "", // used for MCQ
// // // // // // // //       answerText: q.questionType === "Theory" ? (q.correctAnswer || "") : "", // <-- ADDED: populate answerText from stored correctAnswer for theory
// // // // // // // //     });
// // // // // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // // // // //   };

// // // // // // // //   // 🟢 Upload File
// // // // // // // //   const handleUpload = async () => {
// // // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // // //     const fd = new FormData();
// // // // // // // //     fd.append("file", file);

// // // // // // // //     try {
// // // // // // // //       const res = await API.post("/questions/upload", fd, {
// // // // // // // //         headers: { "Content-Type": "multipart/form-data" },
// // // // // // // //       });
// // // // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // // // //       await fetchQuestions();
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error(err);
// // // // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const handleLogout = () => {
// // // // // // // //     localStorage.removeItem("adminToken");
// // // // // // // //     navigate("/admin/login");
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <div className="admin-dashboard">
// // // // // // // //       {/* Header */}
// // // // // // // //       <div className="admin-header">
// // // // // // // //         <h2>Admin Dashboard</h2>
// // // // // // // //         <button className="logout-btn" onClick={handleLogout}>
// // // // // // // //           Logout
// // // // // // // //         </button>
// // // // // // // //       </div>

// // // // // // // //       {/* Tabs */}
// // // // // // // //       <div className="tab-buttons">
// // // // // // // //         <button
// // // // // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // // // // //           onClick={() => setActiveTab("questions")}
// // // // // // // //         >
// // // // // // // //           🧩 Questions
// // // // // // // //         </button>
// // // // // // // //         <button
// // // // // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // // // // //           onClick={() => setActiveTab("results")}
// // // // // // // //         >
// // // // // // // //           📊 Test Results
// // // // // // // //         </button>
// // // // // // // //       </div>

// // // // // // // //       {/* 🧩 QUESTIONS TAB */}
// // // // // // // //       {activeTab === "questions" ? (
// // // // // // // //         <div className="tab-content">
// // // // // // // //           <div className="card form-section">
// // // // // // // //             <h5>{editingId ? "✏️ Edit Question" : "➕ Add or Upload Questions"}</h5>

// // // // // // // //             <form onSubmit={handleAddOrUpdate}>
// // // // // // // //               <div className="mb-3">
// // // // // // // //                 <label className="form-label">Question Type</label>
// // // // // // // //                 <select
// // // // // // // //                   className="form-select"
// // // // // // // //                   value={questionType}
// // // // // // // //                   onChange={(e) => setQuestionType(e.target.value)}
// // // // // // // //                 >
// // // // // // // //                   <option value="MCQ">MCQ</option>
// // // // // // // //                   <option value="Theory">Theory</option>
// // // // // // // //                 </select>
// // // // // // // //               </div>

// // // // // // // //               <div className="mb-3">
// // // // // // // //                 <label className="form-label">Question Text</label>
// // // // // // // //                 <textarea
// // // // // // // //                   className="form-control"
// // // // // // // //                   rows={questionType === "Theory" ? 3 : 2}
// // // // // // // //                   value={form.questionText}
// // // // // // // //                   onChange={(e) =>
// // // // // // // //                     setForm({ ...form, questionText: e.target.value })
// // // // // // // //                   }
// // // // // // // //                   placeholder="Enter your question here..."
// // // // // // // //                 />
// // // // // // // //               </div>

// // // // // // // //               {/* Theory: show admin answer input */}
// // // // // // // //               {questionType === "Theory" && (
// // // // // // // //                 <div className="mb-3">
// // // // // // // //                   <label className="form-label">Answer / Model Answer</label>
// // // // // // // //                   <textarea
// // // // // // // //                     className="form-control"
// // // // // // // //                     rows={4}
// // // // // // // //                     value={form.answerText}
// // // // // // // //                     onChange={(e) => setForm({ ...form, answerText: e.target.value })}
// // // // // // // //                     placeholder="Enter the model answer for theory questions (this will be stored as the correct answer)"
// // // // // // // //                   />
// // // // // // // //                 </div>
// // // // // // // //               )}

// // // // // // // //               {questionType === "MCQ" && (
// // // // // // // //                 <>
// // // // // // // //                   <div className="mb-3">
// // // // // // // //                     <label className="form-label">Options (separate by |)</label>
// // // // // // // //                     <input
// // // // // // // //                       className="form-control"
// // // // // // // //                       value={form.optionsText}
// // // // // // // //                       onChange={(e) =>
// // // // // // // //                         setForm({ ...form, optionsText: e.target.value })
// // // // // // // //                       }
// // // // // // // //                       placeholder="Option A | Option B | Option C | Option D"
// // // // // // // //                     />
// // // // // // // //                   </div>

// // // // // // // //                   <div className="mb-3">
// // // // // // // //                     <label className="form-label">Correct Answer</label>
// // // // // // // //                     <input
// // // // // // // //                       className="form-control"
// // // // // // // //                       value={form.correctAnswer}
// // // // // // // //                       onChange={(e) =>
// // // // // // // //                         setForm({ ...form, correctAnswer: e.target.value })
// // // // // // // //                       }
// // // // // // // //                       placeholder="Enter correct answer text"
// // // // // // // //                     />
// // // // // // // //                   </div>
// // // // // // // //                 </>
// // // // // // // //               )}

// // // // // // // //               <div className="d-flex gap-2">
// // // // // // // //                 <button className="btn btn-success" type="submit" disabled={loading}>
// // // // // // // //                   {loading
// // // // // // // //                     ? "Saving..."
// // // // // // // //                     : editingId
// // // // // // // //                     ? "Update Question"
// // // // // // // //                     : "Add Question"}
// // // // // // // //                 </button>
// // // // // // // //                 <button
// // // // // // // //                   type="button"
// // // // // // // //                   className="btn btn-secondary"
// // // // // // // //                   onClick={() => {
// // // // // // // //                     setForm({
// // // // // // // //                       questionText: "",
// // // // // // // //                       optionsText: "",
// // // // // // // //                       correctAnswer: "",
// // // // // // // //                       answerText: "", // <-- clear it
// // // // // // // //                     });
// // // // // // // //                     setEditingId(null);
// // // // // // // //                   }}
// // // // // // // //                 >
// // // // // // // //                   Clear
// // // // // // // //                 </button>
// // // // // // // //               </div>
// // // // // // // //             </form>

// // // // // // // //             <hr className="my-4" />

// // // // // // // //             {/* Upload Section */}
// // // // // // // //             <div className="upload-section">
// // // // // // // //               <label className="form-label">Upload Document (.docx)</label>
// // // // // // // //               <input
// // // // // // // //                 type="file"
// // // // // // // //                 className="form-control"
// // // // // // // //                 accept=".docx"
// // // // // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // // // // //               />
// // // // // // // //               <div className="mt-2">
// // // // // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // // //                   Upload
// // // // // // // //                 </button>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           </div>

// // // // // // // //           {/* Display Questions */}
// // // // // // // //           <div className="card available-questions">
// // // // // // // //             <h5>Available Questions</h5>

// // // // // // // //             {/* MCQ Section */}
// // // // // // // //             <h6 className="mt-3 text-primary">MCQ Questions</h6>
// // // // // // // //             {questions.filter((q) => q.questionType === "MCQ").length === 0 && (
// // // // // // // //               <div className="text-muted">No MCQs yet</div>
// // // // // // // //             )}
// // // // // // // //             {questions
// // // // // // // //               .filter((q) => q.questionType === "MCQ")
// // // // // // // //               .map((q, idx) => (
// // // // // // // //                 <div key={q._id} className="question-item">
// // // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // //                   <div className="small text-muted">
// // // // // // // //                     Options: {q.options.join(" | ")}
// // // // // // // //                   </div>
// // // // // // // //                   <div className="small text-success">
// // // // // // // //                     Correct: {q.correctAnswer}
// // // // // // // //                   </div>
// // // // // // // //                   <div className="action-buttons">
// // // // // // // //                     <button
// // // // // // // //                       className="btn btn-sm btn-warning"
// // // // // // // //                       onClick={() => handleEdit(q)}
// // // // // // // //                     >
// // // // // // // //                       Edit
// // // // // // // //                     </button>
// // // // // // // //                     <button
// // // // // // // //                       className="btn btn-sm btn-danger"
// // // // // // // //                       onClick={() => handleDelete(q._id)}
// // // // // // // //                     >
// // // // // // // //                       Delete
// // // // // // // //                     </button>
// // // // // // // //                   </div>
// // // // // // // //                 </div>
// // // // // // // //               ))}

// // // // // // // //             {/* Theory Section */}
// // // // // // // //             <h6 className="mt-4 text-primary">Theory Questions</h6>
// // // // // // // //             {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // // //               <div className="text-muted">No theory questions yet</div>
// // // // // // // //             )}
// // // // // // // //             {questions
// // // // // // // //               .filter((q) => q.questionType === "Theory")
// // // // // // // //               .map((q, idx) => {
// // // // // // // //                 const relatedAnswers = results
// // // // // // // //                   .flatMap((r) => r.answers || [])
// // // // // // // //                   .filter(
// // // // // // // //                     (a) =>
// // // // // // // //                       a.question.trim().toLowerCase() ===
// // // // // // // //                       q.questionText.trim().toLowerCase()
// // // // // // // //                   );
// // // // // // // //                 return (
// // // // // // // //                   <div key={q._id} className="question-item">
// // // // // // // //                     <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // //                     {/* show admin-provided model answer if exists */}
// // // // // // // //                     {q.correctAnswer ? (
// // // // // // // //                       <div className="small text-success">
// // // // // // // //                         <b>Model Answer:</b> {q.correctAnswer}
// // // // // // // //                       </div>
// // // // // // // //                     ) : null}

// // // // // // // //                     {relatedAnswers.length > 0 ? (
// // // // // // // //                       <div className="theory-answers">
// // // // // // // //                         <b>Answers:</b>
// // // // // // // //                         <ul>
// // // // // // // //                           {relatedAnswers.map((a, i) => (
// // // // // // // //                             <li key={i}>{a.userAnswer}</li>
// // // // // // // //                           ))}
// // // // // // // //                         </ul>
// // // // // // // //                       </div>
// // // // // // // //                     ) : (
// // // // // // // //                       <div className="text-muted small">No answers yet</div>
// // // // // // // //                     )}
// // // // // // // //                     <div className="action-buttons">
// // // // // // // //                       <button
// // // // // // // //                         className="btn btn-sm btn-warning"
// // // // // // // //                         onClick={() => handleEdit(q)}
// // // // // // // //                       >
// // // // // // // //                         Edit
// // // // // // // //                       </button>
// // // // // // // //                       <button
// // // // // // // //                         className="btn btn-sm btn-danger"
// // // // // // // //                         onClick={() => handleDelete(q._id)}
// // // // // // // //                       >
// // // // // // // //                         Delete
// // // // // // // //                       </button>
// // // // // // // //                     </div>
// // // // // // // //                   </div>
// // // // // // // //                 );
// // // // // // // //               })}
// // // // // // // //           </div>
// // // // // // // //         </div>
// // // // // // // //       ) : (
// // // // // // // //         // 📊 TEST RESULTS TAB
// // // // // // // //         <div className="tab-content">
// // // // // // // //           <div className="card results-section">
// // // // // // // //             <h5>Candidate Test Results</h5>
// // // // // // // //             {loadingResults ? (
// // // // // // // //               <div>Loading test results...</div>
// // // // // // // //             ) : results.length === 0 ? (
// // // // // // // //               <div className="text-muted">No test results yet</div>
// // // // // // // //             ) : (
// // // // // // // //               <table className="results-table">
// // // // // // // //                 <thead>
// // // // // // // //                   <tr>
// // // // // // // //                     <th>Name</th>
// // // // // // // //                     <th>Email</th>
// // // // // // // //                     <th>Total</th>
// // // // // // // //                     <th>Correct</th>
// // // // // // // //                     <th>Score %</th>
// // // // // // // //                     <th>Submitted At</th>
// // // // // // // //                   </tr>
// // // // // // // //                 </thead>
// // // // // // // //                 <tbody>
// // // // // // // //                   {results.map((res, idx) => (
// // // // // // // //                     <tr key={idx}>
// // // // // // // //                       <td>{res.name}</td>
// // // // // // // //                       <td>{res.email}</td>
// // // // // // // //                       <td>{res.totalQuestions}</td>
// // // // // // // //                       <td>{res.correctAnswers}</td>
// // // // // // // //                       <td>{res.scorePercent}%</td>
// // // // // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // // // //                     </tr>
// // // // // // // //                   ))}
// // // // // // // //                 </tbody>
// // // // // // // //               </table>
// // // // // // // //             )}
// // // // // // // //           </div>
// // // // // // // //         </div>
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // }


// // // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // // import API from "../services/api";
// // // // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // // // export default function AdminDashboard() {
// // // // // // // // //   const navigate = useNavigate();
// // // // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // // // //   const [results, setResults] = useState([]);
// // // // // // // // //   const [activeTab, setActiveTab] = useState("questions");
// // // // // // // // //   const [form, setForm] = useState({
// // // // // // // // //     questionText: "",
// // // // // // // // //     optionsText: "",
// // // // // // // // //     correctAnswer: "",
// // // // // // // // //   });
// // // // // // // // //   const [questionType, setQuestionType] = useState("MCQ");
// // // // // // // // //   const [file, setFile] = useState(null);
// // // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // // //   const [loadingResults, setLoadingResults] = useState(false);
// // // // // // // // //   const [editingId, setEditingId] = useState(null);

// // // // // // // // //   // 🟢 Check admin login
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // // // //     if (!token) navigate("/admin/login");
// // // // // // // // //   }, [navigate]);

// // // // // // // // //   // 🟢 Initial fetch
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     fetchQuestions();
// // // // // // // // //     fetchResults();
// // // // // // // // //   }, []);

// // // // // // // // //   const fetchQuestions = async () => {
// // // // // // // // //     try {
// // // // // // // // //       const res = await API.get("/questions");
// // // // // // // // //       setQuestions(res.data || []);
// // // // // // // // //     } catch (err) {
// // // // // // // // //       console.error(err);
// // // // // // // // //       alert("❌ Failed to load questions.");
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const fetchResults = async () => {
// // // // // // // // //     setLoadingResults(true);
// // // // // // // // //     try {
// // // // // // // // //       const res = await API.get("/tests");
// // // // // // // // //       setResults(res.data || []);
// // // // // // // // //     } catch (err) {
// // // // // // // // //       console.error(err);
// // // // // // // // //       alert("❌ Failed to load test results.");
// // // // // // // // //     } finally {
// // // // // // // // //       setLoadingResults(false);
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   // 🟢 Add or Update Question
// // // // // // // // //   const handleAddOrUpdate = async (e) => {
// // // // // // // // //     e.preventDefault();
// // // // // // // // //     const opts =
// // // // // // // // //       questionType === "MCQ"
// // // // // // // // //         ? form.optionsText.split("|").map((s) => s.trim()).filter(Boolean)
// // // // // // // // //         : [];

// // // // // // // // //     if (!form.questionText.trim()) {
// // // // // // // // //       return alert("Please enter question text.");
// // // // // // // // //     }

// // // // // // // // //     setLoading(true);
// // // // // // // // //     try {
// // // // // // // // //       if (editingId) {
// // // // // // // // //         await API.put(`/questions/${editingId}`, {
// // // // // // // // //           questionType,
// // // // // // // // //           questionText: form.questionText,
// // // // // // // // //           options: opts,
// // // // // // // // //           correctAnswer: questionType === "MCQ" ? form.correctAnswer : "",
// // // // // // // // //         });
// // // // // // // // //         alert("✅ Question updated successfully!");
// // // // // // // // //       } else {
// // // // // // // // //         await API.post("/questions", {
// // // // // // // // //           questionType,
// // // // // // // // //           questionText: form.questionText,
// // // // // // // // //           options: opts,
// // // // // // // // //           correctAnswer: questionType === "MCQ" ? form.correctAnswer : "",
// // // // // // // // //         });
// // // // // // // // //         alert("✅ Question added successfully!");
// // // // // // // // //       }

// // // // // // // // //       setForm({ questionText: "", optionsText: "", correctAnswer: "" });
// // // // // // // // //       setEditingId(null);
// // // // // // // // //       await fetchQuestions();
// // // // // // // // //     } catch (err) {
// // // // // // // // //       console.error(err);
// // // // // // // // //       alert(err.response?.data?.error || "❌ Operation failed.");
// // // // // // // // //     } finally {
// // // // // // // // //       setLoading(false);
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   // 🟢 Delete Question
// // // // // // // // //   const handleDelete = async (id) => {
// // // // // // // // //     if (!window.confirm("Are you sure you want to delete this question?")) return;

// // // // // // // // //     try {
// // // // // // // // //       await API.delete(`/questions/${id}`);
// // // // // // // // //       alert("🗑️ Question deleted successfully!");
// // // // // // // // //       await fetchQuestions();
// // // // // // // // //     } catch (err) {
// // // // // // // // //       console.error(err);
// // // // // // // // //       alert("❌ Failed to delete question.");
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   // 🟢 Edit Question
// // // // // // // // //   const handleEdit = (q) => {
// // // // // // // // //     setEditingId(q._id);
// // // // // // // // //     setQuestionType(q.questionType);
// // // // // // // // //     setForm({
// // // // // // // // //       questionText: q.questionText,
// // // // // // // // //       optionsText: q.options ? q.options.join(" | ") : "",
// // // // // // // // //       correctAnswer: q.correctAnswer || "",
// // // // // // // // //     });
// // // // // // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // // // // // //   };

// // // // // // // // //   // 🟢 Upload File
// // // // // // // // //   const handleUpload = async () => {
// // // // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // // // //     const fd = new FormData();
// // // // // // // // //     fd.append("file", file);

// // // // // // // // //     try {
// // // // // // // // //       const res = await API.post("/questions/upload", fd, {
// // // // // // // // //         headers: { "Content-Type": "multipart/form-data" },
// // // // // // // // //       });
// // // // // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // // // // //       await fetchQuestions();
// // // // // // // // //     } catch (err) {
// // // // // // // // //       console.error(err);
// // // // // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const handleLogout = () => {
// // // // // // // // //     localStorage.removeItem("adminToken");
// // // // // // // // //     navigate("/admin/login");
// // // // // // // // //   };

// // // // // // // // //   return (
// // // // // // // // //     <div className="admin-dashboard">
// // // // // // // // //       {/* Header */}
// // // // // // // // //       <div className="admin-header">
// // // // // // // // //         <h2>Admin Dashboard</h2>
// // // // // // // // //         <button className="logout-btn" onClick={handleLogout}>
// // // // // // // // //           Logout
// // // // // // // // //         </button>
// // // // // // // // //       </div>

// // // // // // // // //       {/* Tabs */}
// // // // // // // // //       <div className="tab-buttons">
// // // // // // // // //         <button
// // // // // // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // // // // // //           onClick={() => setActiveTab("questions")}
// // // // // // // // //         >
// // // // // // // // //           🧩 Questions
// // // // // // // // //         </button>
// // // // // // // // //         <button
// // // // // // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // // // // // //           onClick={() => setActiveTab("results")}
// // // // // // // // //         >
// // // // // // // // //           📊 Test Results
// // // // // // // // //         </button>
// // // // // // // // //       </div>

// // // // // // // // //       {/* 🧩 QUESTIONS TAB */}
// // // // // // // // //       {activeTab === "questions" ? (
// // // // // // // // //         <div className="tab-content">
// // // // // // // // //           <div className="card form-section">
// // // // // // // // //             <h5>{editingId ? "✏️ Edit Question" : "➕ Add or Upload Questions"}</h5>

// // // // // // // // //             <form onSubmit={handleAddOrUpdate}>
// // // // // // // // //               <div className="mb-3">
// // // // // // // // //                 <label className="form-label">Question Type</label>
// // // // // // // // //                 <select
// // // // // // // // //                   className="form-select"
// // // // // // // // //                   value={questionType}
// // // // // // // // //                   onChange={(e) => setQuestionType(e.target.value)}
// // // // // // // // //                 >
// // // // // // // // //                   <option value="MCQ">MCQ</option>
// // // // // // // // //                   <option value="Theory">Theory</option>
// // // // // // // // //                 </select>
// // // // // // // // //               </div>

// // // // // // // // //               <div className="mb-3">
// // // // // // // // //                 <label className="form-label">Question Text</label>
// // // // // // // // //                 <textarea
// // // // // // // // //                   className="form-control"
// // // // // // // // //                   rows={questionType === "Theory" ? 3 : 2}
// // // // // // // // //                   value={form.questionText}
// // // // // // // // //                   onChange={(e) =>
// // // // // // // // //                     setForm({ ...form, questionText: e.target.value })
// // // // // // // // //                   }
// // // // // // // // //                   placeholder="Enter your question here..."
// // // // // // // // //                 />
// // // // // // // // //               </div>

// // // // // // // // //               {questionType === "MCQ" && (
// // // // // // // // //                 <>
// // // // // // // // //                   <div className="mb-3">
// // // // // // // // //                     <label className="form-label">Options (separate by |)</label>
// // // // // // // // //                     <input
// // // // // // // // //                       className="form-control"
// // // // // // // // //                       value={form.optionsText}
// // // // // // // // //                       onChange={(e) =>
// // // // // // // // //                         setForm({ ...form, optionsText: e.target.value })
// // // // // // // // //                       }
// // // // // // // // //                       placeholder="Option A | Option B | Option C | Option D"
// // // // // // // // //                     />
// // // // // // // // //                   </div>

// // // // // // // // //                   <div className="mb-3">
// // // // // // // // //                     <label className="form-label">Correct Answer</label>
// // // // // // // // //                     <input
// // // // // // // // //                       className="form-control"
// // // // // // // // //                       value={form.correctAnswer}
// // // // // // // // //                       onChange={(e) =>
// // // // // // // // //                         setForm({ ...form, correctAnswer: e.target.value })
// // // // // // // // //                       }
// // // // // // // // //                       placeholder="Enter correct answer text"
// // // // // // // // //                     />
// // // // // // // // //                   </div>
// // // // // // // // //                 </>
// // // // // // // // //               )}

// // // // // // // // //               <div className="d-flex gap-2">
// // // // // // // // //                 <button className="btn btn-success" type="submit" disabled={loading}>
// // // // // // // // //                   {loading
// // // // // // // // //                     ? "Saving..."
// // // // // // // // //                     : editingId
// // // // // // // // //                     ? "Update Question"
// // // // // // // // //                     : "Add Question"}
// // // // // // // // //                 </button>
// // // // // // // // //                 <button
// // // // // // // // //                   type="button"
// // // // // // // // //                   className="btn btn-secondary"
// // // // // // // // //                   onClick={() => {
// // // // // // // // //                     setForm({
// // // // // // // // //                       questionText: "",
// // // // // // // // //                       optionsText: "",
// // // // // // // // //                       correctAnswer: "",
// // // // // // // // //                     });
// // // // // // // // //                     setEditingId(null);
// // // // // // // // //                   }}
// // // // // // // // //                 >
// // // // // // // // //                   Clear
// // // // // // // // //                 </button>
// // // // // // // // //               </div>
// // // // // // // // //             </form>

// // // // // // // // //             <hr className="my-4" />

// // // // // // // // //             {/* Upload Section */}
// // // // // // // // //             <div className="upload-section">
// // // // // // // // //               <label className="form-label">Upload Document (.docx)</label>
// // // // // // // // //               <input
// // // // // // // // //                 type="file"
// // // // // // // // //                 className="form-control"
// // // // // // // // //                 accept=".docx"
// // // // // // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // // // // // //               />
// // // // // // // // //               <div className="mt-2">
// // // // // // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // // // //                   Upload
// // // // // // // // //                 </button>
// // // // // // // // //               </div>
// // // // // // // // //             </div>
// // // // // // // // //           </div>

// // // // // // // // //           {/* Display Questions */}
// // // // // // // // //           <div className="card available-questions">
// // // // // // // // //             <h5>Available Questions</h5>

// // // // // // // // //             {/* MCQ Section */}
// // // // // // // // //             <h6 className="mt-3 text-primary">MCQ Questions</h6>
// // // // // // // // //             {questions.filter((q) => q.questionType === "MCQ").length === 0 && (
// // // // // // // // //               <div className="text-muted">No MCQs yet</div>
// // // // // // // // //             )}
// // // // // // // // //             {questions
// // // // // // // // //               .filter((q) => q.questionType === "MCQ")
// // // // // // // // //               .map((q, idx) => (
// // // // // // // // //                 <div key={q._id} className="question-item">
// // // // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // //                   <div className="small text-muted">
// // // // // // // // //                     Options: {q.options.join(" | ")}
// // // // // // // // //                   </div>
// // // // // // // // //                   <div className="small text-success">
// // // // // // // // //                     Correct: {q.correctAnswer}
// // // // // // // // //                   </div>
// // // // // // // // //                   <div className="action-buttons">
// // // // // // // // //                     <button
// // // // // // // // //                       className="btn btn-sm btn-warning"
// // // // // // // // //                       onClick={() => handleEdit(q)}
// // // // // // // // //                     >
// // // // // // // // //                       Edit
// // // // // // // // //                     </button>
// // // // // // // // //                     <button
// // // // // // // // //                       className="btn btn-sm btn-danger"
// // // // // // // // //                       onClick={() => handleDelete(q._id)}
// // // // // // // // //                     >
// // // // // // // // //                       Delete
// // // // // // // // //                     </button>
// // // // // // // // //                   </div>
// // // // // // // // //                 </div>
// // // // // // // // //               ))}

// // // // // // // // //             {/* Theory Section */}
// // // // // // // // //             <h6 className="mt-4 text-primary">Theory Questions</h6>
// // // // // // // // //             {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // // // //               <div className="text-muted">No theory questions yet</div>
// // // // // // // // //             )}
// // // // // // // // //             {questions
// // // // // // // // //               .filter((q) => q.questionType === "Theory")
// // // // // // // // //               .map((q, idx) => {
// // // // // // // // //                 const relatedAnswers = results
// // // // // // // // //                   .flatMap((r) => r.answers || [])
// // // // // // // // //                   .filter(
// // // // // // // // //                     (a) =>
// // // // // // // // //                       a.question.trim().toLowerCase() ===
// // // // // // // // //                       q.questionText.trim().toLowerCase()
// // // // // // // // //                   );
// // // // // // // // //                 return (
// // // // // // // // //                   <div key={q._id} className="question-item">
// // // // // // // // //                     <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // //                     {relatedAnswers.length > 0 ? (
// // // // // // // // //                       <div className="theory-answers">
// // // // // // // // //                         <b>Answers:</b>
// // // // // // // // //                         <ul>
// // // // // // // // //                           {relatedAnswers.map((a, i) => (
// // // // // // // // //                             <li key={i}>{a.userAnswer}</li>
// // // // // // // // //                           ))}
// // // // // // // // //                         </ul>
// // // // // // // // //                       </div>
// // // // // // // // //                     ) : (
// // // // // // // // //                       <div className="text-muted small">No answers yet</div>
// // // // // // // // //                     )}
// // // // // // // // //                     <div className="action-buttons">
// // // // // // // // //                       <button
// // // // // // // // //                         className="btn btn-sm btn-warning"
// // // // // // // // //                         onClick={() => handleEdit(q)}
// // // // // // // // //                       >
// // // // // // // // //                         Edit
// // // // // // // // //                       </button>
// // // // // // // // //                       <button
// // // // // // // // //                         className="btn btn-sm btn-danger"
// // // // // // // // //                         onClick={() => handleDelete(q._id)}
// // // // // // // // //                       >
// // // // // // // // //                         Delete
// // // // // // // // //                       </button>
// // // // // // // // //                     </div>
// // // // // // // // //                   </div>
// // // // // // // // //                 );
// // // // // // // // //               })}
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       ) : (
// // // // // // // // //         // 📊 TEST RESULTS TAB
// // // // // // // // //         <div className="tab-content">
// // // // // // // // //           <div className="card results-section">
// // // // // // // // //             <h5>Candidate Test Results</h5>
// // // // // // // // //             {loadingResults ? (
// // // // // // // // //               <div>Loading test results...</div>
// // // // // // // // //             ) : results.length === 0 ? (
// // // // // // // // //               <div className="text-muted">No test results yet</div>
// // // // // // // // //             ) : (
// // // // // // // // //               <table className="results-table">
// // // // // // // // //                 <thead>
// // // // // // // // //                   <tr>
// // // // // // // // //                     <th>Name</th>
// // // // // // // // //                     <th>Email</th>
// // // // // // // // //                     <th>Total</th>
// // // // // // // // //                     <th>Correct</th>
// // // // // // // // //                     <th>Score %</th>
// // // // // // // // //                     <th>Submitted At</th>
// // // // // // // // //                   </tr>
// // // // // // // // //                 </thead>
// // // // // // // // //                 <tbody>
// // // // // // // // //                   {results.map((res, idx) => (
// // // // // // // // //                     <tr key={idx}>
// // // // // // // // //                       <td>{res.name}</td>
// // // // // // // // //                       <td>{res.email}</td>
// // // // // // // // //                       <td>{res.totalQuestions}</td>
// // // // // // // // //                       <td>{res.correctAnswers}</td>
// // // // // // // // //                       <td>{res.scorePercent}%</td>
// // // // // // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // // // // //                     </tr>
// // // // // // // // //                   ))}
// // // // // // // // //                 </tbody>
// // // // // // // // //               </table>
// // // // // // // // //             )}
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       )}
// // // // // // // // //     </div>
// // // // // // // // //   );
// // // // // // // // // }

// // // // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // // // import API from "../services/api";
// // // // // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // // // // export default function AdminDashboard() {
// // // // // // // // // //   const navigate = useNavigate();
// // // // // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // // // // //   const [results, setResults] = useState([]);
// // // // // // // // // //   const [activeTab, setActiveTab] = useState("questions"); // 🔹 Switch tab
// // // // // // // // // //   const [form, setForm] = useState({
// // // // // // // // // //     questionText: "",
// // // // // // // // // //     optionsText: "",
// // // // // // // // // //     correctAnswer: "",
// // // // // // // // // //   });
// // // // // // // // // //   const [questionType, setQuestionType] = useState("MCQ");
// // // // // // // // // //   const [file, setFile] = useState(null);
// // // // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // // // //   const [loadingResults, setLoadingResults] = useState(false);

// // // // // // // // // //   // 🟢 Check admin login
// // // // // // // // // //   useEffect(() => {
// // // // // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // // // // //     if (!token) navigate("/admin/login");
// // // // // // // // // //   }, [navigate]);

// // // // // // // // // //   // 🟢 Fetch initial data
// // // // // // // // // //   useEffect(() => {
// // // // // // // // // //     fetchQuestions();
// // // // // // // // // //     fetchResults();
// // // // // // // // // //   }, []);

// // // // // // // // // //   const fetchQuestions = async () => {
// // // // // // // // // //     try {
// // // // // // // // // //       const res = await API.get("/questions");
// // // // // // // // // //       setQuestions(res.data || []);
// // // // // // // // // //     } catch (err) {
// // // // // // // // // //       console.error(err);
// // // // // // // // // //       alert("❌ Failed to load questions.");
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   const fetchResults = async () => {
// // // // // // // // // //     setLoadingResults(true);
// // // // // // // // // //     try {
// // // // // // // // // //       const res = await API.get("/tests");
// // // // // // // // // //       setResults(res.data || []);
// // // // // // // // // //     } catch (err) {
// // // // // // // // // //       console.error(err);
// // // // // // // // // //       alert("❌ Failed to load test results.");
// // // // // // // // // //     } finally {
// // // // // // // // // //       setLoadingResults(false);
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   // 🟢 Add Question
// // // // // // // // // //   const handleAddQuestion = async (e) => {
// // // // // // // // // //     e.preventDefault();
// // // // // // // // // //     const opts =
// // // // // // // // // //       questionType === "MCQ"
// // // // // // // // // //         ? form.optionsText.split("|").map((s) => s.trim()).filter(Boolean)
// // // // // // // // // //         : [];

// // // // // // // // // //     if (!form.questionText.trim()) {
// // // // // // // // // //       return alert("Please enter question text.");
// // // // // // // // // //     }
// // // // // // // // // //     if (questionType === "MCQ" && (opts.length < 2 || !form.correctAnswer.trim())) {
// // // // // // // // // //       return alert("Please enter at least 2 options and a correct answer.");
// // // // // // // // // //     }

// // // // // // // // // //     setLoading(true);
// // // // // // // // // //     try {
// // // // // // // // // //       await API.post("/questions", {
// // // // // // // // // //         questionType,
// // // // // // // // // //         questionText: form.questionText,
// // // // // // // // // //         options: opts,
// // // // // // // // // //         correctAnswer: questionType === "MCQ" ? form.correctAnswer : "",
// // // // // // // // // //       });

// // // // // // // // // //       setForm({ questionText: "", optionsText: "", correctAnswer: "" });
// // // // // // // // // //       await fetchQuestions();
// // // // // // // // // //       alert("✅ Question added successfully!");
// // // // // // // // // //     } catch (err) {
// // // // // // // // // //       console.error(err);
// // // // // // // // // //       alert(err.response?.data?.error || "Failed to add question.");
// // // // // // // // // //     } finally {
// // // // // // // // // //       setLoading(false);
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   // 🟢 Upload File
// // // // // // // // // //   const handleUpload = async () => {
// // // // // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // // // // //     const fd = new FormData();
// // // // // // // // // //     fd.append("file", file);

// // // // // // // // // //     try {
// // // // // // // // // //       const res = await API.post("/questions/upload", fd, {
// // // // // // // // // //         headers: { "Content-Type": "multipart/form-data" },
// // // // // // // // // //       });
// // // // // // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // // // // // //       await fetchQuestions();
// // // // // // // // // //     } catch (err) {
// // // // // // // // // //       console.error(err);
// // // // // // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // // // // // //     }
// // // // // // // // // //   };

// // // // // // // // // //   const handleLogout = () => {
// // // // // // // // // //     localStorage.removeItem("adminToken");
// // // // // // // // // //     navigate("/admin/login");
// // // // // // // // // //   };

// // // // // // // // // //   return (
// // // // // // // // // //     <div className="admin-dashboard">
// // // // // // // // // //       {/* Header */}
// // // // // // // // // //       <div className="admin-header">
// // // // // // // // // //         <h2>Admin Dashboard</h2>
// // // // // // // // // //         <button className="logout-btn" onClick={handleLogout}>
// // // // // // // // // //           Logout
// // // // // // // // // //         </button>
// // // // // // // // // //       </div>

// // // // // // // // // //       {/* Tabs */}
// // // // // // // // // //       <div className="tab-buttons">
// // // // // // // // // //         <button
// // // // // // // // // //           className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
// // // // // // // // // //           onClick={() => setActiveTab("questions")}
// // // // // // // // // //         >
// // // // // // // // // //           🧩 Questions
// // // // // // // // // //         </button>
// // // // // // // // // //         <button
// // // // // // // // // //           className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
// // // // // // // // // //           onClick={() => setActiveTab("results")}
// // // // // // // // // //         >
// // // // // // // // // //           📊 Test Results
// // // // // // // // // //         </button>
// // // // // // // // // //       </div>

// // // // // // // // // //       {/* Content based on active tab */}
// // // // // // // // // //       {activeTab === "questions" ? (
// // // // // // // // // //         <div className="tab-content">
// // // // // // // // // //           {/* Add Question / Upload Section */}
// // // // // // // // // //           <div className="card form-section">
// // // // // // // // // //             <h5>Add or Upload Questions</h5>

// // // // // // // // // //             <form onSubmit={handleAddQuestion}>
// // // // // // // // // //               <div className="mb-3">
// // // // // // // // // //                 <label className="form-label">Question Type</label>
// // // // // // // // // //                 <select
// // // // // // // // // //                   className="form-select"
// // // // // // // // // //                   value={questionType}
// // // // // // // // // //                   onChange={(e) => setQuestionType(e.target.value)}
// // // // // // // // // //                 >
// // // // // // // // // //                   <option value="MCQ">MCQ</option>
// // // // // // // // // //                   <option value="Theory">Theory</option>
// // // // // // // // // //                 </select>
// // // // // // // // // //               </div>

// // // // // // // // // //               <div className="mb-3">
// // // // // // // // // //                 <label className="form-label">Question Text</label>
// // // // // // // // // //                 <textarea
// // // // // // // // // //                   className="form-control"
// // // // // // // // // //                   rows={questionType === "Theory" ? 3 : 2}
// // // // // // // // // //                   value={form.questionText}
// // // // // // // // // //                   onChange={(e) =>
// // // // // // // // // //                     setForm({ ...form, questionText: e.target.value })
// // // // // // // // // //                   }
// // // // // // // // // //                   placeholder="Enter your question here..."
// // // // // // // // // //                 />
// // // // // // // // // //               </div>

// // // // // // // // // //               {questionType === "MCQ" && (
// // // // // // // // // //                 <>
// // // // // // // // // //                   <div className="mb-3">
// // // // // // // // // //                     <label className="form-label">Options (separate by |)</label>
// // // // // // // // // //                     <input
// // // // // // // // // //                       className="form-control"
// // // // // // // // // //                       value={form.optionsText}
// // // // // // // // // //                       onChange={(e) =>
// // // // // // // // // //                         setForm({ ...form, optionsText: e.target.value })
// // // // // // // // // //                       }
// // // // // // // // // //                       placeholder="Option A | Option B | Option C | Option D"
// // // // // // // // // //                     />
// // // // // // // // // //                   </div>

// // // // // // // // // //                   <div className="mb-3">
// // // // // // // // // //                     <label className="form-label">Correct Answer</label>
// // // // // // // // // //                     <input
// // // // // // // // // //                       className="form-control"
// // // // // // // // // //                       value={form.correctAnswer}
// // // // // // // // // //                       onChange={(e) =>
// // // // // // // // // //                         setForm({ ...form, correctAnswer: e.target.value })
// // // // // // // // // //                       }
// // // // // // // // // //                       placeholder="Enter correct answer text"
// // // // // // // // // //                     />
// // // // // // // // // //                   </div>
// // // // // // // // // //                 </>
// // // // // // // // // //               )}

// // // // // // // // // //               <div className="d-flex gap-2">
// // // // // // // // // //                 <button className="btn btn-success" type="submit" disabled={loading}>
// // // // // // // // // //                   {loading ? "Adding..." : "Add Question"}
// // // // // // // // // //                 </button>
// // // // // // // // // //                 <button
// // // // // // // // // //                   type="button"
// // // // // // // // // //                   className="btn btn-secondary"
// // // // // // // // // //                   onClick={() =>
// // // // // // // // // //                     setForm({ questionText: "", optionsText: "", correctAnswer: "" })
// // // // // // // // // //                   }
// // // // // // // // // //                 >
// // // // // // // // // //                   Clear
// // // // // // // // // //                 </button>
// // // // // // // // // //               </div>
// // // // // // // // // //             </form>

// // // // // // // // // //             <hr className="my-4" />

// // // // // // // // // //             {/* Upload Document Section */}
// // // // // // // // // //             <div className="upload-section">
// // // // // // // // // //               <label className="form-label">Upload Document (.docx)</label>
// // // // // // // // // //               <input
// // // // // // // // // //                 type="file"
// // // // // // // // // //                 className="form-control"
// // // // // // // // // //                 accept=".docx"
// // // // // // // // // //                 onChange={(e) => setFile(e.target.files[0])}
// // // // // // // // // //               />
// // // // // // // // // //               <div className="mt-2">
// // // // // // // // // //                 <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // // // // //                   Upload
// // // // // // // // // //                 </button>
// // // // // // // // // //               </div>
// // // // // // // // // //             </div>
// // // // // // // // // //           </div>

// // // // // // // // // //           {/* Display Available Questions */}
// // // // // // // // // //           <div className="card available-questions">
// // // // // // // // // //             <h5>Available Questions</h5>

// // // // // // // // // //             <h6 className="mt-3 text-primary">MCQ Questions</h6>
// // // // // // // // // //             {questions.filter((q) => q.questionType === "MCQ").length === 0 && (
// // // // // // // // // //               <div className="text-muted">No MCQs yet</div>
// // // // // // // // // //             )}
// // // // // // // // // //             {questions
// // // // // // // // // //               .filter((q) => q.questionType === "MCQ")
// // // // // // // // // //               .map((q, idx) => (
// // // // // // // // // //                 <div key={q._id} className="question-item">
// // // // // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // // //                   <div className="small text-muted">
// // // // // // // // // //                     Options: {q.options.join(" | ")}
// // // // // // // // // //                   </div>
// // // // // // // // // //                   <div className="small text-success">
// // // // // // // // // //                     Correct: {q.correctAnswer}
// // // // // // // // // //                   </div>
// // // // // // // // // //                 </div>
// // // // // // // // // //               ))}

// // // // // // // // // //             <h6 className="mt-4 text-primary">Theory Questions</h6>
// // // // // // // // // //             {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // // // // //               <div className="text-muted">No theory questions yet</div>
// // // // // // // // // //             )}
// // // // // // // // // //             {questions
// // // // // // // // // //               .filter((q) => q.questionType === "Theory")
// // // // // // // // // //               .map((q, idx) => (
// // // // // // // // // //                 <div key={q._id} className="question-item">
// // // // // // // // // //                   <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // // //                 </div>
// // // // // // // // // //               ))}
// // // // // // // // // //           </div>
// // // // // // // // // //         </div>
// // // // // // // // // //       ) : (
// // // // // // // // // //         <div className="tab-content">
// // // // // // // // // //           {/* Test Results Section */}
// // // // // // // // // //           <div className="card results-section">
// // // // // // // // // //             <h5>Candidate Test Results</h5>

// // // // // // // // // //             {loadingResults ? (
// // // // // // // // // //               <div>Loading test results...</div>
// // // // // // // // // //             ) : results.length === 0 ? (
// // // // // // // // // //               <div className="text-muted">No test results yet</div>
// // // // // // // // // //             ) : (
// // // // // // // // // //               <table className="results-table">
// // // // // // // // // //                 <thead>
// // // // // // // // // //                   <tr>
// // // // // // // // // //                     <th>Name</th>
// // // // // // // // // //                     <th>Email</th>
// // // // // // // // // //                     <th>Total Questions</th>
// // // // // // // // // //                     <th>Correct</th>
// // // // // // // // // //                     <th>Score %</th>
// // // // // // // // // //                     <th>Submitted At</th>
// // // // // // // // // //                   </tr>
// // // // // // // // // //                 </thead>
// // // // // // // // // //                 <tbody>
// // // // // // // // // //                   {results.map((res, idx) => (
// // // // // // // // // //                     <tr key={idx}>
// // // // // // // // // //                       <td>{res.name}</td>
// // // // // // // // // //                       <td>{res.email}</td>
// // // // // // // // // //                       <td>{res.totalQuestions}</td>
// // // // // // // // // //                       <td>{res.correctAnswers}</td>
// // // // // // // // // //                       <td>{res.scorePercent}%</td>
// // // // // // // // // //                       <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // // // // // //                     </tr>
// // // // // // // // // //                   ))}
// // // // // // // // // //                 </tbody>
// // // // // // // // // //               </table>
// // // // // // // // // //             )}
// // // // // // // // // //           </div>
// // // // // // // // // //         </div>
// // // // // // // // // //       )}
// // // // // // // // // //     </div>
// // // // // // // // // //   );
// // // // // // // // // // }

// // // // // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // // // // import API from "../services/api";
// // // // // // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // // // // // export default function AdminDashboard() {
// // // // // // // // // // //   const navigate = useNavigate();
// // // // // // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // // // // // //   const [results, setResults] = useState([]);
// // // // // // // // // // //   const [form, setForm] = useState({
// // // // // // // // // // //     questionText: "",
// // // // // // // // // // //     optionsText: "",
// // // // // // // // // // //     correctAnswer: "",
// // // // // // // // // // //   });
// // // // // // // // // // //   const [questionType, setQuestionType] = useState("MCQ");
// // // // // // // // // // //   const [file, setFile] = useState(null);
// // // // // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // // // // //   const [loadingResults, setLoadingResults] = useState(false);

// // // // // // // // // // //   // 🟢 Check admin login (token validation)
// // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // // // // // //     if (!token) navigate("/admin/login");
// // // // // // // // // // //   }, [navigate]);

// // // // // // // // // // //   // 🟢 Fetch questions and test results on load
// // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // //     fetchQuestions();
// // // // // // // // // // //     fetchResults();
// // // // // // // // // // //   }, []);

// // // // // // // // // // //   const fetchQuestions = async () => {
// // // // // // // // // // //     try {
// // // // // // // // // // //       const res = await API.get("/questions");
// // // // // // // // // // //       setQuestions(res.data || []);
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error(err);
// // // // // // // // // // //       alert("❌ Failed to load questions.");
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   const fetchResults = async () => {
// // // // // // // // // // //     setLoadingResults(true);
// // // // // // // // // // //     try {
// // // // // // // // // // //       const res = await API.get("/tests");
// // // // // // // // // // //       setResults(res.data || []);
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error(err);
// // // // // // // // // // //       alert("❌ Failed to load test results.");
// // // // // // // // // // //     } finally {
// // // // // // // // // // //       setLoadingResults(false);
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // 🟢 Add Question Manually
// // // // // // // // // // //   const handleAddQuestion = async (e) => {
// // // // // // // // // // //     e.preventDefault();
// // // // // // // // // // //     const opts =
// // // // // // // // // // //       questionType === "MCQ"
// // // // // // // // // // //         ? form.optionsText.split("|").map((s) => s.trim()).filter(Boolean)
// // // // // // // // // // //         : [];

// // // // // // // // // // //     if (!form.questionText.trim()) {
// // // // // // // // // // //       return alert("Please enter question text.");
// // // // // // // // // // //     }
// // // // // // // // // // //     if (questionType === "MCQ" && (opts.length < 2 || !form.correctAnswer.trim())) {
// // // // // // // // // // //       return alert("Please enter at least 2 options and a correct answer.");
// // // // // // // // // // //     }

// // // // // // // // // // //     setLoading(true);
// // // // // // // // // // //     try {
// // // // // // // // // // //       await API.post("/questions", {
// // // // // // // // // // //         questionType,
// // // // // // // // // // //         questionText: form.questionText,
// // // // // // // // // // //         options: opts,
// // // // // // // // // // //         correctAnswer: questionType === "MCQ" ? form.correctAnswer : "",
// // // // // // // // // // //       });

// // // // // // // // // // //       setForm({ questionText: "", optionsText: "", correctAnswer: "" });
// // // // // // // // // // //       await fetchQuestions();
// // // // // // // // // // //       alert("✅ Question added successfully!");
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error(err);
// // // // // // // // // // //       alert(err.response?.data?.error || "Failed to add question.");
// // // // // // // // // // //     } finally {
// // // // // // // // // // //       setLoading(false);
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // 🟢 Upload .docx question file
// // // // // // // // // // //   const handleUpload = async () => {
// // // // // // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // // // // // //     const fd = new FormData();
// // // // // // // // // // //     fd.append("file", file);

// // // // // // // // // // //     try {
// // // // // // // // // // //       const res = await API.post("/questions/upload", fd, {
// // // // // // // // // // //         headers: { "Content-Type": "multipart/form-data" },
// // // // // // // // // // //       });
// // // // // // // // // // //       alert(res.data.message || "✅ File uploaded successfully!");
// // // // // // // // // // //       await fetchQuestions();
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error(err);
// // // // // // // // // // //       alert(err.response?.data?.error || "❌ File upload failed.");
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // 🟢 Logout
// // // // // // // // // // //   const handleLogout = () => {
// // // // // // // // // // //     localStorage.removeItem("adminToken");
// // // // // // // // // // //     navigate("/admin/login");
// // // // // // // // // // //   };

// // // // // // // // // // //   return (
// // // // // // // // // // //     <div className="container container-center py-4 admin-dashboard">
// // // // // // // // // // //       {/* Header */}
// // // // // // // // // // //       <div className="d-flex justify-content-between align-items-center mb-3 admin-header">
// // // // // // // // // // //         <h2>Admin Dashboard</h2>
// // // // // // // // // // //         <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
// // // // // // // // // // //           Logout
// // // // // // // // // // //         </button>
// // // // // // // // // // //       </div>

// // // // // // // // // // //       {/* Add Question / Upload Section */}
// // // // // // // // // // //       <div className="card card-clean p-4 mb-4 form-section">
// // // // // // // // // // //         <h5>Add questions or upload documents that will be shown to candidates.</h5>

// // // // // // // // // // //         {/* Add Question Form */}
// // // // // // // // // // //         <form onSubmit={handleAddQuestion} className="mt-3">
// // // // // // // // // // //           <div className="mb-3">
// // // // // // // // // // //             <label className="form-label">Question Type</label>
// // // // // // // // // // //             <select
// // // // // // // // // // //               className="form-select"
// // // // // // // // // // //               value={questionType}
// // // // // // // // // // //               onChange={(e) => setQuestionType(e.target.value)}
// // // // // // // // // // //             >
// // // // // // // // // // //               <option value="MCQ">MCQ</option>
// // // // // // // // // // //               <option value="Theory">Theory</option>
// // // // // // // // // // //             </select>
// // // // // // // // // // //           </div>

// // // // // // // // // // //           <div className="mb-3">
// // // // // // // // // // //             <label className="form-label">Question Text</label>
// // // // // // // // // // //             <textarea
// // // // // // // // // // //               className="form-control"
// // // // // // // // // // //               rows={questionType === "Theory" ? 3 : 2}
// // // // // // // // // // //               value={form.questionText}
// // // // // // // // // // //               onChange={(e) => setForm({ ...form, questionText: e.target.value })}
// // // // // // // // // // //               placeholder="Enter your question here..."
// // // // // // // // // // //             />
// // // // // // // // // // //           </div>

// // // // // // // // // // //           {questionType === "MCQ" && (
// // // // // // // // // // //             <>
// // // // // // // // // // //               <div className="mb-3">
// // // // // // // // // // //                 <label className="form-label">Options (separate by |)</label>
// // // // // // // // // // //                 <input
// // // // // // // // // // //                   className="form-control"
// // // // // // // // // // //                   value={form.optionsText}
// // // // // // // // // // //                   onChange={(e) =>
// // // // // // // // // // //                     setForm({ ...form, optionsText: e.target.value })
// // // // // // // // // // //                   }
// // // // // // // // // // //                   placeholder="Option A | Option B | Option C | Option D"
// // // // // // // // // // //                 />
// // // // // // // // // // //               </div>

// // // // // // // // // // //               <div className="mb-3">
// // // // // // // // // // //                 <label className="form-label">
// // // // // // // // // // //                   Correct Answer (exact text of one option)
// // // // // // // // // // //                 </label>
// // // // // // // // // // //                 <input
// // // // // // // // // // //                   className="form-control"
// // // // // // // // // // //                   value={form.correctAnswer}
// // // // // // // // // // //                   onChange={(e) =>
// // // // // // // // // // //                     setForm({ ...form, correctAnswer: e.target.value })
// // // // // // // // // // //                   }
// // // // // // // // // // //                   placeholder="Enter correct answer text"
// // // // // // // // // // //                 />
// // // // // // // // // // //               </div>
// // // // // // // // // // //             </>
// // // // // // // // // // //           )}

// // // // // // // // // // //           <div className="mb-3 d-flex gap-2">
// // // // // // // // // // //             <button
// // // // // // // // // // //               className="btn btn-success"
// // // // // // // // // // //               type="submit"
// // // // // // // // // // //               disabled={loading}
// // // // // // // // // // //             >
// // // // // // // // // // //               {loading ? "Adding..." : "Add Question"}
// // // // // // // // // // //             </button>
// // // // // // // // // // //             <button
// // // // // // // // // // //               type="button"
// // // // // // // // // // //               className="btn btn-secondary"
// // // // // // // // // // //               onClick={() =>
// // // // // // // // // // //                 setForm({ questionText: "", optionsText: "", correctAnswer: "" })
// // // // // // // // // // //               }
// // // // // // // // // // //             >
// // // // // // // // // // //               Clear
// // // // // // // // // // //             </button>
// // // // // // // // // // //           </div>
// // // // // // // // // // //         </form>

// // // // // // // // // // //         <hr className="my-4" />

// // // // // // // // // // //         {/* Upload Document Section */}
// // // // // // // // // // //         <div className="mb-3 upload-section">
// // // // // // // // // // //           <label className="form-label">Upload Document (.docx)</label>
// // // // // // // // // // //           <input
// // // // // // // // // // //             type="file"
// // // // // // // // // // //             className="form-control"
// // // // // // // // // // //             accept=".docx"
// // // // // // // // // // //             onChange={(e) => setFile(e.target.files[0])}
// // // // // // // // // // //           />
// // // // // // // // // // //           <div className="mt-2">
// // // // // // // // // // //             <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // // // // // //               Upload
// // // // // // // // // // //             </button>
// // // // // // // // // // //           </div>
// // // // // // // // // // //         </div>
// // // // // // // // // // //       </div>

// // // // // // // // // // //       {/* Available Questions */}
// // // // // // // // // // //       <div className="card card-clean p-4 mb-4 available-questions">
// // // // // // // // // // //         <h5>Available Questions</h5>

// // // // // // // // // // //         {/* MCQ Section */}
// // // // // // // // // // //         <h6 className="mt-3 text-primary">MCQ Questions</h6>
// // // // // // // // // // //         {questions.filter((q) => q.questionType === "MCQ").length === 0 && (
// // // // // // // // // // //           <div className="text-muted">No MCQs yet</div>
// // // // // // // // // // //         )}
// // // // // // // // // // //         {questions
// // // // // // // // // // //           .filter((q) => q.questionType === "MCQ")
// // // // // // // // // // //           .map((q, idx) => (
// // // // // // // // // // //             <div key={q._id} className="mb-3 border-bottom pb-2">
// // // // // // // // // // //               <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // // // //               <div className="small text-muted">
// // // // // // // // // // //                 Options: {q.options.join(" | ")}
// // // // // // // // // // //               </div>
// // // // // // // // // // //               <div className="small text-success">
// // // // // // // // // // //                 Correct: {q.correctAnswer}
// // // // // // // // // // //               </div>
// // // // // // // // // // //             </div>
// // // // // // // // // // //           ))}

// // // // // // // // // // //         {/* Theory Section */}
// // // // // // // // // // //         <h6 className="mt-4 text-primary">Theory Questions</h6>
// // // // // // // // // // //         {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // // // // // //           <div className="text-muted">No theory questions yet</div>
// // // // // // // // // // //         )}
// // // // // // // // // // //         {questions
// // // // // // // // // // //           .filter((q) => q.questionType === "Theory")
// // // // // // // // // // //           .map((q, idx) => (
// // // // // // // // // // //             <div key={q._id} className="mb-3 border-bottom pb-2">
// // // // // // // // // // //               <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // // // //             </div>
// // // // // // // // // // //           ))}
// // // // // // // // // // //       </div>

// // // // // // // // // // //       {/* Test Results Section */}
// // // // // // // // // // //       <div className="card card-clean p-4 mb-4 results-section">
// // // // // // // // // // //         <h5>Candidate Test Results</h5>

// // // // // // // // // // //         {loadingResults ? (
// // // // // // // // // // //           <div>Loading test results...</div>
// // // // // // // // // // //         ) : results.length === 0 ? (
// // // // // // // // // // //           <div className="text-muted">No test results yet</div>
// // // // // // // // // // //         ) : (
// // // // // // // // // // //           <table className="results-table">
// // // // // // // // // // //             <thead>
// // // // // // // // // // //               <tr>
// // // // // // // // // // //                 <th>Name</th>
// // // // // // // // // // //                 <th>Email</th>
// // // // // // // // // // //                 <th>Total Questions</th>
// // // // // // // // // // //                 <th>Correct</th>
// // // // // // // // // // //                 <th>Score %</th>
// // // // // // // // // // //                 <th>Submitted At</th>
// // // // // // // // // // //               </tr>
// // // // // // // // // // //             </thead>
// // // // // // // // // // //             <tbody>
// // // // // // // // // // //               {results.map((res, idx) => (
// // // // // // // // // // //                 <tr key={idx}>
// // // // // // // // // // //                   <td>{res.name}</td>
// // // // // // // // // // //                   <td>{res.email}</td>
// // // // // // // // // // //                   <td>{res.totalQuestions}</td>
// // // // // // // // // // //                   <td>{res.correctAnswers}</td>
// // // // // // // // // // //                   <td>{res.scorePercent}%</td>
// // // // // // // // // // //                   <td>{new Date(res.submittedAt).toLocaleString()}</td>
// // // // // // // // // // //                 </tr>
// // // // // // // // // // //               ))}
// // // // // // // // // // //             </tbody>
// // // // // // // // // // //           </table>
// // // // // // // // // // //         )}
// // // // // // // // // // //       </div>
// // // // // // // // // // //     </div>
// // // // // // // // // // //   );
// // // // // // // // // // // }

// // // // // // // // // // // // import React, { useEffect, useState } from "react";
// // // // // // // // // // // // import API from "../services/api";
// // // // // // // // // // // // import { useNavigate } from "react-router-dom";
// // // // // // // // // // // // import "../styles/AdminDashboard.css";

// // // // // // // // // // // // export default function AdminDashboard() {
// // // // // // // // // // // //   const navigate = useNavigate();
// // // // // // // // // // // //   const [questions, setQuestions] = useState([]);
// // // // // // // // // // // //   const [form, setForm] = useState({
// // // // // // // // // // // //     questionText: "",
// // // // // // // // // // // //     optionsText: "",
// // // // // // // // // // // //     correctAnswer: "",
// // // // // // // // // // // //   });
// // // // // // // // // // // //   const [questionType, setQuestionType] = useState("MCQ");
// // // // // // // // // // // //   const [file, setFile] = useState(null);
// // // // // // // // // // // //   const [loading, setLoading] = useState(false);

// // // // // // // // // // // //   // 🟢 Check admin login (token validation)
// // // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // // //     const token = localStorage.getItem("adminToken");
// // // // // // // // // // // //     if (!token) navigate("/admin/login");
// // // // // // // // // // // //   }, [navigate]);

// // // // // // // // // // // //   // 🟢 Fetch questions from DB
// // // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // // //     fetchQuestions();
// // // // // // // // // // // //   }, []);

// // // // // // // // // // // //   const fetchQuestions = async () => {
// // // // // // // // // // // //     try {
// // // // // // // // // // // //       const res = await API.get("/questions");
// // // // // // // // // // // //       setQuestions(res.data || []);
// // // // // // // // // // // //     } catch (err) {
// // // // // // // // // // // //       console.error(err);
// // // // // // // // // // // //       alert("Failed to load questions.");
// // // // // // // // // // // //     }
// // // // // // // // // // // //   };

// // // // // // // // // // // //   // 🟢 Add Question Manually
// // // // // // // // // // // //   const handleAddQuestion = async (e) => {
// // // // // // // // // // // //     e.preventDefault();
// // // // // // // // // // // //     const opts =
// // // // // // // // // // // //       questionType === "MCQ"
// // // // // // // // // // // //         ? form.optionsText.split("|").map((s) => s.trim()).filter(Boolean)
// // // // // // // // // // // //         : [];

// // // // // // // // // // // //     if (!form.questionText.trim()) {
// // // // // // // // // // // //       return alert("Please enter question text.");
// // // // // // // // // // // //     }
// // // // // // // // // // // //     if (questionType === "MCQ" && (opts.length < 2 || !form.correctAnswer.trim())) {
// // // // // // // // // // // //       return alert("Please enter at least 2 options and a correct answer.");
// // // // // // // // // // // //     }

// // // // // // // // // // // //     setLoading(true);
// // // // // // // // // // // //     try {
// // // // // // // // // // // //       await API.post("/questions", {
// // // // // // // // // // // //         questionType,
// // // // // // // // // // // //         questionText: form.questionText,
// // // // // // // // // // // //         options: opts,
// // // // // // // // // // // //         correctAnswer: questionType === "MCQ" ? form.correctAnswer : "",
// // // // // // // // // // // //       });

// // // // // // // // // // // //       setForm({ questionText: "", optionsText: "", correctAnswer: "" });
// // // // // // // // // // // //       await fetchQuestions();
// // // // // // // // // // // //       alert("✅ Question added successfully!");
// // // // // // // // // // // //     } catch (err) {
// // // // // // // // // // // //       console.error(err);
// // // // // // // // // // // //       alert(err.response?.data?.error || "Failed to add question.");
// // // // // // // // // // // //     } finally {
// // // // // // // // // // // //       setLoading(false);
// // // // // // // // // // // //     }
// // // // // // // // // // // //   };

// // // // // // // // // // // //   // 🟢 Upload .docx question file
// // // // // // // // // // // //   const handleUpload = async () => {
// // // // // // // // // // // //     if (!file) return alert("Please select a file to upload.");
// // // // // // // // // // // //     const fd = new FormData();
// // // // // // // // // // // //     fd.append("file", file);

// // // // // // // // // // // //     try {
// // // // // // // // // // // //       const res = await API.post("/questions/upload", fd, {
// // // // // // // // // // // //         headers: { "Content-Type": "multipart/form-data" },
// // // // // // // // // // // //       });
// // // // // // // // // // // //       alert(res.data.message || "File uploaded successfully!");
// // // // // // // // // // // //       await fetchQuestions();
// // // // // // // // // // // //     } catch (err) {
// // // // // // // // // // // //       console.error(err);
// // // // // // // // // // // //       alert(err.response?.data?.error || "File upload failed.");
// // // // // // // // // // // //     }
// // // // // // // // // // // //   };

// // // // // // // // // // // //   // 🟢 Logout
// // // // // // // // // // // //   const handleLogout = () => {
// // // // // // // // // // // //     localStorage.removeItem("adminToken");
// // // // // // // // // // // //     navigate("/admin/login");
// // // // // // // // // // // //   };

// // // // // // // // // // // //   return (
// // // // // // // // // // // //     <div className="container container-center py-4">
// // // // // // // // // // // //       <div className="d-flex justify-content-between align-items-center mb-3">
// // // // // // // // // // // //         <h2>Admin Dashboard</h2>
// // // // // // // // // // // //         <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
// // // // // // // // // // // //           Logout
// // // // // // // // // // // //         </button>
// // // // // // // // // // // //       </div>

// // // // // // // // // // // //       <div className="card card-clean p-4 mb-4">
// // // // // // // // // // // //         <h5>Add questions or upload documents that will be shown to candidates.</h5>

// // // // // // // // // // // //         {/* Add Question Form */}
// // // // // // // // // // // //         <form onSubmit={handleAddQuestion} className="mt-3">
// // // // // // // // // // // //           <div className="mb-3">
// // // // // // // // // // // //             <label className="form-label">Question Type</label>
// // // // // // // // // // // //             <select
// // // // // // // // // // // //               className="form-select"
// // // // // // // // // // // //               value={questionType}
// // // // // // // // // // // //               onChange={(e) => setQuestionType(e.target.value)}
// // // // // // // // // // // //             >
// // // // // // // // // // // //               <option value="MCQ">MCQ</option>
// // // // // // // // // // // //               <option value="Theory">Theory</option>
// // // // // // // // // // // //             </select>
// // // // // // // // // // // //           </div>

// // // // // // // // // // // //           <div className="mb-3">
// // // // // // // // // // // //             <label className="form-label">Question Text</label>
// // // // // // // // // // // //             <textarea
// // // // // // // // // // // //               className="form-control"
// // // // // // // // // // // //               rows={questionType === "Theory" ? 3 : 2}
// // // // // // // // // // // //               value={form.questionText}
// // // // // // // // // // // //               onChange={(e) => setForm({ ...form, questionText: e.target.value })}
// // // // // // // // // // // //               placeholder="Enter your question here..."
// // // // // // // // // // // //             />
// // // // // // // // // // // //           </div>

// // // // // // // // // // // //           {questionType === "MCQ" && (
// // // // // // // // // // // //             <>
// // // // // // // // // // // //               <div className="mb-3">
// // // // // // // // // // // //                 <label className="form-label">Options (separate by |)</label>
// // // // // // // // // // // //                 <input
// // // // // // // // // // // //                   className="form-control"
// // // // // // // // // // // //                   value={form.optionsText}
// // // // // // // // // // // //                   onChange={(e) =>
// // // // // // // // // // // //                     setForm({ ...form, optionsText: e.target.value })
// // // // // // // // // // // //                   }
// // // // // // // // // // // //                   placeholder="Option A | Option B | Option C | Option D"
// // // // // // // // // // // //                 />
// // // // // // // // // // // //               </div>

// // // // // // // // // // // //               <div className="mb-3">
// // // // // // // // // // // //                 <label className="form-label">
// // // // // // // // // // // //                   Correct Answer (exact text of one option)
// // // // // // // // // // // //                 </label>
// // // // // // // // // // // //                 <input
// // // // // // // // // // // //                   className="form-control"
// // // // // // // // // // // //                   value={form.correctAnswer}
// // // // // // // // // // // //                   onChange={(e) =>
// // // // // // // // // // // //                     setForm({ ...form, correctAnswer: e.target.value })
// // // // // // // // // // // //                   }
// // // // // // // // // // // //                   placeholder="Enter correct answer text"
// // // // // // // // // // // //                 />
// // // // // // // // // // // //               </div>
// // // // // // // // // // // //             </>
// // // // // // // // // // // //           )}

// // // // // // // // // // // //           <div className="mb-3 d-flex gap-2">
// // // // // // // // // // // //             <button
// // // // // // // // // // // //               className="btn btn-success"
// // // // // // // // // // // //               type="submit"
// // // // // // // // // // // //               disabled={loading}
// // // // // // // // // // // //             >
// // // // // // // // // // // //               {loading ? "Adding..." : "Add Question"}
// // // // // // // // // // // //             </button>
// // // // // // // // // // // //             <button
// // // // // // // // // // // //               type="button"
// // // // // // // // // // // //               className="btn btn-secondary"
// // // // // // // // // // // //               onClick={() =>
// // // // // // // // // // // //                 setForm({ questionText: "", optionsText: "", correctAnswer: "" })
// // // // // // // // // // // //               }
// // // // // // // // // // // //             >
// // // // // // // // // // // //               Clear
// // // // // // // // // // // //             </button>
// // // // // // // // // // // //           </div>
// // // // // // // // // // // //         </form>

// // // // // // // // // // // //         <hr className="my-4" />

// // // // // // // // // // // //         {/* Upload Document Section */}
// // // // // // // // // // // //         <div className="mb-3">
// // // // // // // // // // // //           <label className="form-label">Upload Document (.docx)</label>
// // // // // // // // // // // //           <input
// // // // // // // // // // // //             type="file"
// // // // // // // // // // // //             className="form-control"
// // // // // // // // // // // //             accept=".docx"
// // // // // // // // // // // //             onChange={(e) => setFile(e.target.files[0])}
// // // // // // // // // // // //           />
// // // // // // // // // // // //           <div className="mt-2">
// // // // // // // // // // // //             <button className="btn btn-primary" onClick={handleUpload}>
// // // // // // // // // // // //               Upload
// // // // // // // // // // // //             </button>
// // // // // // // // // // // //           </div>
// // // // // // // // // // // //         </div>
// // // // // // // // // // // //       </div>

// // // // // // // // // // // //       {/* Display All Questions */}
// // // // // // // // // // // //       <div className="card card-clean p-4">
// // // // // // // // // // // //         <h5>Available Questions</h5>

// // // // // // // // // // // //         {/* MCQ Section */}
// // // // // // // // // // // //         <h6 className="mt-3 text-primary">MCQ Questions</h6>
// // // // // // // // // // // //         {questions.filter((q) => q.questionType === "MCQ").length === 0 && (
// // // // // // // // // // // //           <div className="text-muted">No MCQs yet</div>
// // // // // // // // // // // //         )}
// // // // // // // // // // // //         {questions
// // // // // // // // // // // //           .filter((q) => q.questionType === "MCQ")
// // // // // // // // // // // //           .map((q, idx) => (
// // // // // // // // // // // //             <div key={q._id} className="mb-3 border-bottom pb-2">
// // // // // // // // // // // //               <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // // // // //               <div className="small text-muted">
// // // // // // // // // // // //                 Options: {q.options.join(" | ")}
// // // // // // // // // // // //               </div>
// // // // // // // // // // // //               <div className="small text-success">
// // // // // // // // // // // //                 Correct: {q.correctAnswer}
// // // // // // // // // // // //               </div>
// // // // // // // // // // // //             </div>
// // // // // // // // // // // //           ))}

// // // // // // // // // // // //         {/* Theory Section */}
// // // // // // // // // // // //         <h6 className="mt-4 text-primary">Theory Questions</h6>
// // // // // // // // // // // //         {questions.filter((q) => q.questionType === "Theory").length === 0 && (
// // // // // // // // // // // //           <div className="text-muted">No theory questions yet</div>
// // // // // // // // // // // //         )}
// // // // // // // // // // // //         {questions
// // // // // // // // // // // //           .filter((q) => q.questionType === "Theory")
// // // // // // // // // // // //           .map((q, idx) => (
// // // // // // // // // // // //             <div key={q._id} className="mb-3 border-bottom pb-2">
// // // // // // // // // // // //               <strong>Q{idx + 1}:</strong> {q.questionText}
// // // // // // // // // // // //             </div>
// // // // // // // // // // // //           ))}
// // // // // // // // // // // //       </div>
// // // // // // // // // // // //     </div>
// // // // // // // // // // // //   );
// // // // // // // // // // // // }
