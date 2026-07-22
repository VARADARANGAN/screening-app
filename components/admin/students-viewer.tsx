'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Student {
  id: string;
  fullName: string;
  usn: string;
  branch: string;
  college: string;
  email: string;
  test_count: number;
  avg_score: number;
}

interface TestAttempt {
  id: string;
  fullName: string;
  usn: string;
  branch: string;
  email: string;
  status: string;
  score: number | null;
  violations: number;
  createdAt: string;
  submittedAt: string | null;
  results_published: boolean;
}

export function StudentsViewer() {
  const { logout } = useAuth();
  const router = useRouter();

  // Active Tab: 'students' | 'attempts'
  const [activeTab, setActiveTab] = useState<'students' | 'attempts'>('students');

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);

  // Filters State
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Coding answers viewer state
  const [activeTestDetail, setActiveTestDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleViewCodingAnswers = async (testId: string) => {
    setIsDetailLoading(true);
    setActiveTestDetail(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveTestDetail(response.data.test);
    } catch (error) {
      console.error('Failed to load test details', error);
      alert('Failed to load test answers.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    loadData();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/branches');
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Failed to load branches', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load registered students
      const studentsRes = await axios.get('/api/admin/students?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(studentsRes.data.students || []);

      // Load live attempts/evaluations
      const evaluationRes = await axios.get('/api/admin/evaluation', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttempts(evaluationRes.data.tests || []);
    } catch (error) {
      console.error('[Load Dashboard Data Error]', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHistory = async (student: Student) => {
    setSelectedStudent(student);
    setIsHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch evaluations which contains all test assignments
      const evaluationRes = await axios.get('/api/admin/evaluation', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allAttempts = evaluationRes.data.tests || [];
      // Filter attempts belonging to this student by email or name/USN matching
      const studentHistory = allAttempts.filter(
        (t: any) => t.usn === student.usn || t.email === student.email
      );
      setSelectedStudentHistory(studentHistory);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Local filtering & search logic for students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.usn?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || s.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  // Local filtering & search logic for attempts
  const filteredAttempts = attempts.filter(a => {
    const matchesSearch = a.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.usn?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || a.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <Link href="/admin/dashboard" className="font-extrabold text-slate-900 tracking-tight text-lg hover:opacity-90 transition">
              Campus<span className="text-blue-600 font-semibold">Screen</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold ml-1 uppercase tracking-wider">
              Student Directory
            </span>
          </div>
          <div>
            <Link href="/admin/dashboard" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition">
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-250">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3.5 px-6 font-bold border-b-2 text-xs uppercase tracking-wider transition ${
              activeTab === 'students' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Registered Students ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`py-3.5 px-6 font-bold border-b-2 text-xs uppercase tracking-wider transition ${
              activeTab === 'attempts' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Attempts & Submissions ({filteredAttempts.length})
          </button>
        </div>
        {/* Controls/Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search by student name or USN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:bg-white"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50" onClick={loadData}>
            Refresh Feed
          </Button>
        </div>

        {/* Dynamic Views */}
        {activeTab === 'students' ? (
          <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Student Name</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-36">USN</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-40">Branch</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">College</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-24 text-center">Tests Taken</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-28 text-center">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">Loading student profiles...</TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">No students registered yet</TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => (
                      <TableRow 
                        key={student.id} 
                        onClick={() => handleOpenHistory(student)}
                        className="hover:bg-slate-50/70 transition border-b border-slate-100 last:border-b-0 cursor-pointer"
                      >
                        <TableCell className="font-bold text-slate-800">{student.fullName}</TableCell>
                        <TableCell className="w-36 font-mono text-xs text-slate-600">{student.usn}</TableCell>
                        <TableCell className="w-40 text-slate-600 font-medium">{student.branch}</TableCell>
                        <TableCell className="text-slate-600">{student.email}</TableCell>
                        <TableCell className="text-slate-600 truncate max-w-[150px]">{student.college}</TableCell>
                        <TableCell className="w-24 text-center font-semibold text-slate-700">{student.test_count}</TableCell>
                        <TableCell className="w-28 text-center font-bold text-emerald-600">
                          {student.avg_score ? `${Math.round(student.avg_score * 10) / 10}` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Live attempts view */
          <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Student Name</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-28">Branch</TableHead>
                    <TableHead className="font-semibold text-slate-700">Test Name</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-32">Marks Obtained</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-36">Start Time</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-36">Submission Time</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-28">Time Taken</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-36">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">Loading live attempts feed...</TableCell>
                    </TableRow>
                  ) : filteredAttempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">No test attempts recorded yet</TableCell>
                    </TableRow>
                  ) : (
                    filteredAttempts.map(attempt => {
                      const testName = `Campus Recruitment Assessment – ${attempt.branch || 'General'} 2027`;
                      
                      let timeTakenText = 'N/A';
                      if (attempt.submittedAt) {
                        const start = attempt.createdAt ? new Date(attempt.createdAt).getTime() : 0;
                        const end = new Date(attempt.submittedAt).getTime();
                        if (start > 0) {
                          const diffMins = Math.round((end - start) / 60000);
                          timeTakenText = `${diffMins} min(s)`;
                        }
                      }

                      const displayStatus = attempt.status === 'auto_submitted' ? 'Auto Submitted' : 
                                            (attempt.status === 'submitted' || attempt.status === 'evaluated') ? 'Completed' : attempt.status;

                      return (
                        <TableRow key={attempt.id} className="hover:bg-slate-50/50 transition border-b border-slate-100 last:border-b-0 text-xs">
                          <TableCell className="font-bold text-slate-800">{attempt.fullName || 'N/A'}</TableCell>
                          <TableCell className="w-28 text-slate-650 font-medium">{attempt.branch}</TableCell>
                          <TableCell className="font-semibold text-slate-700">{testName}</TableCell>
                          <TableCell className="w-32 text-center font-extrabold text-slate-800">
                            {attempt.score !== null 
                              ? (attempt.totalQuestions 
                                  ? `${attempt.score} / ${attempt.totalQuestions}` 
                                  : `${attempt.score}`) 
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="w-36 text-slate-500 font-mono">
                            {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell className="w-36 text-slate-500 font-mono">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell className="w-28 text-center text-slate-650 font-mono font-medium">
                            {timeTakenText}
                          </TableCell>
                          <TableCell className="w-36 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              displayStatus === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : displayStatus === 'Auto Submitted'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : attempt.status === 'in_progress'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>
                              {displayStatus === 'in_progress' ? 'In Progress' : displayStatus}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Student History Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">{selectedStudent.fullName}</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">USN: {selectedStudent.usn} | {selectedStudent.branch} | {selectedStudent.college}</p>
              </div>
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-xs" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Completed & Assigned Test History</h3>

              <div className="bg-white rounded-xl border border-slate-150 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead className="w-40">Assigned Date</TableHead>
                      <TableHead className="w-40">Submission Date</TableHead>
                      <TableHead className="w-28 text-center">Score</TableHead>
                      <TableHead className="w-32 text-center">Status</TableHead>
                      <TableHead className="w-32 text-center">Coding Answer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isHistoryLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading student history...</TableCell>
                      </TableRow>
                    ) : selectedStudentHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">No test history found for this student</TableCell>
                      </TableRow>
                    ) : (
                      selectedStudentHistory.map(history => {
                        const testName = `Campus Recruitment Assessment – ${history.branch || 'General'} 2027`;
                        return (
                          <TableRow key={history.id} className="hover:bg-slate-50/30 border-b border-slate-100 last:border-b-0">
                            <TableCell className="font-semibold text-slate-800 text-xs">{testName}</TableCell>
                            <TableCell className="w-40 text-xs text-slate-500 font-mono">
                              {new Date(history.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="w-40 text-xs text-slate-500 font-mono">
                              {history.submittedAt ? new Date(history.submittedAt).toLocaleString() : 'N/A'}
                            </TableCell>
                            <TableCell className="w-28 text-center font-bold text-indigo-600 font-mono text-xs">
                              {history.score !== null 
                                ? (history.totalQuestions 
                                    ? `${history.score} / ${history.totalQuestions}` 
                                    : `${history.score}`) 
                                : 'Pending'}
                            </TableCell>
                            <TableCell className="w-32 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                history.status === 'evaluated' || history.status === 'submitted'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}>
                                {history.status === 'submitted' || history.status === 'evaluated' ? 'Completed' : history.status}
                              </span>
                            </TableCell>
                            <TableCell className="w-32 text-center">
                              {history.status === 'submitted' || history.status === 'evaluated' ? (
                                <button
                                  type="button"
                                  onClick={() => handleViewCodingAnswers(history.id)}
                                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                                >
                                  View Answer
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Submitted Coding Answers */}
      {(isDetailLoading || activeTestDetail) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isDetailLoading ? 'Loading coding answers...' : 'Submitted Coding Answers'}
                </h3>
                {activeTestDetail && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    For candidate: {activeTestDetail.student?.fullName || 'Student'} ({activeTestDetail.student?.usn || 'N/A'})
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTestDetail(null)}
                className="border-slate-200 hover:bg-slate-50 text-xs py-1 h-8 cursor-pointer"
              >
                Back
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 space-y-4">
              {isDetailLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm">Fetching candidate responses...</div>
              ) : activeTestDetail?.questions?.filter((q: any) => q.type === 'coding').length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No coding questions in this test attempt.</div>
              ) : (
                activeTestDetail?.questions?.filter((q: any) => q.type === 'coding').map((q: any, idx: number) => {
                  const response = activeTestDetail.responses?.find((r: any) => r.question_id === q.id);
                  const rawAns = response?.student_answer || '';
                  
                  let cleanCode = rawAns;
                  let parsedRemarks = '';
                  if (rawAns.startsWith('// === EVALUATION REMARKS ===')) {
                    const parts = rawAns.split('// ==========================\n\n');
                    if (parts.length > 1) {
                      cleanCode = parts.slice(1).join('// ==========================\n\n');
                      const header = parts[0];
                      const lines = header.split('\n');
                      const remarksLines = lines.slice(1, lines.length - 1).map((l: string) => l.replace(/^\/\/\s?/, ''));
                      parsedRemarks = remarksLines.join('\n');
                    }
                  }

                  return (
                    <div key={q.id} className="bg-white p-5 border border-slate-200 rounded-xl space-y-3 shadow-sm text-left">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          Coding Question {idx + 1}: <span className="font-medium text-slate-700">{q.questionText}</span>
                        </h4>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                          <span>Max Points: {q.points || 10}</span>
                          <span className="text-indigo-600 font-bold">Earned Points: {response?.points_earned || 0}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted Solution:</span>
                        <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 whitespace-pre-wrap max-h-56 overflow-y-auto">
                          {cleanCode || 'No answer submitted.'}
                        </pre>
                      </div>

                      {parsedRemarks && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                          <strong className="block font-bold text-indigo-950 uppercase tracking-wider mb-0.5 text-[10px]">Assessor Evaluation Notes:</strong>
                          <p className="whitespace-pre-wrap">{parsedRemarks}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
