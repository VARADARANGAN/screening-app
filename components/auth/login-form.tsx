'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsSubmitting(true);
    try {
      if (resetStep === 1) {
        if (!resetEmail) throw new Error('Email is required');
        const res = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error?.message || 'Failed to send OTP');
        setResetSuccess('OTP sent to your email!');
        setResetStep(2);
      } else if (resetStep === 2) {
        if (!resetOtp) throw new Error('OTP is required');
        setResetStep(3);
        setResetSuccess('OTP Received. Enter new password.');
      } else if (resetStep === 3) {
        if (!resetNewPassword) throw new Error('New password is required');
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword: resetNewPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error?.message || 'Reset failed');
        setResetSuccess('Password reset successful! You can now login.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setResetStep(1);
          setResetSuccess('');
          setResetEmail('');
          setResetOtp('');
          setResetNewPassword('');
        }, 3000);
      }
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const user = await login(data.email, data.password);
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (error: any) {
      setApiError(error.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 space-y-6">
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-xl mx-auto shadow-md shadow-blue-900/10">
          C
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-500">Enter your credentials to access the assessment portal</p>
      </div>

      {isForgotPassword ? (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {resetError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
              ⚠️ {resetError}
            </div>
          )}
          {resetSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl">
              ✅ {resetSuccess}
            </div>
          )}

          {resetStep === 1 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition" placeholder="you@example.com" required />
            </div>
          )}
          {resetStep === 2 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Enter OTP</label>
              <input type="text" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition" placeholder="123456" required />
            </div>
          )}
          {resetStep === 3 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
              <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition" placeholder="••••••••" required />
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-900/10 transition mt-2 cursor-pointer">
            {isSubmitting ? 'Processing...' : resetStep === 1 ? 'Send OTP' : resetStep === 2 ? 'Verify OTP' : 'Reset Password'}
          </Button>

          <div className="text-center pt-2">
            <button type="button" onClick={() => { setIsForgotPassword(false); setResetStep(1); setResetSuccess(''); setResetError(''); }} className="text-xs font-bold text-slate-500 hover:text-slate-800">
              Back to Login
            </button>
          </div>
        </form>
      ) : (
        <>
          {apiError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
              ⚠️ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-900/10 transition mt-2 cursor-pointer"
            >
              {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
            </Button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
