import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Test Submitted - Aptitude Portal',
  description: 'Test submission success page',
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-4xl mx-auto shadow-inner shadow-emerald-100">
          ✅
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Test Submitted Successfully
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Your aptitude assessment has been recorded. Thank you for participating.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            You may now close this window
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-6 py-2.5 rounded-xl transition cursor-pointer"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
