'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { toast } from 'react-hot-toast';
import { User } from 'lucide-react';
import Link from 'next/link';

interface Test {
  id: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'evaluated' | 'auto_submitted';
  totalDuration: number;
  score?: number;
  totalQuestions?: number;
  createdAt: string;
  results_published?: boolean;
}

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      try {
        await axios.get('/api/students/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Profile not created yet, redirect to profile page immediately
          window.location.href = '/student/profile';
          return;
        }
        throw err;
      }

      const testsRes = await axios.get('/api/tests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTests(testsRes.data.tests || []);
    } catch (error: any) {
      console.error('[Dashboard Load Error]', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const handleGenerateAssessment = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.get('/api/tests/active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // After generation, reload dashboard data to see the new test
      await loadDashboardData();
    } catch (error: any) {
      console.error('[Generate Assessment Error]', error);
      toast.error(error.response?.data?.message || 'Failed to generate assessment. Please ensure there are published questions available.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl mb-4"></div>
          <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">Loading Portal...</div>
        </div>
      </div>
    );
  }

  const isCompleted = tests.length > 0 && ['submitted', 'evaluated', 'auto_submitted'].includes(tests[0].status);
  const isInProgress = tests.length > 0 && tests[0].status === 'in_progress';

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      {/* ATS Minimalist Navbar */}
      <nav className="bg-white border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">Candidate Portal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/student/profile" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <User className="w-4 h-4" />
              My Profile
            </Link>
            <span className="text-sm font-medium text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Focus Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col justify-center">
        
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Current Assessment</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Round 1 Assessment</h1>
        </div>

        {/* Primary Assessment Card */}
        {tests.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Ready to begin?</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your assessment has not been generated yet. Click the button below to dynamically build your customized aptitude and coding test.
              </p>
            </div>
            <button
              onClick={handleGenerateAssessment}
              disabled={isGenerating}
              className="mx-auto w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold text-base px-10 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200"
            >
              {isGenerating ? 'Generating Assessment...' : 'Initialize My Assessment'}
              {!isGenerating && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            </button>
          </div>
        ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 md:p-10 space-y-8">
            
            {/* Meta Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Duration</p>
                <p className="text-lg font-semibold text-slate-900">{tests[0].totalDuration || 60} Minutes</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Questions</p>
                <p className="text-lg font-semibold text-slate-900">{tests[0].totalQuestions || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Format</p>
                <p className="text-lg font-semibold text-slate-900">Mixed Sections</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                {isCompleted ? (
                   <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Completed
                   </span>
                ) : isInProgress ? (
                   <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     In Progress
                   </span>
                ) : (
                   <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                     Available
                   </span>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Action Area */}
            <div>
              {isCompleted ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                  <h3 className="font-bold text-slate-800 mb-2">Assessment Completed</h3>
                  <p className="text-sm text-slate-500">You have successfully submitted this assessment. The recruitment team will review your results and contact you regarding the next steps.</p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsLoading(true);
                    window.location.href = `/student/test/${tests[0].id}`;
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-10 py-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isInProgress ? 'Resume Assessment' : 'Start Assessment'}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              )}
            </div>
            
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
