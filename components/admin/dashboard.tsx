'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ClipboardList, Target, AlertTriangle, Folder, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('[Analytics Load Error]', error);
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
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Campus<span className="text-blue-600 font-semibold">Screen</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold ml-1 uppercase tracking-wider">
              Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-bold font-mono uppercase bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
              Admin Mode
            </span>
            <Link href="/admin/profile" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white text-slate-700 hover:bg-slate-50 hover:text-rose-600 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Console Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Welcome back, {user?.email}</p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center text-xl font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Students</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics?.totalStudents || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl font-bold">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tests</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics?.totalTests || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-bold">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average score</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics?.averageScore || 0} Pts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Violations flagged</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{analytics?.totalViolations || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Console Nav Modules */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-left">Management Workspaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link href="/admin/questions">
              <Card className="hover:shadow-md hover:border-slate-350 transition cursor-pointer h-full border border-slate-200/80 rounded-2xl bg-white text-left group">
                <CardHeader className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Folder className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-extrabold text-slate-900">Question Bank</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                    central Question repository to create, edit, and import MCQ or coding questions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/test-settings">
              <Card className="hover:shadow-md hover:border-slate-350 transition cursor-pointer h-full border border-slate-200/80 rounded-2xl bg-white text-left group">
                <CardHeader className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Settings className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-extrabold text-slate-900">Test Settings</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Configure the master aptitude test duration and limits.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/students">
              <Card className="hover:shadow-md hover:border-slate-350 transition cursor-pointer h-full border border-slate-200/80 rounded-2xl bg-white text-left group">
                <CardHeader className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Eye className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-extrabold text-slate-900">Student Directory</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Monitor candidate registrations, live test attempts, scorecard logs, and violations.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>


          </div>
        </div>
      </main>
    </div>
  );
}
