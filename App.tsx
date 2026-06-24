import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from './features/landing/LandingPage';
import { TemplateGalleryPage } from './features/landing/TemplateGalleryPage';
import InvitationView from './features/invitation/InvitationView';
import { EventCreator } from './features/invitation/EventCreator';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Dashboard } from './features/dashboard/Dashboard';
import { UserDashboard } from './features/dashboard/UserDashboard';
import { CreateBusiness } from './features/business/CreateBusiness';
import { BusinessDashboard } from './features/business/BusinessDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { ClientDashboard } from './features/dashboard/ClientDashboard';
import { CheckinScanner } from './features/checkin/CheckinScanner';
import { AuthPage } from './features/auth/AuthPage';
import { PlansPage } from './features/plans/PlansPage';
import { TermsPage } from './features/landing/TermsPage';
import { PrivacyPage } from './features/landing/PrivacyPage';
import { AboutPage } from './features/landing/AboutPage';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full min-h-screen"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/templates" element={<PageWrapper><TemplateGalleryPage /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/invite/:id" element={<PageWrapper><InvitationView /></PageWrapper>} />
        <Route path="/checkin/:id" element={<PageWrapper><CheckinScanner /></PageWrapper>} />
        <Route path="/business/create" element={
            <ProtectedRoute>
                <PageWrapper><CreateBusiness /></PageWrapper>
            </ProtectedRoute>
        } />
        <Route path="/b2b" element={
            <ProtectedRoute>
                <PageWrapper><BusinessDashboard /></PageWrapper>
            </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
            <ProtectedRoute>
                <PageWrapper><UserDashboard /></PageWrapper>
            </ProtectedRoute>
        } />
        <Route path="/dashboard/:id" element={
            <ProtectedRoute>
                <PageWrapper><Dashboard /></PageWrapper>
            </ProtectedRoute>
        } />
        <Route path="/client-dashboard/:id" element={<PageWrapper><ClientDashboard /></PageWrapper>} />
        <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
        <Route path="/plans" element={<PageWrapper><PlansPage /></PageWrapper>} />
        <Route path="/create-invitation" element={
            <ProtectedRoute>
                <PageWrapper><EventCreator /></PageWrapper>
            </ProtectedRoute>
        } />
        <Route path="/create-bridal" element={
            <ProtectedRoute>
                <PageWrapper><EventCreator /></PageWrapper>
            </ProtectedRoute>
        } />
        <Route path="/admin" element={
            <AdminRoute>
                <PageWrapper><AdminDashboard /></PageWrapper>
            </AdminRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-center" />
      <Router>
        <AnimatedRoutes />
      </Router>
    </>
  );
};

export default App;

