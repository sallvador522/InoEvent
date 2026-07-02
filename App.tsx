import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { WhatsAppSupport } from './components/WhatsAppSupport';

// Lazy-loaded pages to reduce initial bundle size and optimize Core Web Vitals for mobile users
const LandingPage = lazy(() => import('./features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const TemplateGalleryPage = lazy(() => import('./features/landing/TemplateGalleryPage').then(m => ({ default: m.TemplateGalleryPage })));
const TermsPage = lazy(() => import('./features/landing/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./features/landing/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const AboutPage = lazy(() => import('./features/landing/AboutPage').then(m => ({ default: m.AboutPage })));
const InvitationView = lazy(() => import('./features/invitation/InvitationView'));
const CheckinScanner = lazy(() => import('./features/checkin/CheckinScanner').then(m => ({ default: m.CheckinScanner })));
const CreateBusiness = lazy(() => import('./features/business/CreateBusiness').then(m => ({ default: m.CreateBusiness })));
const BusinessDashboard = lazy(() => import('./features/business/BusinessDashboard').then(m => ({ default: m.BusinessDashboard })));
const UserDashboard = lazy(() => import('./features/dashboard/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ClientDashboard = lazy(() => import('./features/dashboard/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const AuthPage = lazy(() => import('./features/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const PlansPage = lazy(() => import('./features/plans/PlansPage').then(m => ({ default: m.PlansPage })));
const EventCreator = lazy(() => import('./features/invitation/EventCreator').then(m => ({ default: m.EventCreator })));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Sleek luxury-styled minimalist loading fallback
const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full" id="page-loader">
    <div className="relative w-10 h-10 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
      <div className="absolute inset-0 rounded-full border-t-2 border-slate-900 animate-spin" />
    </div>
    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium animate-pulse">
      Carregando...
    </span>
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full min-h-screen"
  >
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
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
        <WhatsAppSupport />
      </Router>
    </>
  );
};

export default App;

