'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

const SectionScoreCard = ({
  sectionName, marksObtained, totalMarks, isCompleted
}: {
  sectionName: string, marksObtained: number, totalMarks: number, isCompleted: boolean
}) => {
  return (
    <div className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-gray-800">{sectionName}</span>
        {isCompleted && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-100">Completed</span>
        )}
      </div>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-black text-gray-900">{marksObtained}</span>
        <span className="text-sm font-bold text-gray-500 mb-1">/ {totalMarks} Marks</span>
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
      {/* Top Navbar / Back Button */}
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/admin/results');
            }
          }}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center cursor-pointer border-none"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
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
            <CardTitle>Assessment Sections</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.scores?.sectionScores?.map((sec: any, idx: number) => (
                <SectionScoreCard
                  key={idx}
                  sectionName={sec.sectionName}
                  marksObtained={sec.marksObtained}
                  totalMarks={sec.totalMarks}
                  isCompleted={sec.isCompleted}
                />
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex flex-col p-6 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
                <span className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">Overall Assessment Score</span>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-blue-700">{data.scores?.overallScore || 0}</span>
                  <span className="text-lg font-bold text-blue-400 mb-1.5">/ {data.scores?.overallTotalMarks || 0} Marks</span>
                </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
      {/* Ranking Responses Section */}
      {data.rankingAnswers && data.rankingAnswers.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Ranking Responses</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {data.rankingAnswers.map((answer: any, idx: number) => {
              let parsedAnswers: Record<string, number> = {};
              let correctOrder: string[] = [];
              try {
                if (answer.studentAnswer) {
                  parsedAnswers = JSON.parse(answer.studentAnswer);
                }
                if (answer.correctAnswer) {
                  correctOrder = JSON.parse(answer.correctAnswer);
                }
              } catch (e) {
                console.error("Failed to parse student answer for ranking response", e);
              }

              const studentSortedKeys = Object.keys(parsedAnswers).sort((a, b) => parsedAnswers[a] - parsedAnswers[b]);

              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-sm font-bold text-gray-500 uppercase">Ranking Response {idx + 1}</div>
                    <div className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      Score: {answer.pointsEarned !== null ? answer.pointsEarned : '0'} / {answer.maxPoints}
                    </div>
                  </div>
                  <div className="mb-6">
                    <MarkdownRenderer content={answer.question || 'No question text available.'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Student's Order</h4>
                      <div className="space-y-2">
                        {studentSortedKeys.length > 0 ? studentSortedKeys.map((item, i) => (
                          <div key={i} className="flex gap-3 items-center bg-slate-50 p-2 px-3 rounded-lg border border-slate-100">
                            <span className="font-bold text-slate-400 w-4">{i + 1}.</span>
                            <span className="font-semibold text-slate-700">{item}</span>
                          </div>
                        )) : (
                          <div className="text-sm italic text-slate-400">No response provided</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-600 uppercase mb-3">Correct Order</h4>
                      <div className="space-y-2">
                        {correctOrder.map((item, i) => (
                          <div key={i} className="flex gap-3 items-center bg-emerald-50/50 p-2 px-3 rounded-lg border border-emerald-100">
                            <span className="font-bold text-emerald-400 w-4">{i + 1}.</span>
                            <span className="font-semibold text-emerald-800">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
