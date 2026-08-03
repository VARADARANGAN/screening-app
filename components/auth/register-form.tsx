'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { AlertTriangle, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    setApiError('');
    try {
      const user = await registerUser(data.email, data.password, data.confirmPassword, 'student');
      router.push('/student/profile');
    } catch (error: any) {
      setApiError(error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      <div className="text-center flex flex-col items-center pb-2">
        <BrandLogo showTagline size="lg" />
      </div>

      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
          <AlertTriangle className="w-4 h-4 inline-block mr-1" /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Email Address
          </label>
          <Input
            {...register('email')}
            type="email"
            className="w-full text-slate-900 placeholder:text-slate-400 bg-white border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 caret-blue-600 h-11 rounded-lg text-sm font-medium"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Password
          </label>
          <div className="relative">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full pr-10 text-slate-900 placeholder:text-slate-400 bg-white border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 caret-blue-600 h-11 rounded-lg text-sm font-medium"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full pr-10 text-slate-900 placeholder:text-slate-400 bg-white border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 caret-blue-600 h-11 rounded-lg text-sm font-medium"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition mt-2 cursor-pointer"
        >
          {isSubmitting ? 'Registering Account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
