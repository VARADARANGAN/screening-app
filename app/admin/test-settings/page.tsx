'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TestSettingsPage() {
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState(30);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      
      try {
        const configRes = await axios.get('/api/admin/test-settings', { headers: { Authorization: `Bearer ${token}` } });
        if (configRes.data.config) {
          setDuration(configRes.data.config.total_duration);
          setQuestions(configRes.data.config.total_questions);
        }
      } catch (err) {
        console.error('Failed to load config', err);
      }

      try {
        const statsRes = await axios.get('/api/questions/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (statsRes.data) {
          setAvailableQuestions(statsRes.data.total || 0);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    } catch (err) {
      console.error('Failed to load config', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions > availableQuestions) {
      setMessage('Cannot save: Requested questions exceed available questions in the bank.');
      return;
    }
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
      {/* Top Navbar / Back Button */}
      <div className="mb-2 flex items-center">
        <Link href="/admin/dashboard">
          <Button variant="outline" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center border-none">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Test Settings</h1>
          <p className="text-xs text-slate-500 font-medium">Configure the global aptitude test duration and limits.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
          <div className="bg-blue-50/80 p-2.5 rounded-xl text-blue-600 border border-blue-100/50">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Available Questions</p>
            <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{availableQuestions}</p>
          </div>
        </div>
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
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition text-sm font-medium ${questions > availableQuestions ? 'border-rose-300 focus:ring-rose-600/20 focus:border-rose-600 text-rose-800' : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600 text-slate-800'}`}
                />
                
                {/* Validation Display */}
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold px-1">
                    <span className={questions > availableQuestions ? 'text-rose-600' : 'text-slate-600'}>
                      {questions} / {availableQuestions} Questions Selected
                    </span>
                  </div>
                  
                  {questions > availableQuestions && (
                    <div className="flex items-start gap-2 text-xs font-medium text-rose-600 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Not enough questions in the Question Bank. Please reduce the number or add more questions.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer">
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
