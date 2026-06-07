import { Navigate, Outlet } from "react-router-dom";

import { FullScreenState } from "../components/FullScreenState";
import { useAuth } from "./useAuth";

export function RedirectIfAuthenticated() {
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return <FullScreenState title="Loading Overload" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
