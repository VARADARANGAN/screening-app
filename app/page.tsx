'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'student') {
        router.push('/student/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-900/20">
              C
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Campus<span className="text-blue-600 font-semibold">Screen</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 font-semibold text-xs tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
            Active Placement Drives 2027
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            Next-Gen Campus <br />
            <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Assessment Platform</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl">
            A secure, automated, and comprehensive screening workspace for coding challenges, aptitude questionnaires, and placement statistics.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/auth/register"
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-900/20 transition transform hover:-translate-y-0.5"
            >
              Get Started Now
            </Link>
            <Link
              href="/auth/login"
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-3 px-8 rounded-xl shadow-sm transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="flex-1 grid sm:grid-cols-2 gap-6 w-full">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              🎓
            </div>
            <h3 className="font-bold text-slate-800 text-base">For Candidates</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take timed evaluations, select preferred languages in code playgrounds, track test history scorecard logs, and resume tests.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg font-bold">
              ⚙️
            </div>
            <h3 className="font-bold text-slate-800 text-base">For Organizers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
               central Question Repository, configure test cases and constraints, filter scores, and track active candidate progress.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
              🔒
            </div>
            <h3 className="font-bold text-slate-800 text-base">Proctoring Rules</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tab-switch restriction counters, media permissions, and instant scoring evaluator engines keep drives secure.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-lg font-bold">
              📊
            </div>
            <h3 className="font-bold text-slate-800 text-base">Placement Stats</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consolidated score summaries, branch performance stats, and leaderboard rankings provide clear insights.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-400 font-medium">
        © 2027 CampusScreen Assessment Services. All rights reserved.
      </footer>
    </main>
  );
}
