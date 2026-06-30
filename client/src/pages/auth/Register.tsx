import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { registerAPI } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      const res = await registerAPI({
        name: data.name,
        email: data.email,
        password: data.password
      });

      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        navigate('/');
      } else {
        setError(res.message || 'Registration failed. Try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Create an account</h2>
        <p className="text-xs text-slate-500 mt-1">Get started with a free NexusMeet space</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle size={16} className="shrink-0 text-red-650" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <UserIcon size={16} />
            </span>
            <input
              type="text"
              placeholder="Sarah Connor"
              {...register('name', {
                required: 'Name is required',
                maxLength: { value: 50, message: 'Name cannot exceed 50 characters' }
              })}
              className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors ${
                errors.name ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail size={16} />
            </span>
            <input
              type="email"
              placeholder="sarah@sky.net"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Invalid email address format'
                }
              })}
              className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors ${
                errors.email ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.email && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors ${
                errors.password ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600">Confirm Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === passwordVal || 'Passwords do not match'
              })}
              className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-transform"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Registering...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
