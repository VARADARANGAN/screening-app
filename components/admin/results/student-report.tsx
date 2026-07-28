'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

const ProgressBar = ({ label, score }: { label: string, score: number | null }) => {
  const displayScore = score ?? 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold">{score !== null ? `${score}%` : 'N/A'}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${displayScore >= 80 ? 'bg-green-600' : displayScore >= 60 ? 'bg-yellow-500' : 'bg-red-600'}`} 
          style={{ width: `${displayScore}%` }}
        ></div>
      </div>
    </div>
  );
};

export function StudentReport() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (testId) {
      fetchReport();
    }
  }, [testId]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/admin/results/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load student report', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500 font-bold">Student report not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/results')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">Student Report</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Information */}
        <Card className="col-span-1">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase">Student Name</span>
              <span className="text-base font-medium">{data.studentName}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase">Assessment Status</span>
              <span className="text-base font-medium uppercase">{data.status}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase">Time Taken</span>
              <span className="text-base font-medium">{data.timeTaken ? `${data.timeTaken} mins` : 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase">Submission Time</span>
              <span className="text-base font-medium">{data.submissionTime ? new Date(data.submissionTime).toLocaleString() : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <Card className="col-span-2">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Assessment Scores</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <ProgressBar label="Aptitude" score={data.scores.aptitudeScore} />
              <ProgressBar label="Coding" score={data.scores.codingScore} />
            </div>
            <div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <ProgressBar label="OVERALL SCORE" score={data.scores.overallScore} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coding Answers Section */}
      {data.codingAnswers && data.codingAnswers.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Submitted Coding Answers</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {data.codingAnswers.map((answer: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm font-bold text-gray-500 uppercase">Challenge {idx + 1}</div>
                  <div className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    Score: {answer.pointsEarned !== null ? answer.pointsEarned : 'Pending'} / {answer.maxPoints}
                  </div>
                </div>
                <div className="mb-4">
                  <MarkdownRenderer content={answer.question || 'No question text available.'} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">Student's Code</div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {answer.studentAnswer || '// No code submitted'}
                  </pre>
                </div>
                
                {answer.aiEvaluation && answer.aiEvaluation.evaluation_status === 'COMPLETED' && (
                  <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3">
                    <h5 className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      AI Evaluation Breakdown
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-indigo-900">Detected Language:</span>{' '}
                        <span className="text-indigo-800 font-mono">
                          {answer.aiEvaluation.detected_language || answer.aiEvaluation.detectedLanguage || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-indigo-900">Status:</span>{' '}
                        <span className={`font-bold ${answer.pointsEarned !== null && Number(answer.pointsEarned) > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {answer.pointsEarned !== null && Number(answer.pointsEarned) > 0 ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-900 text-xs block">AI Feedback:</span>
                      <p className="text-indigo-800 text-xs mt-0.5">
                        {answer.aiEvaluation.ai_feedback || answer.aiEvaluation.feedback || 'No feedback provided.'}
                      </p>
                    </div>
                    {(answer.aiEvaluation.deduction_reason || answer.aiEvaluation.deductions) && (
                      <div>
                        <span className="font-semibold text-rose-700 text-xs block">Deduction Reason:</span>
                        <p className="text-rose-600 text-xs mt-0.5">
                          {answer.aiEvaluation.deduction_reason || answer.aiEvaluation.deductions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {answer.aiEvaluation && (answer.aiEvaluation.evaluation_status === 'FAILED' || answer.aiEvaluation.evaluationStatus === 'failed') && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <h5 className="font-bold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      AI Evaluation Failed
                    </h5>
                    <p className="text-rose-700 text-xs font-mono">{answer.aiEvaluation.error || 'Unknown Error'}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Structured Responses Section */}
      {data.structuredAnswers && data.structuredAnswers.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Structured Responses</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {data.structuredAnswers.map((answer: any, idx: number) => {
              let parsedAnswers: Record<string, string> = {};
              try {
                if (answer.studentAnswer) {
                  parsedAnswers = JSON.parse(answer.studentAnswer);
                }
              } catch (e) {
                console.error("Failed to parse student answer for structured response", e);
              }

              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-sm font-bold text-gray-500 uppercase">Response {idx + 1}</div>
                    <div className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      Score: {answer.pointsEarned !== null ? answer.pointsEarned : 'Pending'} / {answer.maxPoints}
                    </div>
                  </div>
                  <div className="mb-6">
                    <MarkdownRenderer content={answer.question || 'No question text available.'} />
                  </div>
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    {answer.fields.map((field: any, fieldIdx: number) => {
                      const isObj = typeof field === 'object' && field !== null;
                      const label = isObj ? field.label : String(field);
                      
                      return (
                        <div key={fieldIdx}>
                          <div className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</div>
                          <div className="bg-slate-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap border border-slate-100">
                            {parsedAnswers[label] || <span className="italic text-gray-400">No response provided</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Structured Plan Section */}
      {data.structuredPlanAnswers && data.structuredPlanAnswers.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Structured Plans</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {data.structuredPlanAnswers.map((answer: any, idx: number) => {
              let parsedAnswers: Record<string, string> = {};
              try {
                if (answer.studentAnswer) {
                  parsedAnswers = JSON.parse(answer.studentAnswer);
                }
              } catch (e) {
                console.error("Failed to parse student answer for structured plan", e);
              }

              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-sm font-bold text-gray-500 uppercase">Plan {idx + 1}</div>
                    <div className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      Score: {answer.pointsEarned !== null ? answer.pointsEarned : 'Pending'} / {answer.maxPoints}
                    </div>
                  </div>
                  <div className="mb-6">
                    <MarkdownRenderer content={answer.question || 'No question text available.'} />
                  </div>
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    {answer.labels.map((label: string, fieldIdx: number) => (
                      <div key={fieldIdx}>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</div>
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap border border-slate-100">
                          {parsedAnswers[label] || <span className="italic text-gray-400">No response provided</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
