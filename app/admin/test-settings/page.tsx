'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TestSettingsPage() {
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/test-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.config) {
        setDuration(res.data.config.total_duration);
        setQuestions(res.data.config.total_questions);
      }
    } catch (err) {
      console.error('Failed to load config', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/test-settings', 
        { total_duration: duration, total_questions: questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Test Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading Settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Test Settings</h1>
          <p className="text-xs text-slate-500 font-medium">Configure the global aptitude test duration and limits.</p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline" className="flex items-center gap-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <CardTitle className="text-lg font-extrabold text-slate-900">Configuration</CardTitle>
          <CardDescription className="text-xs text-slate-500 font-medium mt-1">
            These settings apply to every student who logs in and takes the assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            {message && (
              <div className={`p-3.5 text-xs font-semibold rounded-xl ${message.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Test Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
                />
                <p className="text-[10px] text-slate-400 font-medium">The countdown timer starts as soon as the test begins.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={questions}
                  onChange={(e) => setQuestions(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-slate-800 transition"
                />
                <p className="text-[10px] text-slate-400 font-medium">Limits the number of questions pulled from the active Question Bank.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSaving} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-900/10 transition cursor-pointer">
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
