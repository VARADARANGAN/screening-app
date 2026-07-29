'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { StudentProfileSchema, StudentProfileInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export function ProfileForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [apiError, setApiError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: {
      cameraPermission: false,
      microphonePermission: false,
    },
  });

  // Fetch existing profile
  useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/students/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.student && response.data.student.profileCompleted) {
        setIsEditing(true);
        setIsViewMode(true);
        const fetchedData = {
          fullName: response.data.student.fullName,
          phone: response.data.student.phone,
          college: response.data.student.college,
          usn: response.data.student.usn,
          branchName: response.data.student.branchName || '',
          cameraPermission: true,
          microphonePermission: true,
        };
        setOriginalData(fetchedData);
        reset(fetchedData);
      }
    } catch (error) {
      // Ignore 404 errors as they just mean the profile isn't created yet
    }
  };

  const onSubmit = async (data: StudentProfileInput) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      if (isEditing) {
        const payload = {
          fullName: data.fullName,
          phone: data.phone,
        };
        
        await axios.patch('/api/students/profile', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const payload = {
          ...data,
          cameraPermission: true,
          microphonePermission: true
        };
        
        await axios.post('/api/students/profile', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setOriginalData(data);
      setIsViewMode(true);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('[Frontend] API Error:', error.response?.data || error.message || error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save profile';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h2>
        <p className="text-xs text-slate-500 font-medium">View and update your profile information.</p>
      </div>

      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
          <AlertTriangle className="w-4 h-4 inline-block mr-1" /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
          <Input
            type="email"
            value={user?.email || ''}
            readOnly
            disabled
            className="w-full bg-slate-100 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <Input
              {...register('fullName')}
              type="text"
              readOnly={isViewMode}
              disabled={isViewMode}
              className={`w-full ${isViewMode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
            <Input
              {...register('phone')}
              type="tel"
              maxLength={10}
              readOnly={isViewMode}
              disabled={isViewMode}
              onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
              className={`w-full ${isViewMode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
              placeholder="9876543210"
            />
            {errors.phone && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">College Name</label>
            <Input
              {...register('college')}
              type="text"
              readOnly
              disabled
              className="w-full bg-slate-100 text-slate-500 cursor-not-allowed"
              placeholder="RV College of Engineering"
            />
            {errors.college && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.college.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">USN / Roll Number</label>
            <Input
              {...register('usn')}
              type="text"
              readOnly
              disabled
              className="w-full bg-slate-100 text-slate-500 cursor-not-allowed"
              placeholder="1RV21CS001"
            />
            {errors.usn && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.usn.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Academic Branch</label>
          <input
            {...register('branchName')}
            type="text"
            readOnly
            disabled
            className="w-full px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-semibold transition"
            placeholder="Computer Science, Mechanical, etc."
          />
          {errors.branchName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.branchName.message}</p>}
        </div>

        {isViewMode ? (
          <Button
            type="button"
            onClick={() => setIsViewMode(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition mt-4 cursor-pointer"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-4 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? 'Saving Details...' : (isEditing ? 'Save Changes' : 'Complete Registration')}
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  if (originalData) reset(originalData);
                  setIsViewMode(true);
                }}
                className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
