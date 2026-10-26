import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import UploadExtract from './pages/UploadExtract';
import ActionItems from './pages/ActionItems';
import Decisions from './pages/Decisions';
import KnowledgeSearch from './pages/KnowledgeSearch';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="upload" element={<UploadExtract />} />
            <Route path="action-items" element={<ActionItems />} />
            <Route path="decisions" element={<Decisions />} />
            <Route path="knowledge" element={<KnowledgeSearch />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
