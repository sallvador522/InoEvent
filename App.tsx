import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './features/landing/LandingPage';
import { TemplateGalleryPage } from './features/landing/TemplateGalleryPage';
import InvitationView from './features/invitation/InvitationView';
import { InvitationCreator } from './features/invitation/InvitationCreator';
import { BridalShowerCreator } from './features/invitation/BridalShowerCreator';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { LiveWall } from './features/wall/LiveWall';
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

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-center" />
      <Router>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/templates" element={<TemplateGalleryPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/invite/:id" element={<InvitationView />} />
        <Route path="/checkin/:id" element={<CheckinScanner />} />
        <Route path="/business/create" element={
            <ProtectedRoute>
                <CreateBusiness />
            </ProtectedRoute>
        } />
        <Route path="/b2b" element={
            <ProtectedRoute>
                <BusinessDashboard />
            </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
            <ProtectedRoute>
                <UserDashboard />
            </ProtectedRoute>
        } />
        <Route path="/dashboard/:id" element={
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        } />
        <Route path="/live-wall/:id" element={<LiveWall />} />
        <Route path="/client-dashboard/:id" element={<ClientDashboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/create-invitation" element={
            <ProtectedRoute>
                <InvitationCreator />
            </ProtectedRoute>
        } />
        <Route path="/create-bridal" element={
            <ProtectedRoute>
                <BridalShowerCreator />
            </ProtectedRoute>
        } />
        <Route path="/edit-invitation/:id" element={
            <ProtectedRoute>
                <InvitationCreator />
            </ProtectedRoute>
        } />
        <Route path="/edit-bridal/:id" element={
            <ProtectedRoute>
                <BridalShowerCreator />
            </ProtectedRoute>
        } />
        <Route path="/admin" element={
            <AdminRoute>
                <AdminDashboard />
            </AdminRoute>
        } />
      </Routes>
    </Router>
    </>
  );
};

export default App;
