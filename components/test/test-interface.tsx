'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import Editor from '@monaco-editor/react';
import { toast } from 'react-hot-toast';
import { seededShuffle } from '@/lib/shuffle';
import { 
  XCircle, AlertTriangle, Flag, CheckCircle, Clock, Bookmark, 
  Puzzle, Shield, Sparkles, Users, Briefcase, Code, BookOpen, 
  UserCheck, LayoutGrid, Check, ArrowLeft, ArrowRight
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  type: 'mcq' | 'coding';
  optionsJson?: any;
  points: number;
  timeLimitSeconds: number;
  section?: string;
}

interface TestData {
  id: string;
  totalDuration: number;
  questions: Question[];
  status: string;
}

const calculateWordCount = (type: string, answerStr: string): number => {
  if (!answerStr) return 0;
  if (['open_text', 'prompt_writing', 'code_review'].includes(type)) {
     return answerStr.trim() ? answerStr.trim().split(/\s+/).length : 0;
  }
  if (type === 'structured_response') {
     try {
       const parsed = JSON.parse(answerStr);
       return Object.values(parsed).reduce((acc: number, val: any) => {
         const strVal = String(val);
         return acc + (strVal.trim() ? strVal.trim().split(/\s+/).length : 0);
       }, 0);
     } catch {
       return 0;
     }
  }
  return 0;
};

