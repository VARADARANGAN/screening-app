'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

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
              <span className="text-base font-medium">{data.timeTaken ? `${Math.round(data.timeTaken / 60)} mins` : 'N/A'}</span>
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
    </div>
  );
}
