'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { AIEvaluationCard } from './ai-evaluation-card';

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

      {/* AI Evaluations Grouped by Section */}
      {data.aiEvaluationsBySection && data.aiEvaluationsBySection.length > 0 && (
        <div className="space-y-8 mt-8">
          {data.aiEvaluationsBySection.map((section: any, secIdx: number) => (
            <Card key={secIdx}>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>{section.sectionName}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {section.evaluations.map((evaluation: any, idx: number) => (
                  <AIEvaluationCard 
                    key={`${evaluation.questionId}-${idx}`} 
                    idx={idx} 
                    evaluation={evaluation} 
                    testId={testId} 
                    onRefresh={fetchReport}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
