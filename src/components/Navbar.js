import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <nav className="navbar-container">
      {/* Left side - brand name */}
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          VLSI Interview Tool
        </Link>
      </div>

      {/* Right side - navigation links */}
      <div className="navbar-links">
        <Link to="/" className="nav-item">
          Home
        </Link>
        {token && (
          <Link to="/admin/dashboard" className="nav-item">
            Dashboard
          </Link>
        )}
        {!token && (
          <Link to="/admin/login" className="nav-item">
            Admin
          </Link>
        )}
        {token && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
