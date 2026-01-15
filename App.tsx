import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
import InvitationView from './features/invitation/InvitationView';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/invite/:id" element={<InvitationView />} />
      </Routes>
    </Router>
  );
};

export default App;
