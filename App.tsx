import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
import InvitationView from './features/invitation/InvitationView';
import { InvitationCreator } from './features/invitation/InvitationCreator';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './features/dashboard/Dashboard';
import { AuthPage } from './features/auth/AuthPage';
import { PlansPage } from './features/plans/PlansPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/invite/:id" element={<InvitationView />} />
        <Route path="/dashboard/:id" element={
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        } />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/create-invitation" element={
            <ProtectedRoute>
                <InvitationCreator />
            </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
