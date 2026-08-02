'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2, ArrowLeft, Save } from 'lucide-react';
import { StudentProfileSchema, StudentProfileInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export function ProfileForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
      college: '',
      usn: '',
      branchName: '',
      cameraPermission: true,
      microphonePermission: true,
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
      if (response.data.student) {
        const fetchedData = {
          email: response.data.student.email || user?.email || '',
          fullName: response.data.student.fullName || '',
          phone: response.data.student.phone || '',
          college: response.data.student.college || '',
          usn: response.data.student.usn || '',
          branchName: response.data.student.branchName || '',
          cameraPermission: true,
          microphonePermission: true,
        };
        reset(fetchedData);
      }
    } catch (error) {
      // If 404, we just use empty defaults with the auth user's email if possible
      if (user?.email) {
        reset({
          email: user.email,
          fullName: '',
          phone: '',
          college: '',
          usn: '',
          branchName: '',
          cameraPermission: true,
          microphonePermission: true,
        });
      }
    }
  };

  const onSubmit = async (data: StudentProfileInput) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...data,
        cameraPermission: true,
        microphonePermission: true
      };
      
      await axios.post('/api/students/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      reset(data); // reset the form with the new data so isDirty becomes false
      toast.success('Profile updated successfully');
      router.push('/student/dashboard');
    } catch (error: any) {
      console.error('[Frontend] API Error:', error.response?.data || error.message || error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save profile';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <button 
        onClick={() => router.push('/student/dashboard')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
      <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
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
            {...register('email')}
            type="email"
            className="w-full bg-slate-50"
            placeholder="Email Address"
          />
          {errors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <Input
              {...register('fullName')}
              type="text"
              className="w-full bg-slate-50"
              placeholder="Full Name"
            />
            {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
            <Input
              {...register('phone')}
              type="tel"
              maxLength={10}
              onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
              className="w-full bg-slate-50"
              placeholder="Phone Number"
            />
            {errors.phone && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">College Name</label>
            <Input
              {...register('college')}
              type="text"
              className="w-full bg-slate-50"
              placeholder="College"
            />
            {errors.college && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.college.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">USN / Roll Number</label>
            <Input
              {...register('usn')}
              type="text"
              className="w-full bg-slate-50"
              placeholder="USN / Roll Number"
            />
            {errors.usn && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.usn.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Academic Branch</label>
          <input
            {...register('branchName')}
            type="text"
            className="w-full px-3.5 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-semibold transition"
            placeholder="Branch"
          />
          {errors.branchName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.branchName.message}</p>}
        </div>

        <div className="pt-4 flex">
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="w-full h-10 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
