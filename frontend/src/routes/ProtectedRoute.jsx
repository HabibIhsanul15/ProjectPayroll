import { Navigate, Outlet } from "react-router-dom";
import { getPeran, isLoggedIn } from "../lib/auth";

export default function ProtectedRoute({ allow }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const peran = getPeran();
  if (allow && !allow.includes(peran)) return <Navigate to="/" replace />;

  return <Outlet />;
}
