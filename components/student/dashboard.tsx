'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { toast } from 'react-hot-toast';
import { User, Clock, FileText, Layers, BadgeCheck, Play, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/common/BrandLogo';

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
          window.location.href = '/student/profile';
          return;
        }
        throw err;
      }

      const testsRes = await axios.get('/api/tests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (testsRes.data.tests && testsRes.data.tests.length > 0) {
        setTests(testsRes.data.tests);
      } else {
        // Automatically initialize assessment
        await axios.get('/api/tests/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refetch = await axios.get('/api/tests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTests(refetch.data.tests || []);
      }
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
          <div className="flex items-center gap-2">
            <BrandLogo size="md" className="items-start flex-row items-center" />
            <span className="font-extrabold text-slate-400 tracking-tight ml-2">| Candidate Portal</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center text-slate-500 font-medium">
            No assessment available at this time.
          </div>
        ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Meta Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" /> Duration
                </div>
                <p className="text-base font-semibold text-slate-900">{tests[0].totalDuration || 60} Minutes</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <FileText className="w-4 h-4 text-slate-400" /> Questions
                </div>
                <p className="text-base font-semibold text-slate-900">{tests[0].totalQuestions || 29}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Layers className="w-4 h-4 text-slate-400" /> Format
                </div>
                <p className="text-base font-semibold text-slate-900">Mixed Sections</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <BadgeCheck className="w-4 h-4 text-slate-400" /> Status
                </div>
                <div>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Completed
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Action Area */}
            <div>
              {isCompleted ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-700">You have successfully submitted this assessment. The recruitment team will review your results.</p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsLoading(true);
                    window.location.href = `/student/test/${tests[0].id}`;
                  }}
                  className="h-10 px-5 py-2 w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isInProgress ? 'Resume Assessment' : 'Start Assessment'}
                  {isInProgress ? <ArrowRight className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
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
