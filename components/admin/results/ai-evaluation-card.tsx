'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp, RefreshCw, Edit3 } from 'lucide-react';

export function AIEvaluationCard({ evaluation, testId, idx, onRefresh }: { evaluation: any, testId: string, idx: number, onRefresh?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideScore, setOverrideScore] = useState<string>(evaluation.pointsEarned !== null ? evaluation.pointsEarned.toString() : '');
  const [overrideFeedback, setOverrideFeedback] = useState(evaluation.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReevaluating, setIsReevaluating] = useState(false);

  React.useEffect(() => {
    setOverrideScore(evaluation.pointsEarned !== null ? evaluation.pointsEarned.toString() : '');
    setOverrideFeedback(evaluation.feedback || '');
  }, [evaluation]);

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (status === 'FAILED') return 'text-rose-700 bg-rose-50 border-rose-200';
    if (status === 'RETRYING') return 'text-amber-700 bg-amber-50 border-amber-200';
    if (status === 'SCORED') return 'text-purple-700 bg-purple-50 border-purple-200';
    return 'text-blue-700 bg-blue-50 border-blue-200';
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      'coding': 'Coding',
      'structured_response': 'Structured',
      'open_text': 'Open Text'
    };
    return map[type] || type.replace('_', ' ');
  };

  const getResultInfo = (evaluation: any) => {
    const aiStatus = evaluation.rawResponse?.evaluationStatus || evaluation.rawResponse?.codingEvaluationStatus;
    if (aiStatus === 'Correct') {
      return { text: 'Correct', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (aiStatus === 'Partially Correct') {
      return { text: 'Partially Correct', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (aiStatus === 'Incorrect') {
      return { text: 'Incorrect', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    
    // Fallback
    return evaluation.isCorrect 
      ? { text: 'Correct', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      : { text: 'Incorrect', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/tests/${testId}/reevaluate`, {
        questionId: evaluation.questionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Re-evaluation queued successfully. Please refresh in a moment.');
    } catch (error) {
      alert('Failed to re-evaluate');
    } finally {
      setIsReevaluating(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideScore) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/results/${testId}/override`, {
        questionId: evaluation.questionId,
        newScore: Number(overrideScore),
        feedback: overrideFeedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOverriding(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert('Failed to override score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-gray-500 uppercase">Q{idx + 1}</div>
          <div className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 uppercase tracking-wider">
            {getTypeBadge(evaluation.type)}
          </div>
          <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getStatusColor(evaluation.status)}`}>
            {evaluation.status || 'PENDING'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evaluation.section !== 'ELIGIBILITY' && (
            <div className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 flex items-center h-8">
              Score: {evaluation.pointsEarned !== null ? evaluation.pointsEarned : '?'} / {evaluation.maxPoints}
            </div>
          )}
          {evaluation.section !== 'ELIGIBILITY' && (
            <Button variant="outline" size="sm" onClick={() => setIsOverriding(!isOverriding)} className="h-8 text-xs font-bold text-slate-600 bg-white border-slate-200 hover:bg-slate-50">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Override
            </Button>
          )}
          {evaluation.section !== 'ELIGIBILITY' && evaluation.status !== 'SCORED' && (
            <Button variant="outline" size="sm" onClick={handleReevaluate} disabled={isReevaluating} className="h-8 text-xs font-bold text-slate-600 bg-white border-slate-200 hover:bg-slate-50">
              {isReevaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
              Re-evaluate
            </Button>
          )}
        </div>
      </div>

      {isOverriding && (
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-600 block mb-1">New Score (Max {evaluation.maxPoints})</label>
            <input 
              type="number" 
              className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
              value={overrideScore} 
              onChange={(e) => setOverrideScore(e.target.value)} 
              max={evaluation.maxPoints}
            />
          </div>
          <div className="flex-[3]">
            <label className="text-xs font-bold text-slate-600 block mb-1">Edit AI Feedback (Optional)</label>
            <textarea 
              className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y min-h-[40px]" 
              value={overrideFeedback} 
              onChange={(e) => setOverrideFeedback(e.target.value)} 
              placeholder="Edit the feedback shown to the student..."
            />
          </div>
          <Button onClick={handleOverride} disabled={isSubmitting || overrideScore === ''} className="h-9">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save
          </Button>
        </div>
      )}

      <div className="mb-4">
        <MarkdownRenderer content={evaluation.question || 'No question text available.'} />
      </div>

      <div className="mb-4">
        {evaluation.type === 'coding' && (
          <div className="flex gap-4 mb-3">
            <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              Language: <span className="text-gray-900 font-mono">{evaluation.rawResponse?.detectedLanguage || 'Unknown'}</span>
            </div>
          </div>
        )}
        {evaluation.status === 'COMPLETED' && (
          <div className="flex gap-4 mb-3">
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${getResultInfo(evaluation).color}`}>
              Result: {getResultInfo(evaluation).text}
            </div>
          </div>
        )}
        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Student's Answer</div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
          {evaluation.studentAnswer || '// No answer provided'}
        </pre>
      </div>

      {evaluation.status === 'COMPLETED' && (
        <div className="mt-4 border border-indigo-100 rounded-lg overflow-hidden">
          <div 
            className="bg-indigo-50/80 p-3 flex justify-between items-center cursor-pointer hover:bg-indigo-100/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h5 className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              AI Evaluation Feedback
            </h5>
            <div className="flex items-center gap-3">
              {evaluation.modelUsed && (
                <span className="text-[10px] bg-indigo-200/50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  {evaluation.modelUsed}
                </span>
              )}
              {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-700" /> : <ChevronDown className="w-4 h-4 text-indigo-700" />}
            </div>
          </div>
          
          {isExpanded && (
            <div className="p-4 bg-white border-t border-indigo-100 space-y-4">
              <div>
                <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider block mb-1">Feedback</span>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">
                  {evaluation.feedback || 'No detailed feedback provided.'}
                </p>
              </div>

              {evaluation.type === 'coding' && ((evaluation.strengths && evaluation.strengths.length > 0) || (evaluation.mistakes && evaluation.mistakes.length > 0) || (evaluation.suggestions && evaluation.suggestions.length > 0)) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      <span className="font-bold text-emerald-800 text-xs uppercase tracking-wider block mb-2">Strengths</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.strengths.map((str: string, i: number) => (
                          <li key={i} className="text-emerald-700 text-sm">{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.mistakes && evaluation.mistakes.length > 0 && (
                    <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                      <span className="font-bold text-rose-800 text-xs uppercase tracking-wider block mb-2">Mistakes</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.mistakes.map((mistake: string, i: number) => (
                          <li key={i} className="text-rose-700 text-sm">{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                    <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                      <span className="font-bold text-amber-800 text-xs uppercase tracking-wider block mb-2">Suggestions</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.suggestions.map((sug: string, i: number) => (
                          <li key={i} className="text-amber-700 text-sm">{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : ((evaluation.strengths && evaluation.strengths.length > 0) || (evaluation.improvements && evaluation.improvements.length > 0) || (evaluation.rawResponse?.weaknesses && evaluation.rawResponse.weaknesses.length > 0) || (evaluation.rawResponse?.deductionReasons && evaluation.rawResponse.deductionReasons.length > 0)) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      <span className="font-bold text-emerald-800 text-xs uppercase tracking-wider block mb-2">Strengths</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.strengths.map((str: string, i: number) => (
                          <li key={i} className="text-emerald-700 text-sm">{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.rawResponse?.weaknesses && evaluation.rawResponse.weaknesses.length > 0 && (
                    <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                      <span className="font-bold text-orange-800 text-xs uppercase tracking-wider block mb-2">Weaknesses</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.rawResponse.weaknesses.map((weak: string, i: number) => (
                          <li key={i} className="text-orange-700 text-sm">{weak}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.rawResponse?.deductionReasons && evaluation.rawResponse.deductionReasons.length > 0 && (
                    <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                      <span className="font-bold text-rose-800 text-xs uppercase tracking-wider block mb-2">Deduction Reasons</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.rawResponse.deductionReasons.map((reason: string, i: number) => (
                          <li key={i} className="text-rose-700 text-sm">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                      <span className="font-bold text-indigo-800 text-xs uppercase tracking-wider block mb-2">Suggestions</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {evaluation.improvements.map((imp: string, i: number) => (
                          <li key={i} className="text-indigo-700 text-sm">{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {evaluation.status === 'FAILED' && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <h5 className="font-bold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            AI Evaluation Failed
          </h5>
          <p className="text-rose-700 text-xs font-mono">{JSON.stringify(evaluation.rawResponse) || 'Unknown Error'}</p>
        </div>
      )}
    </div>
  );
}
