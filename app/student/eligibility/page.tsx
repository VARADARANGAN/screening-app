'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DriveConfig {
  id: string;
  name: string;
  requires_cgpa: boolean;
  requires_backlogs: boolean;
  requires_branch: boolean;
  requires_grad_year: boolean;
  requires_work_auth: boolean;
}

interface CustomQuestion {
  id: string;
  question_text: string;
  type: string;
  options_json?: string;
  is_required?: boolean;
}

export default function EligibilityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drive, setDrive] = useState<DriveConfig | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  
  // Standard Form State
  const [cgpa, setCgpa] = useState('');
  const [backlogs, setBacklogs] = useState('');
  const [branch, setBranch] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [workAuth, setWorkAuth] = useState(false);
  
  // Custom Form State
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEligibilityConfig();
  }, []);

  const fetchEligibilityConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/students/eligibility', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.skip || data.completed) {
        // No active drive or already submitted, route to active test
        return routeToTest();
      }

      setDrive(data.drive);
      setCustomQuestions(data.customQuestions || []);
    } catch (e) {
      console.error('Failed to load eligibility config', e);
      // Fallback to active test if error
      routeToTest();
    } finally {
      setIsLoading(false);
    }
  };

  const routeToTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/tests/active', { headers: { Authorization: `Bearer ${token}` }});
      router.push(`/student/test/${res.data.testId}`);
    } catch (e) {
      console.error('Failed to start test', e);
      router.push('/student/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drive) return;

    // Validate required custom fields
    for (const q of customQuestions) {
      if (q.is_required && !customResponses[q.id]) {
        return alert(`Please answer: ${q.question_text}`);
      }
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/students/eligibility', {
        hiring_drive_id: drive.id,
        cgpa,
        backlogs,
        branch,
        grad_year: gradYear,
        work_auth: workAuth,
        custom_responses: customResponses
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Proceed to the test regardless of eligibility outcome
      routeToTest();
    } catch (e) {
      console.error('Failed to submit eligibility', e);
      alert('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Eligibility Criteria...</div>;
  }

  if (!drive) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 flex justify-center items-center">
      <Card className="w-full max-w-2xl border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white">
        <div className="bg-blue-900 p-6 text-white">
          <h1 className="text-2xl font-black tracking-tight">Eligibility Assessment</h1>
          <p className="text-blue-100 text-sm mt-1">{drive.name} - Please confirm your academic details</p>
        </div>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Standard Fields mapped from drive rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {drive.requires_cgpa && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current CGPA</label>
                  <Input type="number" step="0.01" value={cgpa} onChange={e => setCgpa(e.target.value)} required className="bg-slate-50" placeholder="e.g. 8.5" />
                </div>
              )}
              {drive.requires_backlogs && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Backlogs</label>
                  <Input type="number" value={backlogs} onChange={e => setBacklogs(e.target.value)} required className="bg-slate-50" placeholder="e.g. 0" />
                </div>
              )}
              {drive.requires_branch && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Academic Branch</label>
                  <Input type="text" value={branch} onChange={e => setBranch(e.target.value)} required className="bg-slate-50" placeholder="e.g. CSE" />
                </div>
              )}
              {drive.requires_grad_year && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Graduation Year</label>
                  <Input type="number" value={gradYear} onChange={e => setGradYear(e.target.value)} required className="bg-slate-50" placeholder="e.g. 2024" />
                </div>
              )}
            </div>

            {drive.requires_work_auth && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <input type="checkbox" id="workAuth" checked={workAuth} onChange={e => setWorkAuth(e.target.checked)} className="w-5 h-5 rounded border-slate-300" />
                <label htmlFor="workAuth" className="text-sm font-semibold text-slate-800">I possess valid work authorization / government ID.</label>
              </div>
            )}

            {/* Custom Fields */}
            {customQuestions.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-slate-100 mt-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Additional Information</h3>
                {customQuestions.map(q => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
                    </label>
                    {q.type === 'mcq' || q.type === 'true_false' ? (
                      <div className="space-y-2">
                        {(JSON.parse(q.options_json || '[]')).map((opt: string, idx: number) => (
                          <label key={idx} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100 cursor-pointer">
                            <input 
                              type="radio" 
                              name={q.id} 
                              value={opt} 
                              checked={customResponses[q.id] === opt}
                              onChange={(e) => setCustomResponses({...customResponses, [q.id]: e.target.value})}
                              className="text-blue-600"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input 
                        value={customResponses[q.id] || ''}
                        onChange={(e) => setCustomResponses({...customResponses, [q.id]: e.target.value})}
                        className="bg-slate-50"
                        placeholder="Enter your answer"
                        required={q.is_required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition">
                {isSubmitting ? 'Submitting...' : 'Continue to Assessment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
