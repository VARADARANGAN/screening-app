'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminProfileSchema, AdminProfileInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export function AdminProfileForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState('');

  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetPassError, setResetPassError] = useState('');

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
      // Ignore 404
    }
  };

  const onSubmit = async (data: AdminProfileInput) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/admin/dashboard');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {isEditing ? 'Edit Admin Profile' : 'Complete Admin Profile'}
      </h2>

      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            {...register('fullName')}
            type="text"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jane Doe"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <input
            {...register('department')}
            type="text"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Human Resources"
          />
          {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Profile')}
        </Button>
      </form>

      <hr className="my-8 border-gray-200" />

      <h3 className="text-xl font-bold mb-4 text-gray-900">Change Password</h3>
      
      {resetPassError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {resetPassError}
        </div>
      )}
      {resetMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {resetMessage}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            value={resetConfirmPassword}
            onChange={(e) => setResetConfirmPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <Button
          type="submit"
          disabled={isResetting}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-md"
        >
          {isResetting ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}
