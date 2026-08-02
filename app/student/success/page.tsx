import Link from 'next/link';
import { BadgeCheck, FileCheck, Clock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Assessment Completed - Aptitude Portal',
  description: 'Assessment completion success page',
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 text-center space-y-4 border-b border-slate-100">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto shadow-inner">
            <BadgeCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Assessment Submitted
            </h1>
            <p className="text-sm text-slate-500">
              Your responses have been recorded successfully.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 space-y-3 flex-1">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Status</div>
              <div className="font-semibold text-slate-800 text-sm mt-0.5">Completed & Secured</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</div>
              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 space-y-4">
          <p className="text-xs font-semibold text-slate-500 text-center">
            You may now safely close this window or return to the portal.
          </p>
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Return to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
