import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LandingPage from './features/public/LandingPage';
import IntroPage from './features/public/IntroPage';
import CourseListPage from './features/courses/CourseListPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import DocumentsPage from './features/documents/DocumentsPage';
import DocumentDetailPage from './features/documents/DocumentDetailPage';
import ProfilePage from './features/profile/ProfilePage';
import CartPage from './features/cart/CartPage';
import CheckoutPage from './features/cart/CheckoutPage';
import TestTakingPage from './features/tests/TestTakingPage';
import ExamResultPage from './features/tests/ExamResultPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminUsersPage from './features/admin/AdminUsersPage';
import ExamListPage from './features/tests/ExamListPage';
import LessonPage from './features/lessons/LessonPage';
import SpeakingPracticePage from './features/speaking/SpeakingPracticePage';
import OfflineSchedulePage from './features/offline/OfflineSchedulePage';
import OrderHistoryPage from './features/orders/OrderHistoryPage';
import GamificationPage from './features/gamification/GamificationPage';
import ChatPage from './features/chat/ChatPage';
import SettingsPage from './features/settings/SettingsPage';
import AIPracticePage from './features/ai/AIPracticePage';

// Teacher imports
import TeacherLayout from './layouts/TeacherLayout';
import TeacherDashboard from './features/teacher/TeacherDashboard';
import TeacherCoursesPage from './features/teacher/TeacherCoursesPage';
import TeacherLessonsPage from './features/teacher/TeacherLessonsPage';
import TeacherExamsPage from './features/teacher/TeacherExamsPage';
import TeacherProfilePage from './features/teacher/TeacherProfilePage';
import TeacherOfflineClassesPage from './features/teacher/TeacherOfflineClassesPage';
import TeacherChatPage from './features/teacher/TeacherChatPage';
import TeacherSettingsPage from './features/teacher/TeacherSettingsPage';
import TeacherCourseStudentsPage from './features/teacher/TeacherCourseStudentsPage';
import TeacherOfflineClassDetailPage from './features/teacher/TeacherOfflineClassDetailPage';

// Admin imports
import AdminCoursesPage from './features/admin/AdminCoursesPage';
import AdminLibraryPage from './features/admin/AdminLibraryPage';
import AdminStatsPage from './features/admin/AdminStatsPage';
import AdminSettingsPage from './features/admin/AdminSettingsPage';
import AdminAccountPage from './features/admin/AdminAccountPage';
import AdminExamsPage from './features/admin/AdminExamsPage';
import AdminCourseLessonsPage from './features/admin/AdminCourseLessonsPage';

import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<IntroPage />} />
                <Route path="/home" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/documents/free" element={<DocumentsPage type="free" />} />
                <Route path="/documents/paid" element={<DocumentsPage type="paid" />} />
                <Route path="/courses" element={<CourseListPage />} />
                <Route path="/offline-courses" element={<DocumentsPage type="offline" />} />
                <Route path="/offline-courses/:id" element={<DocumentDetailPage />} />
                <Route path="/courses/:courseId/learn" element={<LessonPage />} />
                <Route path="/courses/:courseId/learn/:lessonId" element={<LessonPage />} />
                <Route path="/tests" element={<ExamListPage />} />
                <Route path="/test/:id/take" element={<TestTakingPage />} />
                <Route path="/test/:id/result" element={<ExamResultPage />} />
                <Route path="/speaking" element={<SpeakingPracticePage />} />
                <Route path="/ai-practice" element={<AIPracticePage />} />
                <Route path="/leaderboard" element={<GamificationPage />} />
                <Route path="/offline-schedule" element={<OfflineSchedulePage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Teacher Routes */}
                <Route path="/teacher" element={<TeacherLayout />}>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="courses" element={<TeacherCoursesPage />} />
                  <Route path="lessons" element={<TeacherLessonsPage />} />
                  <Route path="offline-classes" element={<TeacherOfflineClassesPage />} />
                  <Route path="offline-classes/:id" element={<TeacherOfflineClassDetailPage />} />
                  <Route path="exams" element={<TeacherExamsPage />} />
                  <Route path="profile" element={<TeacherProfilePage />} />
                  <Route path="courses/:id/lessons" element={<TeacherLessonsPage />} />
                  <Route path="courses/:id/students" element={<TeacherCourseStudentsPage />} />
                  <Route path="chat" element={<TeacherChatPage />} />
                  <Route path="settings" element={<TeacherSettingsPage />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="courses" element={<AdminCoursesPage />} />
                  <Route path="courses/:courseId/lessons" element={<AdminCourseLessonsPage />} />
                  <Route path="exams" element={<AdminExamsPage />} />
                  <Route path="library" element={<AdminLibraryPage />} />
                  <Route path="stats" element={<AdminStatsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="account" element={<AdminAccountPage />} />
                  <Route path="*" element={<div className="p-10">Page under construction</div>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

