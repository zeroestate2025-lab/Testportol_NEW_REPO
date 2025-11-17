import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container container-center text-center" style={{ marginTop: 80 }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/" className="btn btn-primary">Back Home</Link>
    </div>
  );
}
