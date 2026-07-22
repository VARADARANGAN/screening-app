'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';

interface Test {
  id: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'evaluated';
  totalDuration: number;
  score?: number;
  totalQuestions?: number;
  createdAt: string;
  results_published?: boolean;
}

interface Student {
  id: string;
  fullName: string;
  usn: string;
  branch: string;
  college: string;
}

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      let studentData;
      try {
        const studentRes = await axios.get('/api/students/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        studentData = studentRes.data.student;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Profile not created yet, redirect to profile page
          window.location.href = '/student/profile';
          return;
        }
        throw err;
      }

      const testsRes = await axios.get('/api/tests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudent(studentData);
      setTests(testsRes.data.tests || []);
    } catch (error: any) {
      console.error('[Dashboard Load Error]', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Campus<span className="text-blue-600 font-semibold">Screen</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold ml-1 uppercase tracking-wider">
              Student
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-bold font-mono uppercase bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
              {student?.usn || 'N/A'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-rose-50 text-rose-700 hover:bg-rose-100/70 border border-rose-100 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Welcome back, {student?.fullName}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>👤</span> Candidate Profile
            </h2>
            <Link
              href="/student/profile"
              className="text-xs bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 font-bold px-3 py-1.5 rounded-lg border border-indigo-100 transition"
            >
              Edit Profile
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">FullName</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{student?.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{student?.branch}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{student?.college}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Reference</p>
              <p className="text-sm font-semibold text-blue-600 mt-0.5 font-mono truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Available Tests Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>📝</span> Available Drive Assessments
            </h2>
          </div>

          {tests.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-3xl">☕</span>
              <p className="text-xs text-slate-400 font-semibold">No recruitment drives assigned to your branch currently</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tests.map((test) => {
                const isCompleted = test.status === 'submitted' || test.status === 'evaluated' || test.status === 'auto_submitted';
                return (
                  <div
                    key={test.id}
                    className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/30 transition px-2 rounded-xl"
                  >
                    <div className="text-left space-y-1">
                      <h3 className="text-sm font-bold text-slate-850">
                        Campus Recruitment Assessment – {student?.branch || 'General'} 2027
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <span>Duration: <strong className="text-slate-650">{test.totalDuration} mins</strong></span>
                        <span>•</span>
                        <span>Assigned: <strong className="text-slate-650 font-mono text-[10px]">{new Date(test.createdAt).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : test.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {test.status === 'not_started' ? 'Not Started' : isCompleted ? 'Submitted' : 'In Progress'}
                      </span>
                      {test.results_published && test.score !== undefined && test.score !== null && (
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-mono">
                          Score: {test.totalQuestions ? `${test.score} / ${test.totalQuestions}` : `${test.score}`}
                        </span>
                      )}
                      {test.status === 'not_started' ? (
                        <Link
                          href={`/student/test/${test.id}`}
                          className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                        >
                          Start Test
                        </Link>
                      ) : test.status === 'in_progress' ? (
                        <Link
                          href={`/student/test/${test.id}`}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                        >
                          Resume Test
                        </Link>
                      ) : test.results_published ? (
                        <Link
                          href={`/student/test/${test.id}/results`}
                          className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
                        >
                          View Results
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
