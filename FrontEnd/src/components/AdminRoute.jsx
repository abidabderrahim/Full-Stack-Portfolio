// src/components/AdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchUser } from "../utils/auth";

const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;