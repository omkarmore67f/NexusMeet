import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

// Import brand logo image
import logoImg from '../assets/logo.png';

export const AuthLayout: React.FC = () => {
  const token = useAuthStore((state) => state.token);

  // If already authenticated, redirect to Dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative bright gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-650/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <img 
            src={logoImg} 
            alt="NexusMeet Logo" 
            className="h-18 w-18 rounded-2xl object-contain shadow-md border border-slate-150 bg-white p-1.5" 
          />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">NexusMeet</h1>
          <p className="text-slate-555 text-xs mt-1.5 font-medium">Real-time collaboration for high-performing teams</p>
        </div>

        <Outlet />
      </motion.div>
    </div>
  );
};
