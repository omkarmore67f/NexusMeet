import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateProfileAPI } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Loader2, User as UserIcon, Lock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: any) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (data.password && data.password !== data.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        avatar: data.avatar
      };

      if (data.password) {
        payload.password = data.password;
      }

      const res = await updateProfileAPI(payload);
      if (res.success && res.user) {
        setUser(res.user);
        setSuccess('Profile settings successfully saved.');
        reset({ ...data, password: '', confirmPassword: '' });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Profile Configurations</h1>
        <p className="text-xs text-slate-500 mt-1">Configure your personal information and login credentials.</p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 size={15} className="text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle size={15} className="text-red-650" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <UserIcon size={14} />
            </span>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>
          {errors.name && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600">Email Address</label>
          <input
            type="email"
            {...register('email', { required: 'Email address is required' })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
          />
          {errors.email && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.email.message}</p>}
        </div>

        {/* Avatar URL */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600">Avatar Image URL</label>
          <input
            type="text"
            placeholder="https://images.unsplash.com/..."
            {...register('avatar')}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="flex items-center gap-1.5 mb-4 text-xs font-bold text-slate-900">
            <Sparkles size={13} className="text-brand-650" />
            <h3>Update Password</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', {
                    minLength: { value: 6, message: 'Must be at least 6 characters' }
                  })}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.password.message}</p>}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-transform"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </button>
      </form>
    </div>
  );
};
