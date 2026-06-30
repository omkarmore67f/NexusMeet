import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { forgotPasswordAPI } from '../../services/authService';
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: { email: string }) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await forgotPasswordAPI(data);
      if (res.success) {
        setSuccess(res.message);
      } else {
        setError(res.message || 'Recovery email failed to send.');
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
        <h2 className="text-xl font-bold text-slate-900">Reset password</h2>
        <p className="text-xs text-slate-500 mt-1">We will send you simulated recovery instructions</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle size={16} className="shrink-0 text-red-650" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-55/10 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} className="shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Invalid email address format'
                  }
                })}
                className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all ${
                  errors.email ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.email && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-transform"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link to="/login" className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};
