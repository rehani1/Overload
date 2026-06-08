import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { RedirectIfAuthenticated } from "./auth/RedirectIfAuthenticated";
import { RequireAuth } from "./auth/RequireAuth";
import { AiChatPage } from "./pages/AiChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NutritionPage } from "./pages/NutritionPage";
import { PresetsPage } from "./pages/PresetsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { WorkoutsPage } from "./pages/WorkoutsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="presets" element={<PresetsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="ai" element={<AiChatPage />} />
          <Route path="programs" element={<Navigate to="/presets" replace />} />
        </Route>
      </Route>

      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
