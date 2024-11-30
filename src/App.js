import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DisputeList from './components/DisputeList';
import {ChatInterface} from './components/ChatInterface';

// Lazy load components to prevent potential circular dependencies
const Login = lazy(() => import('./pages/Login'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DisputeDetails = lazy(() => import('./pages/DisputeDetails'));

function App() {
  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dispute/:id" element={<DisputeDetails />} />
          {/* Add ChatInterface route */}
          {/* <Route path="/chat/:disputeId" element={<ChatInterface />} /> */}
          <Route path="/chat/:id" element={<ChatInterface />} />

        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
