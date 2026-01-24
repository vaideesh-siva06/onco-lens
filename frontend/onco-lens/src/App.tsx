import '@js-temporal/polyfill';

import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import PublicRoute from './components/PublicRoute';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import { useAuth } from '../context/AuthContext';
import { ProjectsProvider } from '../context/ProjectsContext';
import { DocumentProvider } from '../context/DocumentsContext';
import ProjectPage from './pages/ProjectPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConferenceCallPage from './pages/ConferenceCallPage';
import InRoomPage from './pages/InRoomPage';
import { io } from 'socket.io-client';
import ChatPage from './pages/ChatPage';
import { useUser } from '../context/UserContext';

const App: React.FC = () => {

  const { isAuthenticated, userId, loading, logout } = useAuth(); // ✅ get all from context
  const location = useLocation();
  const isMeetingPage = location.pathname.startsWith("/meeting/");
  const hideFooter = isMeetingPage;
  const { user, getUserInfo } = useUser();

  useEffect(() => {

    if (!user) {
      const storedId = localStorage.getItem('userId');
      if (storedId) getUserInfo(storedId);
    }

    console.log(user);
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log("User is authenticated and has a userId");
    }
  }, [isAuthenticated, userId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        pauseOnHover
        theme="light"
        closeButton={false}
      />

      <Navbar />
      <ScrollToTop />

      <main className="w-full flex-1">
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              isAuthenticated && userId ? (
                <Navigate to={`/${userId}/dashboard`} replace />
              ) : (
                <PublicRoute>
                  <Home />
                </PublicRoute>
              )
            }
          />

          <Route
            path="/get-started"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/:id/dashboard" element={
              <ProjectsProvider value={{ projects: [], addProject: () => { }, fetchProjects: () => { }, deleteProject: () => { }, loading: true }}>
                <Dashboard />
              </ProjectsProvider>
            } />
            <Route path="/meeting/:meetingId" element={<ConferenceCallPage />} />
            <Route path="meeting/:meetingId/in-room" element={<InRoomPage />} />
            <Route path="/project/:id" element={
              <DocumentProvider>
                <ProjectPage />
              </DocumentProvider>} />
            <Route path="/:id/settings" element={
              <DocumentProvider>
                <Settings />
              </DocumentProvider>
              } />
            <Route path="/:projectId/chat" element={<ChatPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

export default App;
