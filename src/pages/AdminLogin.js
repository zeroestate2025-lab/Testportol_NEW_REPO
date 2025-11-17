import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/AdminLogin.css";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await API.adminAuth.login(form);
      localStorage.setItem("adminToken", res.data.token);
      setLoading(false);
      navigate("/admin/dashboard");
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="container container-center">
      <div className="card card-clean p-4" style={{ maxWidth: 420, margin: "30px auto" }}>
        <h4 className="mb-3 text-center text-primary">Admin Login</h4>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input className="form-control" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div className="d-flex justify-content-between">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
            {/* <button type="button" className="btn btn-outline-secondary" onClick={() => {
              // Helpful hint: show recommended registration usage
              alert("If you don't have an admin account, create one via backend POST /api/admin/register (one-time).");
            }}>Help</button> */}
          </div>
        </form>
      </div>
    </div>
  );
}
