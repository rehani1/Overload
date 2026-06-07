import { Navigate, Outlet, useLocation } from "react-router-dom";

import { FullScreenState } from "../components/FullScreenState";
import { useAuth } from "./useAuth";

export function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return <FullScreenState title="Loading Overload" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
