'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudentProfileSchema, StudentProfileInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export function ProfileForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const [branches, setBranches] = useState<Array<{id: string, name: string}>>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: {
      cameraPermission: false,
      microphonePermission: false,
    },
  });

  // Check camera and microphone permissions and fetch existing profile
  useEffect(() => {
    checkMediaPermissions();
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
        reset({
          fullName: response.data.student.fullName,
          phone: response.data.student.phone,
          college: response.data.student.college,
          usn: response.data.student.usn,
          branchName: response.data.student.branchName || '',
          cameraPermission: true,
          microphonePermission: true,
        });
      }
    } catch (error) {
      // Ignore 404 errors as they just mean the profile isn't created yet
    }
  };

  const checkMediaPermissions = async () => {
    try {
      // Check camera
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('allowed');
      cameraStream.getTracks().forEach((track) => track.stop());
    } catch {
      setCameraStatus('denied');
    }

    try {
      // Check microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('allowed');
      audioStream.getTracks().forEach((track) => track.stop());
    } catch {
      setMicStatus('denied');
    }
  };

  const onSubmit = async (data: StudentProfileInput) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/students/profile', {
        ...data,
        cameraPermission: true,
        microphonePermission: true
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/student/dashboard');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEditing ? 'Edit Profile Details' : 'Complete Student Profile'}</h2>
        <p className="text-xs text-slate-500 font-medium">Please enter your academic information accurately for placement matching</p>
      </div>

      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input
              {...register('fullName')}
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
            <input
              {...register('phone')}
              type="tel"
              maxLength={10}
              onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
              placeholder="9876543210"
            />
            {errors.phone && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">College Name</label>
            <input
              {...register('college')}
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
              placeholder="RV College of Engineering"
            />
            {errors.college && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.college.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">USN / Roll Number</label>
            <input
              {...register('usn')}
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
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
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-semibold text-slate-700 transition"
            placeholder="Computer Science, Mechanical, etc."
          />
          {errors.branchName && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.branchName.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-900/10 transition mt-4 cursor-pointer"
        >
          {isSubmitting ? 'Saving Details...' : (isEditing ? 'Save Changes' : 'Complete Registration')}
        </Button>
      </form>
    </div>
  );
}
