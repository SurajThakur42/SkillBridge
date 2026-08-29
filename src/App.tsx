import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { VoiceControlProvider } from './context/VoiceControlContext.js';
import { DemoBar } from './components/DemoBar.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { VoiceFloatingWidget } from './components/VoiceFloatingWidget.js';
import { VoiceBadgeOverlay } from './components/VoiceBadgeOverlay.js';
import { VoiceHelpModal } from './components/VoiceHelpModal.js';
import { Role } from './types.js';
import { Shield, RefreshCw } from 'lucide-react';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';

// Learner Pages
import { LearnerDashboard } from './pages/learner/LearnerDashboard.js';
import { CoursesPage } from './pages/learner/CoursesPage.js';
import { CourseDetailPage } from './pages/learner/CourseDetailPage.js';
import { QuizPage } from './pages/learner/QuizPage.js';
import { SkillsPage } from './pages/learner/SkillsPage.js';
import { SkillGapPage } from './pages/learner/SkillGapPage.js';
import { RecommendationsPage } from './pages/learner/RecommendationsPage.js';
import { CertificatesPage } from './pages/learner/CertificatesPage.js';
import { ProfilePage } from './pages/learner/ProfilePage.js';

// Trainer Pages
import { TrainerDashboard } from './pages/trainer/TrainerDashboard.js';
import { TrainerCoursesPage } from './pages/trainer/TrainerCoursesPage.js';
import { CreateCoursePage } from './pages/trainer/CreateCoursePage.js';
import { TrainerLearnersPage } from './pages/trainer/TrainerLearnersPage.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.js';

// Public Verification Page
import { CertificateVerifyPage } from './pages/CertificateVerifyPage.js';

function ProtectedLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) {
  const { user, loading, switchDemoRole } = useAuth();
  const { isDark } = useTheme();

  // Seamless Demo Role Transition: Auto-switch persona when accessing a role-specific page
  useEffect(() => {
    if (user && allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      const targetRole = allowedRoles[0];
      switchDemoRole(targetRole);
    }
  }, [user?.role, allowedRoles?.join(',')]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20" />
          <span className="font-medium tracking-wide text-slate-300">Calibrating demo persona...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If currently transitioning between roles, show a smooth minimal transition container
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const targetRole = allowedRoles[0];
    return (
      <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200`}>
        <DemoBar />
        <Navbar />
        <div className="flex-1 flex max-w-full">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-12 max-w-3xl w-full mx-auto flex flex-col items-center justify-center text-center">
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-w-md w-full">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-md" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Switching to {targetRole} Demo...</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updating active persona permissions and dashboard view.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200`}>
      <DemoBar />
      <Navbar />
      <div className="flex-1 flex max-w-full">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'TRAINER') return <Navigate to="/trainer/dashboard" replace />;
  return <Navigate to="/learner/dashboard" replace />;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <VoiceControlProvider>
            <Routes>
              {/* Public & Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify/:id" element={<CertificateVerifyPage />} />
              <Route path="/certificates/:id" element={<CertificateVerifyPage />} />

              {/* Root Redirect */}
              <Route path="/" element={<RoleHomeRedirect />} />

              {/* Learner Protected Routes */}
              <Route path="/learner/dashboard" element={<ProtectedLayout allowedRoles={['LEARNER']}><LearnerDashboard /></ProtectedLayout>} />
              <Route path="/learner/courses" element={<ProtectedLayout allowedRoles={['LEARNER']}><CoursesPage /></ProtectedLayout>} />
              <Route path="/learner/courses/:id" element={<ProtectedLayout allowedRoles={['LEARNER']}><CourseDetailPage /></ProtectedLayout>} />
              <Route path="/learner/courses/:id/quiz" element={<ProtectedLayout allowedRoles={['LEARNER']}><QuizPage /></ProtectedLayout>} />
              <Route path="/learner/skills" element={<ProtectedLayout allowedRoles={['LEARNER']}><SkillsPage /></ProtectedLayout>} />
              <Route path="/learner/skill-gap" element={<ProtectedLayout allowedRoles={['LEARNER']}><SkillGapPage /></ProtectedLayout>} />
              <Route path="/learner/recommendations" element={<ProtectedLayout allowedRoles={['LEARNER']}><RecommendationsPage /></ProtectedLayout>} />
              <Route path="/learner/certificates" element={<ProtectedLayout allowedRoles={['LEARNER']}><CertificatesPage /></ProtectedLayout>} />
              <Route path="/learner/profile" element={<ProtectedLayout allowedRoles={['LEARNER']}><ProfilePage /></ProtectedLayout>} />

              {/* Trainer Protected Routes */}
              <Route path="/trainer/dashboard" element={<ProtectedLayout allowedRoles={['TRAINER', 'ADMIN']}><TrainerDashboard /></ProtectedLayout>} />
              <Route path="/trainer/courses" element={<ProtectedLayout allowedRoles={['TRAINER', 'ADMIN']}><TrainerCoursesPage /></ProtectedLayout>} />
              <Route path="/trainer/courses/create" element={<ProtectedLayout allowedRoles={['TRAINER', 'ADMIN']}><CreateCoursePage /></ProtectedLayout>} />
              <Route path="/trainer/learners" element={<ProtectedLayout allowedRoles={['TRAINER', 'ADMIN']}><TrainerLearnersPage /></ProtectedLayout>} />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={<ProtectedLayout allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedLayout>} />
              <Route path="/admin/users" element={<ProtectedLayout allowedRoles={['ADMIN']}><AdminUsersPage /></ProtectedLayout>} />
              <Route path="/admin/analytics" element={<ProtectedLayout allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedLayout>} />
              <Route path="/admin/reports" element={<ProtectedLayout allowedRoles={['ADMIN']}><AdminReportsPage /></ProtectedLayout>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Voice UI Overlays */}
            <VoiceBadgeOverlay />
            <VoiceFloatingWidget />
            <VoiceHelpModal />
          </VoiceControlProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
