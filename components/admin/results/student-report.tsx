'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Loader2, ArrowLeft, User, Clock, Calendar, CheckCircle, GraduationCap, Shield } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { AIEvaluationCard } from './ai-evaluation-card';

const SectionScoreCard = ({
  sectionName, marksObtained, totalMarks, isCompleted
}: {
  sectionName: string, marksObtained: number, totalMarks: number, isCompleted: boolean
}) => {
  const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
  return (
    <Card className="flex flex-col p-4 bg-white border-slate-200 shadow-sm h-[90px] justify-between">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Shield className="w-4 h-4 text-slate-400" />
          {sectionName}
        </div>
        {isCompleted && (
          <Badge variant="secondary" className="text-[10px] uppercase text-emerald-700 bg-emerald-50 border-emerald-200">Completed</Badge>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 mt-2">
        <Progress value={percentage} className="h-1.5 flex-1 bg-slate-100 [&>div]:bg-blue-600" />
        <div className="text-sm font-bold text-slate-700 whitespace-nowrap">
          {marksObtained} <span className="text-slate-400 font-medium">/ {totalMarks}</span>
        </div>
      </div>
    </Card>
  );
};

export function StudentReport() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSection, setOpenSection] = useState<number>(0);

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
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500 font-bold">Student report not found.</div>;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Navbar / Back Button */}
      <div className="mb-2 flex items-center">
        <Button
          variant="outline"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/admin/results');
            }
          }}
          className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition flex items-center h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Student Information */}
        <Card className="col-span-1 md:col-span-4 rounded-xl shadow-sm border-slate-200">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"><User className="w-3.5 h-3.5" /> Student</span>
                <span className="text-sm font-medium text-slate-900">{data.studentName}</span>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"><CheckCircle className="w-3.5 h-3.5" /> Status</span>
                <span className="text-sm font-medium text-slate-900 uppercase">{data.status}</span>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"><Clock className="w-3.5 h-3.5" /> Time Taken</span>
                <span className="text-sm font-medium text-slate-900">{data.timeTaken ? `${data.timeTaken} min` : 'N/A'}</span>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"><Calendar className="w-3.5 h-3.5" /> Submitted</span>
                <span className="text-sm font-medium text-slate-900">{data.submissionTime ? new Date(data.submissionTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <Card className="col-span-1 md:col-span-8 rounded-xl shadow-sm border-slate-200">
          <CardContent className="p-5">
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
              <Card className="flex flex-col p-4 bg-blue-50/50 border-blue-100 shadow-sm h-[90px] justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Overall Score</span>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-blue-700 leading-none">{data.scores?.overallScore || 0}</span>
                  <span className="text-sm font-bold text-blue-400 mb-0.5">/ {data.scores?.overallTotalMarks || 0}</span>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Evaluations Grouped by Section */}
      {data.aiEvaluationsBySection && data.aiEvaluationsBySection.length > 0 && (
        <div className="mt-6">
          <Accordion>
            {data.aiEvaluationsBySection.map((section: any, secIdx: number) => {
              const avgScore = section.evaluations.length > 0 
                ? (section.evaluations.reduce((acc: number, curr: any) => acc + (curr.pointsEarned || 0), 0) / section.evaluations.length).toFixed(1) 
                : '0';

              return (
                <AccordionItem key={secIdx} className="mb-4">
                  <AccordionTrigger 
                    isOpen={openSection === secIdx} 
                    onClick={() => setOpenSection(openSection === secIdx ? -1 : secIdx)}
                  >
                    <div className="flex items-center gap-4 text-slate-800">
                      <span>{section.sectionName}</span>
                      <Badge variant="secondary" className="font-medium text-[10px] text-slate-500">
                        {section.evaluations.length} Questions
                      </Badge>
                      {section.sectionName !== 'ELIGIBILITY' && (
                        <span className="text-xs font-semibold text-slate-400">Avg: {avgScore}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent isOpen={openSection === secIdx} className="bg-slate-50/50">
                    <div className="space-y-4">
                      {section.evaluations.map((evaluation: any, idx: number) => (
                        <AIEvaluationCard 
                          key={`${evaluation.questionId}-${idx}`} 
                          idx={idx} 
                          evaluation={evaluation} 
                          testId={testId} 
                          onRefresh={fetchReport}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
