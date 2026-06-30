import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { SocketProvider } from '../context/SocketContext';

// Import Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Dashboard } from '../pages/Dashboard';
import { MeetingRoom } from '../pages/MeetingRoom';
import { SettingsPage } from '../pages/SettingsPage';
import { AdminDashboard } from '../pages/AdminDashboard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Layout Paths */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Standard App Sidebar Paths */}
      <Route
        element={
          <SocketProvider>
            <AppLayout />
          </SocketProvider>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Immersive Full-screen Meeting View */}
      <Route
        path="/room/:code"
        element={
          <SocketProvider>
            <MeetingRoom />
          </SocketProvider>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
