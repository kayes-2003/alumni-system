import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import LandingPage         from "@/pages/LandingPage";
import AlumniDirectoryPage from "@/pages/AlumniDirectoryPage";
import EventsPage          from "@/pages/EventsPage";
import CareersPage         from "@/pages/CareersPage";
import NewsPage            from "@/pages/NewsPage";
import ContactPage         from "@/pages/ContactPage";
import MentorshipPage      from "@/pages/MentorshipPage";
import MembershipPage      from "@/pages/MembershipPage";
import NotFoundPage        from "@/pages/NotFoundPage";
import UnauthorizedPage    from "@/pages/UnauthorizedPage";

import LoginPage           from "@/pages/auth/LoginPage";
import RegisterPage        from "@/pages/auth/RegisterPage";
import ForgotPasswordPage  from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage   from "@/pages/auth/ResetPasswordPage";
import AuthCallbackPage    from "@/pages/auth/AuthCallbackPage";

import AdminDashboard      from "@/pages/dashboard/AdminDashboard";
import AlumniDashboard     from "@/pages/dashboard/AlumniDashboard";
import StudentDashboard    from "@/pages/dashboard/StudentDashboard";

import EditProfilePage     from "@/pages/profile/EditProfilePage";
import PublicProfilePage   from "@/pages/profile/PublicProfilePage";

import FeedPage            from "@/pages/feed/FeedPage";
import MessagingPage       from "@/pages/messaging/MessagingPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/"           element={<LandingPage />} />
        <Route path="/alumni"     element={<AlumniDirectoryPage />} />
        <Route path="/events"     element={<EventsPage />} />
        <Route path="/careers"    element={<CareersPage />} />
        <Route path="/news"       element={<NewsPage />} />
        <Route path="/contact"    element={<ContactPage />} />
        <Route path="/mentorship" element={<MentorshipPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/profile/:id" element={<PublicProfilePage />} />

        {/* Auth-protected */}
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/feed"         element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/messages"     element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />

        {/* Role dashboards */}
        <Route path="/dashboard/admin"   element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/alumni"  element={<ProtectedRoute allowedRoles={["alumni"]}><AlumniDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth (no layout) */}
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/register"       element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/auth/callback"   element={<AuthCallbackPage />} />
    </Routes>
  );
}

export default App;