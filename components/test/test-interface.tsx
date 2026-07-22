'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Question {
  id: string;
  questionText: string;
  type: 'mcq' | 'coding' | 'essay' | 'true_false';
  optionsJson?: any;
  points: number;
  timeLimitSeconds: number;
}

interface TestData {
  id: string;
  totalDuration: number;
  questions: Question[];
  status: string;
}

export function TestInterface({ testId }: { testId: string }) {
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Security and execution state
  const submittingRef = useRef(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Record<string, string>>({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (test && timeRemaining > 0 && !showInstructions) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (test && timeRemaining === 0 && !showInstructions && (test.status === 'in_progress' || test.status === 'not_started')) {
      submitTest(true);
    }
  }, [timeRemaining, test, showInstructions]);

  // Monitor for cheating attempts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Tab switched away');
        setShowWarning(true);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('Right-click attempted');
    };

    const handleCopy = (e: ClipboardEvent) => {
      // Allow copy/paste generally unless they are focusing inside textarea for coding
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'TEXTAREA' && activeEl.classList.contains('coding-textarea')) {
        e.preventDefault();
        recordViolation('Copy attempted in editor');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  const loadTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const t = response.data.test;
      setTest(t);
      setTimeRemaining(t.total_duration * 60);

      if (t.status !== 'not_started') {
        setShowInstructions(false);
      }
    } catch (error) {
      console.error('[Test Load Error]', error);
    }
  };

  const handleStartTest = async () => {
    try {
      // Request camera & microphone
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());

      // Update status to in_progress in database
      const token = localStorage.getItem('token');
      await axios.patch(`/api/tests/${testId}`, {
        status: 'in_progress'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTest(prev => prev ? { ...prev, status: 'in_progress' } : null);
      setShowInstructions(false);
    } catch (err) {
      alert('Camera and Microphone permissions are required to start this assessment. Please allow them in your browser settings.');
    }
  };

  const recordViolation = (type: string) => {
    setViolations((prev) => [...prev, type]);
  };

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Auto-save answer
    const token = localStorage.getItem('token');
    axios.post(
      `/api/tests/${testId}/auto-save`,
      { questionId, answer },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch((error) => console.error('[Auto-save Error]', error));
  }, [testId]);

  const handleRunCode = async () => {
    const currentQuestion = test?.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    setIsRunningCode(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/tests/${testId}/run-code`,
        {
          questionId: currentQuestion.id,
          code: answers[currentQuestion.id] || '',
          language: selectedLanguages[currentQuestion.id] || 'javascript',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRunResults(prev => ({
        ...prev,
        [currentQuestion.id]: response.data
      }));
    } catch (error: any) {
      console.error('[Run Code Error]', error);
      setRunResults(prev => ({
        ...prev,
        [currentQuestion.id]: { error: error.response?.data?.message || 'Execution failed' }
      }));
    } finally {
      setIsRunningCode(false);
    }
  };



  const submitTest = async (isTimeout = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/tests/${testId}/submit`,
        {
          answers,
          violations,
          completedAt: new Date().toISOString(),
          status: isTimeout ? 'auto_submitted' : 'submitted'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (isTimeout) {
        setShowAutoSubmitModal(true);
      } else {
        setShowConfirmModal(false);
        alert('Your test has been submitted successfully. Results will be announced by the administrator.');
        router.push('/student/dashboard');
      }
    } catch (error) {
      console.error('[Submit Test Error]', error);
      alert('Failed to submit test. Please try again.');
      submittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!test) {
    return <div className="flex justify-center items-center h-screen">Loading test...</div>;
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // Resolve branch name or fallback
  const studentBranch = (test as any).student?.branchName || 'General';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Mandatory Assessment Instructions</h2>
            <div className="space-y-3.5 text-slate-650 text-sm leading-relaxed">
              <p>Welcome to the <strong>Campus Recruitment Assessment – {studentBranch} 2027</strong>. Please read the instructions below carefully before starting your test:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Duration:</strong> You have a total of <strong>{test.total_duration} minutes</strong> to complete the entire test.</li>
                <li><strong>Questions:</strong> There are <strong>{test.questions.length} questions</strong>. You can navigate between questions freely.</li>
                <li><strong>Auto-Save:</strong> Your answers are saved automatically as you progress. You can resume in case of interruptions.</li>
                <li><strong>Proctoring Rules:</strong> 
                  <ul className="list-circle pl-5 space-y-1.5 mt-1 text-xs text-rose-600 font-semibold">
                    <li>• Switching tabs or minimizing the browser window is prohibited.</li>
                    <li>• Copying, pasting, and right-clicking are disabled.</li>
                    <li>• Multiple violations will result in automatic submission.</li>
                  </ul>
                </li>
                <li><strong>Permissions:</strong> Starting the test requires Camera and Microphone access for proctoring.</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleStartTest}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition"
              >
                I Acknowledge & Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-red-600 mb-2">Warning</h3>
            <p className="text-gray-700 mb-4">You switched tabs. Multiple violations will result in test termination.</p>
            <button
              onClick={() => setShowWarning(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full"
            >
              I understand
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar - Question Navigator */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-6 border-b border-slate-100 space-y-1">
          <h2 className="font-extrabold text-slate-900 text-base tracking-tight">Question Navigator</h2>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {test.questions.length}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {test.questions.map((q, idx) => {
            const isSelected = currentQuestionIndex === idx;
            const isAnswered = answers[q.id] && answers[q.id].trim().length > 0;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full text-left p-3.5 rounded-xl font-semibold transition text-xs flex items-center justify-between border ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : isAnswered
                      ? 'bg-slate-50/50 text-slate-700 border-slate-100 hover:bg-slate-50'
                      : 'bg-white text-slate-600 border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[150px]">{q.type === 'coding' ? 'Coding Challenge' : 'Multiple Choice'}</span>
                </div>
                {isAnswered && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">
                    ✓ Saved
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white p-5 flex justify-between items-center border-b border-slate-200 sticky top-0 z-10">
          <h1 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">
             {studentBranch} drive
          </h1>
          <div className={`text-xl font-bold font-mono px-3.5 py-1.5 rounded-xl border flex items-center gap-2 ${
            timeRemaining < 300 
              ? 'text-rose-600 border-rose-100 bg-rose-50 animate-pulse' 
              : 'text-slate-800 border-slate-200 bg-slate-50'
          }`}>
            <span>⏱️</span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} • {currentQuestion.type === 'coding' ? 'Coding Challenge' : 'MCQ'}
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {currentQuestion.questionText}
              </h2>
              <div className="inline-flex text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                Points: {currentQuestion.points || 10}
              </div>
            </div>

            {/* Answer Input */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              {currentQuestion.type === 'mcq' && currentQuestion.optionsJson && (
                <div className="space-y-2.5">
                  {currentQuestion.optionsJson.map((option: any, idx: number) => {
                    const optionVal = typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option);
                    const isSelected = answers[currentQuestion.id] === optionVal;
                    return (
                      <label 
                        key={idx} 
                        className={`flex items-center p-4 border rounded-xl hover:bg-slate-50 transition cursor-pointer ${
                          isSelected ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={optionVal}
                          checked={isSelected}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="mr-3 text-blue-600 focus:ring-blue-500 rounded-full"
                        />
                        <span className="text-sm font-semibold text-slate-700">{optionVal}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="space-y-3">
                  {['True', 'False'].map((option) => (
                    <label key={option} className="flex items-center p-3 border rounded-lg hover:bg-blue-50">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'coding' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solution Editor</span>
                  </div>

                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    onCopy={(e) => { e.preventDefault(); alert('Copying code is disabled.'); }}
                    onCut={(e) => { e.preventDefault(); alert('Cutting code is disabled.'); }}
                    onPaste={(e) => { e.preventDefault(); alert('Pasting code is disabled.'); }}
                    className="coding-textarea w-full h-80 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-sm bg-slate-950 text-slate-100 shadow-inner"
                    placeholder="// Write your solution code here..."
                  />
                </div>
              )}

              {currentQuestion.type === 'essay' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Enter your essay answer here..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white shadow-lg p-4 flex justify-between gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 font-medium py-2 px-6 rounded-md"
          >
            Previous
          </button>

          {currentQuestionIndex < test.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-md"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>

      {/* Confirm Submission Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 border-b pb-2">Confirm Submission</h3>
            <div className="space-y-2 text-sm text-slate-650">
              <p><strong>Test Name:</strong> Campus Recruitment Assessment – {studentBranch} 2027</p>
              <p>Total Questions: <strong className="text-slate-900">{test.questions.length}</strong></p>
              <p>Answered: <strong className="text-emerald-600">{Object.keys(answers).filter(qId => answers[qId]?.trim().length > 0).length}</strong></p>
              <p>Unanswered: <strong className="text-rose-600">{test.questions.length - Object.keys(answers).filter(qId => answers[qId]?.trim().length > 0).length}</strong></p>
              <p>Remaining Time: <strong className="text-indigo-600">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</strong></p>
            </div>
            <p className="text-xs text-amber-600 font-semibold pt-1">Are you sure you want to submit your test? You cannot change your answers after submission.</p>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button variant="outline" className="border-slate-200" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => submitTest(false)} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Submit Modal (Timer Expired) */}
      {showAutoSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 text-2xl font-bold">!</div>
            <h3 className="text-xl font-bold text-slate-900">Time Limit Reached</h3>
            <p className="text-sm text-slate-500">Your assessment has been automatically submitted because the allotted time has ended.</p>
            <div className="bg-slate-50 rounded-xl p-4 text-left text-xs space-y-2 text-slate-650">
              <p><strong>Test Name:</strong> Campus Recruitment Assessment – {studentBranch} 2027</p>
              <p>Total Questions: <strong className="text-slate-900">{test.questions.length}</strong></p>
              <p>Answered: <strong className="text-emerald-600">{Object.keys(answers).filter(qId => answers[qId]?.trim().length > 0).length}</strong></p>
              <p>Unanswered: <strong className="text-rose-600">{test.questions.length - Object.keys(answers).filter(qId => answers[qId]?.trim().length > 0).length}</strong></p>
            </div>
            <div className="pt-2">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => router.push('/student/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