export function TestInterface({ testId }: { testId: string }) {
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Security and execution state
  const submittingRef = useRef(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Record<string, string>>({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClipboardEvent = (e: React.ClipboardEvent | React.DragEvent) => {
    e.preventDefault();
    setToastMessage("Copying and pasting is not allowed in text answers.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const renderWordLimitIndicator = (type: string, question: any) => {
    const minWords = question.optionsJson?.minWords;
    const maxWords = question.optionsJson?.maxWords;
    if (!minWords && !maxWords) return null;

    const currentWordCount = calculateWordCount(type, answers[question.id] || '');
    
    let counterColor = "text-slate-500";
    let counterText = `Words: ${currentWordCount}`;
    
    if (minWords && currentWordCount < minWords) {
      counterText = `Words: ${currentWordCount} / ${minWords} minimum`;
      counterColor = "text-orange-600 font-bold";
    } else if (minWords && currentWordCount >= minWords && (!maxWords || currentWordCount <= maxWords)) {
      counterText = `Words: ${currentWordCount} ✓`;
      counterColor = "text-emerald-600 font-bold";
    }

    if (maxWords) {
      if (currentWordCount > maxWords) {
        counterText = `Words: ${currentWordCount} / ${maxWords} max (Exceeded)`;
        counterColor = "text-rose-600 font-bold";
      } else if (!minWords || currentWordCount >= minWords) {
        counterText = `Words: ${currentWordCount} / ${maxWords} max`;
        counterColor = "text-slate-600 font-bold";
      }
    }

    return (
      <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-100 pt-2">
        <div className={`transition-colors ${counterColor}`}>
          {counterText}
        </div>
        <div className="text-slate-400 font-medium">
          {answers[question.id] ? answers[question.id].length : 0} characters
        </div>
      </div>
    );
  };

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

  // Save state to local storage when time or index changes
  useEffect(() => {
    if (test && test.status === 'in_progress') {
      localStorage.setItem(`testState_${testId}`, JSON.stringify({
        timeRemaining,
        currentQuestionIndex,
        flags
      }));
    }
  }, [timeRemaining, currentQuestionIndex, flags, test, testId]);

  // Ping heartbeat every 30 seconds to update updated_at on backend
  useEffect(() => {
    if (test && test.status === 'in_progress' && !showInstructions) {
      const interval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (token) {
          axios.post(`/api/tests/${testId}/ping`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.error('[Heartbeat Error]', err));
        }
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [test?.status, showInstructions, testId]);

  // Monitor for cheating attempts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Tab switched away');
        setShowWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      
      const savedStateStr = localStorage.getItem(`testState_${testId}`);
      if (t.status === 'in_progress' && savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          if (savedState.timeRemaining > 0) {
            setTimeRemaining(savedState.timeRemaining);
          } else {
            setTimeRemaining(t.total_duration * 60);
          }
          if (savedState.currentQuestionIndex !== undefined) {
            setCurrentQuestionIndex(savedState.currentQuestionIndex);
          }
          if (savedState.flags !== undefined) {
            setFlags(savedState.flags);
          }
        } catch (e) {
          setTimeRemaining(t.total_duration * 60);
        }
      } else {
        setTimeRemaining(t.total_duration * 60);
      }

      if (t.responses) {
        const initialAnswers: Record<string, string> = {};
        t.responses.forEach((r: any) => {
          if (r.student_answer) {
            initialAnswers[r.question_id] = r.student_answer;
          }
        });
        setAnswers(initialAnswers);
      }

      if (t.status !== 'not_started') {
        setShowInstructions(false);
      }
    } catch (error: any) {
      console.error('[Test Load Error]', error);
      setErrorMsg(error.response?.data?.message || 'Failed to load assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setIsInitializing(true);
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
      toast.error('Camera and Microphone permissions are required to start this assessment. Please allow them in your browser settings.');
    } finally {
      setIsInitializing(false);
    }
  };

  const recordViolation = (type: string) => {
    setViolations((prev) => [...prev, type]);
  };

  const handleToggleFlag = (questionId: string) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    setSaveStatus((prev) => ({ ...prev, [questionId]: 'Saving...' }));

    // Auto-save answer
    const token = localStorage.getItem('token');
    axios.post(
      `/api/tests/${testId}/auto-save`,
      { questionId, answer },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      setSaveStatus((prev) => ({ ...prev, [questionId]: '✓ Saved just now' }));
    }).catch((error) => {
      console.error('[Auto-save Error]', error);
      setSaveStatus((prev) => ({ ...prev, [questionId]: 'failed' }));
    });
  }, [testId]);

  const handleClearAnswer = useCallback((questionId: string) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });

    setSaveStatus((prev) => ({ ...prev, [questionId]: 'Saving...' }));

    const token = localStorage.getItem('token');
    axios.post(
      `/api/tests/${testId}/auto-save`,
      { questionId, answer: '' },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      setSaveStatus((prev) => ({ ...prev, [questionId]: '✓ Saved just now' }));
    }).catch((error) => {
      console.error('[Auto-save Error]', error);
      setSaveStatus((prev) => ({ ...prev, [questionId]: 'failed' }));
    });
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
      const responsesPayload = Object.entries(answers).map(([qId, ans]) => {
        const qObj = test.questions.find((q: any) => q.id === qId);
        return {
          questionId: qId,
          section: qObj?.section || 'Uncategorized',
          questionType: qObj?.type || 'open_text',
          answer: ans
        };
      });

      await axios.post(
        `/api/tests/${testId}/submit`,
        {
          assessmentId: test.id,
          studentId: test.student_id || '',
          responses: responsesPayload,
          violations,
          submittedAt: new Date().toISOString(),
          status: isTimeout ? 'auto_submitted' : 'submitted'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (isTimeout) {
        setShowAutoSubmitModal(true);
      } else {
        setShowConfirmModal(false);
        router.push('/student/success');
      }
    } catch (error) {
      console.error('[Submit Test Error]', error);
      toast.error('Failed to submit test. Please try again.');
      submittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentQuestion = () => {
    setValidationError(null);
    if (!test) return true;
    const currentQuestion = test.questions[currentQuestionIndex];
    if (!currentQuestion) return true;
    
    const type = currentQuestion.type;

    if (type === 'structured_response') {
      let fields = currentQuestion.optionsJson?.fields || currentQuestion.optionsJson?.labels || currentQuestion.optionsJson?.steps;
      if (!Array.isArray(fields) || fields.length === 0) {
        fields = [{ id: 1, label: 'Field 1' }];
      }

      let structuredAnswers: Record<string, string> = {};
      if (answers[currentQuestion.id]) {
        try { structuredAnswers = JSON.parse(answers[currentQuestion.id]); } catch {}
      }

      let hasEmptyField = false;
      for (const field of fields) {
        const isObj = typeof field === 'object' && field !== null;
        const label = isObj ? field.label : String(field);
        if (!structuredAnswers[label] || !structuredAnswers[label].trim()) {
          hasEmptyField = true;
          break;
        }
      }

      if (hasEmptyField) {
        return false;
      }
    }
    
    if (['open_text', 'structured_response', 'prompt_writing', 'code_review'].includes(type)) {
      const minWords = currentQuestion.optionsJson?.minWords;
      const maxWords = currentQuestion.optionsJson?.maxWords;
      if (minWords || maxWords) {
        const wordCount = calculateWordCount(type, answers[currentQuestion.id] || '');
        if (maxWords && wordCount > maxWords) {
          setValidationError(`Maximum word limit exceeded. Maximum allowed: ${maxWords} words. Current: ${wordCount} words.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    setShowValidation(true);
    if (validateCurrentQuestion()) {
      setShowValidation(false);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleConfirmSubmit = () => {
    setShowValidation(true);
    if (validateCurrentQuestion()) {
      setShowConfirmModal(true);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500 font-bold uppercase tracking-widest">Loading Assessment...</div>;
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 space-y-4">
        <div className="text-rose-500 mb-4"><AlertTriangle className="w-12 h-12 mx-auto" /></div>
        <h2 className="text-xl font-bold text-slate-800">Assessment Not Available</h2>
        <p className="text-slate-600">{errorMsg}</p>
        <button onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/student/dashboard');
          }
        }} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 space-y-4">
        <div className="text-4xl">📭</div>
        <h2 className="text-xl font-bold text-slate-800">No Assessment Found</h2>
        <button onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/student/dashboard');
          }
        }} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 space-y-4">
        <div className="text-4xl">📭</div>
        <h2 className="text-xl font-bold text-slate-800">No Questions Found</h2>
        <p className="text-slate-600">This assessment currently contains no questions. Please notify your administrator.</p>
        <button onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/student/dashboard');
          }
        }} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // Resolve branch name or fallback
  const studentBranch = (test as any).student?.branchName || 'General';

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
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
              disabled={isInitializing}
              className={`font-bold py-3 px-8 rounded-xl shadow-sm transition ${isInitializing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isInitializing ? 'Requesting Permissions...' : 'I Acknowledge & Start Test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 font-bold text-sm flex items-center gap-3 border border-slate-700">
          <AlertTriangle className="w-4 h-4 text-rose-400" /> {toastMessage}
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

      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Left Sidebar - Question Navigator */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transform transition-transform duration-300 ${isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:relative md:translate-x-0 md:shadow-none`}>
        <div className="p-4 sm:p-6 pb-4 border-b-0 flex justify-between items-center mt-1">
          <h2 className="font-bold text-slate-500 text-[11px] tracking-[0.15em] uppercase">Sections</h2>
          <button onClick={() => setIsMobileNavOpen(false)} className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {test.questions.reduce((acc, q, idx) => {
              const sectionName = q.section || 'General';
              let sectionObj = acc.find(s => s.name === sectionName);
              if (!sectionObj) {
                sectionObj = { name: sectionName, questions: [] };
                acc.push(sectionObj);
              }
              sectionObj.questions.push({ ...q, originalIndex: idx });
              return acc;
            }, [] as { name: string, questions: any[] }[]).map((section) => {
            const sectionName = section.name;
            const sectionQuestions = section.questions;
            
            const answeredCount = sectionQuestions.filter(q => answers[q.id] && answers[q.id].trim().length > 0 && answers[q.id] !== '[]').length;
            const totalCount = sectionQuestions.length;
            
            let SectionIcon = LayoutGrid;
            const sNameUpper = sectionName.toUpperCase();
            if (sNameUpper.includes('PROBLEM')) SectionIcon = Puzzle;
            else if (sNameUpper.includes('INTEGRITY')) SectionIcon = Shield;
            else if (sNameUpper.includes('AI') || sNameUpper.includes('LITERACY')) SectionIcon = Sparkles;
            else if (sNameUpper.includes('COMMUNICATION') || sNameUpper.includes('TEAMWORK')) SectionIcon = Users;
            else if (sNameUpper.includes('EXECUTION')) SectionIcon = Briefcase;
            else if (sNameUpper.includes('CODE') || sNameUpper.includes('CODING')) SectionIcon = Code;
            else if (sNameUpper.includes('LEARNING')) SectionIcon = BookOpen;
            else if (sNameUpper.includes('ATTITUDE') || sNameUpper.includes('OWNERSHIP')) SectionIcon = UserCheck;

            return (
              <div key={sectionName} className="mb-4 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <SectionIcon className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-[13px] text-slate-800 tracking-tight">{sectionName}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400">
                    {answeredCount}/{totalCount}
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {sectionQuestions.map((q) => {
                      const idx = q.originalIndex;
                      const isSelected = currentQuestionIndex === idx;
                      const isAnswered = answers[q.id] && answers[q.id].trim().length > 0 && answers[q.id] !== '[]';
                      const isFlagged = flags[q.id];
                      
                      let chipStyle = "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                      if (isSelected) {
                        chipStyle = "bg-white border-blue-600 border-[2px] text-blue-700 shadow-sm";
                      } else if (isAnswered && isFlagged) {
                        chipStyle = "bg-emerald-50 text-emerald-700 border-yellow-400 border-[2px]";
                      } else if (isAnswered) {
                        chipStyle = "bg-emerald-500 border-emerald-500 text-white shadow-sm";
                      } else if (isFlagged) {
                        chipStyle = "bg-yellow-50 border-yellow-400 border-[2px] text-yellow-700";
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setShowValidation(false);
                            setCurrentQuestionIndex(idx);
                          }}
                          className={`w-[32px] h-[32px] rounded-full font-bold text-[12px] flex items-center justify-center transition-all duration-150 border shadow-sm ${chipStyle}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Status Legend */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
          <div className="bg-slate-50 border border-slate-100 shadow-sm rounded-xl p-3.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Legend</h4>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm"></div> 
                Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-200 bg-white shadow-sm"></div> 
                Not Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-[2px] border-yellow-400 bg-yellow-50 shadow-sm"></div> 
                Flagged
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-[2px] border-blue-600 bg-white shadow-sm"></div> 
                Current
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 w-full">
        {/* Header */}
        <div className="bg-white px-4 sm:px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className="space-y-1">
              <h1 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase hidden sm:block">
                 {studentBranch} drive
              </h1>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                 Q {currentQuestionIndex + 1} of {test.questions.length} <span className="hidden sm:inline">• {currentQuestion.section || 'General'}</span>
              </div>
            </div>
          </div>
          <div className={`text-sm sm:text-lg font-bold font-mono px-3 sm:px-4 py-1.5 rounded-xl border flex items-center gap-1.5 sm:gap-2 ${
            timeRemaining < 300 
              ? 'text-rose-600 border-rose-100 bg-rose-50 animate-pulse shadow-sm' 
              : 'text-slate-800 border-slate-200 bg-slate-50 shadow-sm'
          }`}>
            <span>⏱️</span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="space-y-4 text-left">
                <div className="flex gap-3">
                  <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 tracking-tight">
                    {currentQuestion.points || 10} Points
                  </div>
                </div>
                <div className="text-[24px] font-bold text-slate-900 leading-[1.5] prose prose-slate max-w-none">
                  <MarkdownRenderer content={currentQuestion.questionText} />
                </div>
              </div>

              {/* Answer Input */}
              <div className="pt-2 border-t border-slate-100">
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {validationError}
                </div>
              )}
              {(() => {
                const type = String(currentQuestion.type || '').toLowerCase().replace(/[\s-]/g, '_');
                
                // MCQ, Single Select, Multi Select, Yes/No
                if (['mcq', 'coding_mcq', 'single_select', 'multi_select', 'yes_no'].includes(type)) {
                  let optionsArray = Array.isArray(currentQuestion.optionsJson) 
                    ? currentQuestion.optionsJson 
                    : (currentQuestion.optionsJson?.options || []);
                    
                  optionsArray = seededShuffle([...optionsArray], test.id + currentQuestion.id);
                  
                  const isMultiSelect = type === 'multi_select';
                  let selectedAnswers: string[] = [];
                  if (isMultiSelect && answers[currentQuestion.id]) {
                    try {
                      selectedAnswers = JSON.parse(answers[currentQuestion.id]);
                    } catch {
                      selectedAnswers = [answers[currentQuestion.id]];
                    }
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <span className="text-sm font-bold text-slate-700">Select your answer:</span>
                        {answers[currentQuestion.id] && answers[currentQuestion.id] !== '[]' && (
                          <button
                            onClick={() => handleClearAnswer(currentQuestion.id)}
                            className="text-xs font-bold text-slate-400 hover:text-rose-600 transition underline underline-offset-4"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {optionsArray.map((option: any, idx: number) => {
                          const optionVal = typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option);
                          const isSelected = isMultiSelect 
                            ? selectedAnswers.includes(optionVal)
                            : answers[currentQuestion.id] === optionVal;

                          return (
                            <label 
                              key={idx} 
                              className={`flex items-center p-4 border-2 rounded-2xl transition-all cursor-pointer ${
                                isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type={isMultiSelect ? "checkbox" : "radio"}
                                name={`question-${currentQuestion.id}`}
                                value={optionVal}
                                checked={isSelected}
                                onChange={() => {
                                  if (isMultiSelect) {
                                    const newArr = isSelected 
                                      ? selectedAnswers.filter((a: string) => a !== optionVal)
                                      : [...selectedAnswers, optionVal];
                                    handleAnswerChange(currentQuestion.id, JSON.stringify(newArr));
                                  } else {
                                    handleAnswerChange(currentQuestion.id, optionVal);
                                  }
                                }}
                                className={`mr-4 w-5 h-5 text-blue-600 focus:ring-blue-500 border-slate-300 ${isMultiSelect ? 'rounded' : 'rounded-full'}`}
                              />
                              <span className={`text-base font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{optionVal}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Numeric Input
                if (['numeric', 'numerical'].includes(type)) {
                  return (
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-700">Enter your numeric answer:</label>
                      <Input
                        type="number"
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="max-w-xs text-lg py-6 bg-slate-50 border-slate-200"
                        placeholder="0.00"
                      />
                    </div>
                  );
                }



                // Textareas (Open Text)
                if (type === 'open_text') {
                  const val = answers[currentQuestion.id] || '';
                  const wordCount = val.trim() ? val.trim().split(/\s+/).length : 0;
                  return (
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-700">Your Response:</label>
                      <Textarea
                        value={val}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        onCopy={handleClipboardEvent}
                        onCut={handleClipboardEvent}
                        onPaste={handleClipboardEvent}
                        onDrop={handleClipboardEvent}
                        className="w-full h-[220px] p-4 bg-slate-50 focus:bg-white resize-none text-base rounded-xl border-slate-200 shadow-sm transition-colors"
                        placeholder="Type your response here..."
                      />
                      {renderWordLimitIndicator(type, currentQuestion)}
                    </div>
                  );
                }

                // Ranking (Dropdown Selection)
                if (type === 'ranking') {
                  let optionsArray = Array.isArray(currentQuestion.optionsJson) 
                    ? currentQuestion.optionsJson 
                    : (currentQuestion.optionsJson?.options || []);
                  
                  // Keep options stable during the session
                  optionsArray = seededShuffle([...optionsArray], test.id + currentQuestion.id);
                  const optionTexts = optionsArray.map((o: any) => typeof o === 'object' && o !== null && 'text' in o ? o.text : String(o));
                  
                  // studentAnswer maps optionText -> rank (1, 2, 3...)
                  let studentAnswer: Record<string, number> = {};
                  if (answers[currentQuestion.id]) {
                    try { studentAnswer = JSON.parse(answers[currentQuestion.id]); } catch {}
                  }

                  const handleRankSelect = (item: string, rank: string) => {
                    const newAnswer = { ...studentAnswer };
                    if (!rank) {
                      delete newAnswer[item];
                    } else {
                      newAnswer[item] = Number(rank);
                    }
                    handleAnswerChange(currentQuestion.id, JSON.stringify(newAnswer));
                  };

                  const selectedRanks = Object.values(studentAnswer);

                  if (optionTexts.length === 0) {
                    return <div className="text-slate-400 italic">No ranking options provided for this question.</div>;
                  }

                  return (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-700 mb-4">Assign a unique rank to each item (1 is highest):</p>
                      <div className="space-y-2">
                        {optionTexts.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                            <select
                              value={studentAnswer[item] ? String(studentAnswer[item]) : ''}
                              onChange={(e) => handleRankSelect(item, e.target.value)}
                              className="h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white font-bold text-slate-700 outline-none focus:border-blue-500 w-24"
                            >
                              <option value="">Rank ▼</option>
                              {optionTexts.map((_, i) => {
                                const rankVal = i + 1;
                                const isUsed = selectedRanks.includes(rankVal) && studentAnswer[item] !== rankVal;
                                return (
                                  <option key={rankVal} value={String(rankVal)} disabled={isUsed}>
                                    {rankVal}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="flex-1 font-semibold text-slate-800">{item}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Structured Response
                if (type === 'structured_response') {
                  let optionsObj = currentQuestion.optionsJson;
                  if (typeof optionsObj === 'string') {
                    try { optionsObj = JSON.parse(optionsObj); } catch {}
                  }
                  let fields = optionsObj?.fields || optionsObj?.labels || optionsObj?.steps;
                  if (!Array.isArray(fields) || fields.length === 0) {
                    fields = ['Field 1'];
                  }

                  let structuredAnswers: Record<string, string> = {};
                  if (answers[currentQuestion.id]) {
                    try { structuredAnswers = JSON.parse(answers[currentQuestion.id]); } catch {}
                  }

                  const updateField = (fieldLabel: string, val: string) => {
                    const newAnswers = { ...structuredAnswers, [fieldLabel]: val };
                    handleAnswerChange(currentQuestion.id, JSON.stringify(newAnswers));
                  };

                  return (
                    <div className="space-y-6">
                      {fields.map((field: any, idx: number) => {
                        const isObj = typeof field === 'object' && field !== null;
                        const label = isObj ? field.label : String(field);
                        const isEmpty = showValidation && (!structuredAnswers[label] || !structuredAnswers[label].trim());

                        return (
                          <div key={idx} className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">
                              {label}
                            </label>
                            <Textarea
                              value={structuredAnswers[label] || ''}
                              onChange={(e) => {
                                updateField(label, e.target.value);
                                setShowValidation(false);
                              }}
                              onCopy={handleClipboardEvent}
                              onCut={handleClipboardEvent}
                              onPaste={handleClipboardEvent}
                              onDrop={handleClipboardEvent}
                              className={`w-full min-h-[100px] p-4 bg-slate-50 focus:bg-white resize-y text-sm ${isEmpty ? 'border-rose-500 border-2' : ''}`}
                              placeholder={`Enter ${label}...`}
                            />
                            {isEmpty && (
                              <p className="text-sm text-rose-500 font-semibold mt-1">This field is required.</p>
                            )}
                          </div>
                        );
                      })}
                      {renderWordLimitIndicator(type, currentQuestion)}
                    </div>
                  );
                }

                // Coding
                if (type === 'coding') {
                  return (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <span className="text-sm font-bold text-slate-700">Solution Editor</span>
                        {answers[currentQuestion.id] && (
                          <button
                            onClick={() => handleClearAnswer(currentQuestion.id)}
                            className="text-xs font-bold text-slate-400 hover:text-rose-600 transition underline underline-offset-4"
                          >
                            Clear Code
                          </button>
                        )}
                      </div>

                      <div className="h-[400px] border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                        <Editor
                          height="100%"
                          defaultLanguage="javascript"
                          theme="vs-dark"
                          value={answers[currentQuestion.id] || ''}
                          onChange={(value) => handleAnswerChange(currentQuestion.id, value || '')}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            contextmenu: false,
                            dragAndDrop: false,
                            padding: { top: 16, bottom: 16 }
                          }}
                          onMount={(editor, monaco) => {
                            const preventAction = () => {
                              setToastMessage("Copying and pasting is not allowed in text answers.");
                              setTimeout(() => setToastMessage(null), 3000);
                              recordViolation('Copy/Paste attempted in editor');
                            };

                            const domNode = editor.getDomNode();
                            if (domNode) {
                              const handleProhibited = (e: Event) => {
                                e.preventDefault();
                                preventAction();
                              };
                              domNode.addEventListener('copy', handleProhibited);
                              domNode.addEventListener('paste', handleProhibited);
                              domNode.addEventListener('cut', handleProhibited);
                              
                              domNode.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              });
                              
                              editor.onKeyDown((e) => {
                                if (e.ctrlKey || e.metaKey) {
                                  const key = e.browserEvent.key.toLowerCase();
                                  if (key === 'c' || key === 'v' || key === 'x' || key === 'a') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    preventAction();
                                  }
                                }
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                // Fallback for unknown types
                return (
                  <div className="text-center py-10 text-slate-400 font-bold">
                    Unsupported question type ({type}). Please contact your administrator.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

        {/* Navigation */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] sticky bottom-0 z-50">
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={() => {
                setShowValidation(false);
                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
              }}
              disabled={currentQuestionIndex === 0}
              className="h-10 px-4 sm:px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => handleToggleFlag(currentQuestion.id)}
              className={`h-10 px-4 sm:px-6 inline-flex items-center justify-center gap-2 rounded-lg font-medium border transition-colors ${
                flags[currentQuestion.id] 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Flag className="w-4 h-4" /> 
              <span className="hidden sm:inline">{flags[currentQuestion.id] ? 'Unflag' : 'Flag for Review'}</span>
            </button>
          </div>

          <div className="flex items-center">
            {currentQuestionIndex < test.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="h-10 px-4 sm:px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="h-10 px-4 sm:px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">{isSubmitting ? 'Submitting...' : 'Submit Assessment'}</span>
                <span className="sm:hidden">{isSubmitting ? '...' : 'Submit'}</span>
              </button>
            )}
          </div>
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
              <p>Remaining Time: <strong className="text-blue-600">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</strong></p>
            </div>
            <p className="text-xs text-amber-600 font-semibold pt-1">Are you sure you want to submit your test? You cannot change your answers after submission.</p>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button variant="outline" className="border-slate-200" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => submitTest(false)} disabled={isSubmitting}>
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
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => router.push('/student/success')}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
