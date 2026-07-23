'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminProfileSchema, AdminProfileInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import axios from 'axios';

export function AdminProfileForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetPassError, setResetPassError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminProfileInput>({
    resolver: zodResolver(AdminProfileSchema),
  });

  useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.admin) {
        setIsEditing(true);
        reset({
          fullName: response.data.admin.fullName,
          department: response.data.admin.department,
        });
      }
    } catch (error) {
      // Ignore 404 - means profile is not completed yet
    }
  };

  const onSubmit = async (data: AdminProfileInput) => {
    setIsSubmitting(true);
    setApiError('');
    setApiSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiSuccess('Profile updated successfully.');
      setIsEditing(true);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPassError('');
    setResetMessage('');
    if (resetPassword !== resetConfirmPassword) {
      setResetPassError('Passwords do not match');
      return;
    }
    if (resetPassword.length < 6) {
      setResetPassError('Password must be at least 6 characters');
      return;
    }
    setIsResetting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/reset-password', { newPassword: resetPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResetMessage('Password updated successfully');
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (error: any) {
      setResetPassError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsResetting(false);
    }
  };

  // Helper to get initials for the Avatar
  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Profile</h1>
          <p className="text-xs text-slate-500 font-medium">Manage your personal information and security settings</p>
        </div>
        <Link 
          href="/admin/dashboard" 
          className="bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Read-only Info */}
        <div className="col-span-1 space-y-6">
          <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center text-3xl font-black shadow-inner border-4 border-white ring-1 ring-slate-100">
                {getInitials(user?.email)} 
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 truncate max-w-48 mx-auto" title={user?.email}>
                  {user?.email?.split('@')[0] || 'Admin'}
                </h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Administrator'}
                </p>
              </div>
              <div className="w-full pt-4 border-t border-slate-100 space-y-4 text-left">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Email Address</p>
                  <p className="text-sm font-medium text-slate-900 truncate" title={user?.email}>{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Employee ID</p>
                  <p className="text-sm font-medium text-slate-900 font-mono truncate" title={user?.userId}>{user?.userId || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 p-6 pb-4">
              <CardTitle className="text-lg font-extrabold text-slate-900">Personal Information</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Update your full name and department.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {apiError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
                  ⚠️ {apiError}
                </div>
              )}
              {apiSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl">
                  ✅ {apiSuccess}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Full Name
                    </label>
                    <input
                      {...register('fullName')}
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
                      placeholder="Jane Doe"
                    />
                    {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Department
                    </label>
                    <input
                      {...register('department')}
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
                      placeholder="Human Resources"
                    />
                    {errors.department && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.department.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 p-6 pb-4">
              <CardTitle className="text-lg font-extrabold text-slate-900">Security Settings</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {resetPassError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
                  ⚠️ {resetPassError}
                </div>
              )}
              {resetMessage && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl">
                  ✅ {resetMessage}
                </div>
              )}
              <form onSubmit={handleResetPassword} className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isResetting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    {isResetting ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
