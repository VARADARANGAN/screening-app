'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function EvaluationManager() {
  const { logout } = useAuth();
  const router = useRouter();
  
  // Data State
  const [tests, setTests] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [branchStats, setBranchStats] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPublish, setSelectedPublish] = useState('all');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'tests' | 'rankings' | 'branches'>('tests');

  // Inspection Modal State
  const [inspectTestId, setInspectTestId] = useState<string | null>(null);
  const [inspectData, setInspectData] = useState<any>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Local evaluation state for each question
  const [manualMarks, setManualMarks] = useState<{ [questionId: string]: number }>({});
  const [manualRemarks, setManualRemarks] = useState<{ [questionId: string]: string }>({});
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);

  // Bulk Selection State
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchBranches();
    loadEvaluationData();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get('/api/branches');
      setBranches(data.branches || []);
    } catch (e) {
      console.error('Failed to fetch branches', e);
    }
  };

  const loadEvaluationData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/evaluation', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(response.data.tests || []);
      setRankings(response.data.rankings || []);
      setBranchStats(response.data.branchStats || []);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('[Load Evaluation Error]', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspect = async (testId: string) => {
    setInspectTestId(testId);
    setIsInspecting(true);
    setInspectData(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const qData = response.data.test;
      setInspectData(qData);

      const marksMap: { [key: string]: number } = {};
      const remarksMap: { [key: string]: string } = {};

      if (qData.responses) {
        qData.responses.forEach((r: any) => {
          marksMap[r.question_id] = r.points_earned || 0;

          let cleanRemarks = '';
          const ans = r.student_answer || '';
          if (ans.startsWith('// === EVALUATION REMARKS ===')) {
            const parts = ans.split('// ==========================\n\n');
            if (parts.length > 1) {
              const header = parts[0];
              const lines = header.split('\n');
              const remarksLines = lines.slice(1, lines.length - 1).map((l: string) => l.replace(/^\/\/\s?/, ''));
              cleanRemarks = remarksLines.join('\n');
            }
          }
          remarksMap[r.question_id] = cleanRemarks;
        });
      }
      setManualMarks(marksMap);
      setManualRemarks(remarksMap);

    } catch (error) {
      console.error('[Load Inspect Error]', error);
      alert('Failed to load test submission details.');
      setIsInspecting(false);
    }
  };

  const handleSaveManualEvaluation = async () => {
    if (!inspectTestId) return;
    setIsSavingEvaluation(true);
    try {
      const token = localStorage.getItem('token');
      const evaluations = Object.entries(manualMarks).map(([questionId, pointsEarned]) => ({
        questionId,
        pointsEarned,
        remarks: manualRemarks[questionId] || ''
      }));

      await axios.patch(`/api/tests/${inspectTestId}`, {
        evaluations
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Manual evaluations saved successfully!');
      loadEvaluationData();
      setIsInspecting(false);
    } catch (e: any) {
      console.error('Failed to save manual evaluation', e);
      alert(e.response?.data?.message || 'Failed to save evaluation.');
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const toggleSelectTest = (id: string) => {
    const next = new Set(selectedTestIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTestIds(next);
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedTestIds.size === 0) {
      alert('Please select at least one student test to publish.');
      return;
    }
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/evaluation', {
        testIds: Array.from(selectedTestIds),
        publish
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Results ${publish ? 'published' : 'unpublished'} successfully for ${selectedTestIds.size} student(s).`);
      setSelectedTestIds(new Set());
      loadEvaluationData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to update publication state.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishAll = async (publish: boolean) => {
    if (!confirm(`Are you sure you want to ${publish ? 'publish' : 'unpublish'} results for ALL submitted tests?`)) return;
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/evaluation', {
        publishAll: true,
        publish
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`All submitted results have been ${publish ? 'published' : 'unpublished'}.`);
      loadEvaluationData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to update publication state.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishBranch = async (branchId: string, publish: boolean) => {
    const branchName = branches.find(b => b.id === branchId)?.name || 'selected branch';
    if (!confirm(`Publish results for all students in ${branchName}?`)) return;
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/evaluation', {
        branchId,
        publish
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Results for ${branchName} have been ${publish ? 'published' : 'unpublished'}.`);
      loadEvaluationData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to update publication state.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtering Logic
  const filteredTests = tests.filter(t => {
    const matchesSearch = 
      t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.usn?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || t.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesPublish = selectedPublish === 'all' || 
      (selectedPublish === 'published' && t.results_published) ||
      (selectedPublish === 'unpublished' && !t.results_published);
    return matchesSearch && matchesBranch && matchesStatus && matchesPublish;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight">Test Evaluation Dashboard</h1>
            <p className="text-gray-600 mt-1">Campus recruitment scoring, analysis, and results announcement</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>Dashboard</Button>
            <Button variant="outline" onClick={() => logout().then(() => router.push('/auth/login'))}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Active Tests</p>
              <h3 className="text-4xl font-extrabold text-blue-600 mt-2">{stats?.totalTests || 0}</h3>
              <p className="text-xs text-gray-400 mt-1">Assigned tests across all student accounts</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Submitted / Completed</p>
              <h3 className="text-4xl font-extrabold text-emerald-600 mt-2">{stats?.totalSubmitted || 0}</h3>
              <p className="text-xs text-gray-400 mt-1">Tests finished and awaiting announcement</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Average Score</p>
              <h3 className="text-4xl font-extrabold text-indigo-600 mt-2">{stats?.avgScore || 0}%</h3>
              <p className="text-xs text-gray-400 mt-1">Overall percentage average on MCQ evaluation</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-3 px-6 font-semibold border-b-2 transition ${
              activeTab === 'tests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Submissions & Publishing
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`py-3 px-6 font-semibold border-b-2 transition ${
              activeTab === 'rankings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Leaderboard & Rankings
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`py-3 px-6 font-semibold border-b-2 transition ${
              activeTab === 'branches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Branch Performance
          </button>
        </div>

        {/* Tab content 1: Submissions list */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            {/* Filters Dashboard */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center flex-1">
                <Input
                  placeholder="Search by student name or USN..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="in_progress">In Progress</option>
                  <option value="not_started">Not Started</option>
                </select>
                <select
                  value={selectedPublish}
                  onChange={e => setSelectedPublish(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Publish State: All</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleBulkPublish(true)} 
                  disabled={selectedTestIds.size === 0 || isPublishing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3 py-1.5"
                >
                  Publish Selected ({selectedTestIds.size})
                </Button>
                <Button 
                  onClick={() => handleBulkPublish(false)} 
                  disabled={selectedTestIds.size === 0 || isPublishing}
                  variant="outline"
                  className="font-medium text-xs px-3 py-1.5"
                >
                  Unpublish Selected
                </Button>
                <Button 
                  onClick={() => handlePublishAll(true)} 
                  disabled={isPublishing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5"
                >
                  Publish All Results
                </Button>
              </div>
            </div>

            {/* Submissions Table */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 border-b">
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Violations</TableHead>
                    <TableHead>Publish Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">Loading student evaluations...</TableCell>
                    </TableRow>
                  ) : filteredTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">No matching student tests found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredTests.map((test) => (
                      <TableRow key={test.id} className="hover:bg-gray-50 border-b transition">
                        <TableCell>
                          {(test.status === 'submitted' || test.status === 'evaluated') && (
                            <input
                              type="checkbox"
                              checked={selectedTestIds.has(test.id)}
                              onChange={() => toggleSelectTest(test.id)}
                              className="rounded border-gray-300 focus:ring-blue-500 text-blue-600 h-4 w-4"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">{test.fullName || 'No Name Completed'}</TableCell>
                        <TableCell className="text-sm font-mono text-gray-600">{test.usn || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{test.branch}</TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            test.status === 'evaluated' ? 'bg-emerald-100 text-emerald-800' :
                            test.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            test.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {test.status}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-gray-900">
                          {test.score !== null ? `${test.score}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${test.violations > 0 ? 'text-rose-600 font-bold' : 'text-gray-500'}`}>
                            {test.violations}
                          </span>
                        </TableCell>
                        <TableCell>
                          {test.results_published ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">Published</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 border border-gray-200">Hidden</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {(test.status === 'submitted' || test.status === 'evaluated') && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleInspect(test.id)}
                              className="text-xs px-2.5 py-1"
                            >
                              Inspect Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Tab content 2: Leaderboard */}
        {activeTab === 'rankings' && (
          <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
            <CardHeader className="border-b bg-gray-50 pb-4">
              <CardTitle>Leaderboard & Performance Rankings</CardTitle>
              <CardDescription>Consolidated results ordered by score (highest to lowest). Excludes active or unsubmitted tests.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Anti-Cheat Violations</TableHead>
                  <TableHead>Submission Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">No rankings available yet. Awaiting submissions.</TableCell>
                  </TableRow>
                ) : (
                  rankings.map((student) => (
                    <TableRow key={student.testId} className="hover:bg-gray-50 border-b">
                      <TableCell className="font-extrabold text-blue-600 text-base">#{student.rank}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{student.fullName}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">{student.usn}</TableCell>
                      <TableCell className="text-sm text-gray-600">{student.branch}</TableCell>
                      <TableCell className="font-bold text-gray-900 text-base">{student.score}%</TableCell>
                      <TableCell className={`font-semibold ${student.violations > 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                        {student.violations}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(student.submittedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Tab content 3: Branch Stats */}
        {activeTab === 'branches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle>Branch-wise Aggregated Results</CardTitle>
                <CardDescription>Comparison table of applicant scores grouped by college branch.</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>Applicants Completed</TableHead>
                    <CardHead className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Average Performance</CardHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">No branch-wise analytics available.</TableCell>
                    </TableRow>
                  ) : (
                    branchStats.map((stat) => (
                      <TableRow key={stat.branch} className="hover:bg-gray-50 border-b">
                        <TableCell className="font-semibold text-gray-800">{stat.branch}</TableCell>
                        <TableCell className="font-medium text-gray-900">{stat.count}</TableCell>
                        <TableCell className="font-extrabold text-indigo-600">{stat.avgScore}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Branch Actions</h3>
              <p className="text-sm text-gray-600 mb-6">
                Publish results instantly to all students belonging to specific divisions. Students will get immediate access to scorecards and details.
              </p>
              <div className="space-y-4">
                {branches.map((b) => (
                  <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-800">{b.name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePublishBranch(b.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-2.5 py-1"
                      >
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublishBranch(b.id, false)}
                        className="font-medium text-xs px-2.5 py-1"
                      >
                        Unpublish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Inspect Test Details Modal */}
      {isInspecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Test Evaluation Details</h2>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold block text-gray-500">Student:</span>
                    {inspectData?.student?.fullName}
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-500">USN:</span>
                    {inspectData?.student?.usn || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-500">Branch:</span>
                    {inspectData?.student?.branchName}
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-500">Score Achieved:</span>
                    <strong className="text-blue-600 text-base">{inspectData?.score}%</strong>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsInspecting(false)}>Close</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {inspectData === null ? (
                <div className="text-center py-12 text-gray-500">Loading student responses details...</div>
              ) : (
                inspectData.questions.map((q: any, index: number) => {
                  const response = inspectData.responses?.find((r: any) => r.question_id === q.id);
                  const isCorrect = response?.is_correct;
                  
                  return (
                    <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900">
                          Q{index + 1}. <span className="font-medium text-gray-800">{q.questionText}</span>
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                          isCorrect ? 'bg-green-100 text-green-800' : 
                          response?.student_answer ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isCorrect ? 'Correct' : response?.student_answer ? 'Incorrect' : 'Unattempted'}
                        </span>
                      </div>

                      {/* Display MCQ Options */}
                      {q.type === 'mcq' && q.optionsJson && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                          {q.optionsJson.map((opt: any, idx: number) => {
                            const optionText = typeof opt === 'object' && opt !== null && 'text' in opt ? opt.text : String(opt);
                            const isCorrectAnswer = String(idx) === String(q.correctAnswer);
                            const isStudentChoice = String(optionText) === String(response?.student_answer) || String(idx) === String(response?.student_answer);

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                                  isCorrectAnswer ? 'bg-green-50 border-green-300 text-green-950 font-semibold' :
                                  isStudentChoice && !isCorrect ? 'bg-red-50 border-red-300 text-red-950' : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                              >
                                <span>{optionText}</span>
                                {isStudentChoice && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold uppercase">Student's Choice</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Non MCQ details (Coding/Essay) */}
                      {['coding', 'essay'].includes(q.type) && (() => {
                        const rawAns = response?.student_answer || '';
                        let cleanCode = rawAns;
                        if (rawAns.startsWith('// === EVALUATION REMARKS ===')) {
                          const parts = rawAns.split('// ==========================\n\n');
                          if (parts.length > 1) {
                            cleanCode = parts.slice(1).join('// ==========================\n\n');
                          }
                        }

                        return (
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Submitted Answer (Read-Only Code):</p>
                              <pre className="p-3 bg-gray-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner text-left">
                                {cleanCode || 'No response recorded.'}
                              </pre>
                            </div>

                            {q.type === 'coding' && response?.ai_evaluation_json && (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3 text-left">
                                <h5 className="font-bold text-xs text-blue-800 uppercase tracking-wider flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                  AI Evaluation Insights
                                </h5>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><span className="font-semibold text-blue-900">Detected Language:</span> <span className="text-blue-800">{response.ai_evaluation_json.detectedLanguage || 'N/A'}</span></div>
                                  <div><span className="font-semibold text-blue-900">AI Suggested Marks:</span> <span className="text-blue-800 font-bold">{response.ai_evaluation_json.marksAwarded || 0} / {q.points}</span></div>
                                </div>
                                <div>
                                  <span className="font-semibold text-blue-900 text-sm">AI Feedback:</span>
                                  <p className="text-blue-800 text-sm mt-1">{response.ai_evaluation_json.feedback || 'No feedback provided.'}</p>
                                </div>
                                {response.ai_evaluation_json.deductions && (
                                  <div>
                                    <span className="font-semibold text-red-700 text-sm">Reason for Deductions:</span>
                                    <p className="text-red-600 text-sm mt-1">{response.ai_evaluation_json.deductions}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {q.type === 'coding' && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-left">
                                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Manual Evaluation Panel</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Marks (Max {q.points || 10})</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={q.points || 10}
                                      value={manualMarks[q.id] !== undefined ? manualMarks[q.id] : (response?.points_earned || 0)}
                                      onChange={(e) => setManualMarks({ ...manualMarks, [q.id]: Math.min(q.points || 10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assessor Feedback / Remarks</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Excellent logic, minor syntax error."
                                      value={manualRemarks[q.id] || ''}
                                      onChange={(e) => setManualRemarks({ ...manualRemarks, [q.id]: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="pt-2 flex justify-between text-xs text-gray-500 border-t border-gray-100">
                        <span>Time Limit: {q.timeLimitSeconds}s</span>
                        <span>Marks Worth: {q.points}</span>
                        <span>Marks Earned: {manualMarks[q.id] !== undefined ? manualMarks[q.id] : (response?.points_earned || 0)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-xl">
              <div>
                <span className="text-sm font-medium text-gray-500">Violations recorded:</span>
                <strong className={`ml-2 text-sm ${inspectData?.violations_count > 0 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                  {inspectData?.violations_count || 0}
                </strong>
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold"
                  onClick={handleSaveManualEvaluation}
                  disabled={isSavingEvaluation}
                >
                  {isSavingEvaluation ? 'Saving...' : 'Save Evaluation'}
                </Button>

                {inspectData?.results_published ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.post('/api/admin/evaluation', {
                          testIds: [inspectData.id],
                          publish: false
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        alert('Test results unpublished successfully.');
                        setInspectData((p: any) => ({ ...p, results_published: false }));
                        loadEvaluationData();
                      } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
                    }}
                  >
                    Unpublish Scores
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.post('/api/admin/evaluation', {
                          testIds: [inspectData.id],
                          publish: true
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        alert('Test results published successfully to student scorecard.');
                        setInspectData((p: any) => ({ ...p, results_published: true }));
                        loadEvaluationData();
                      } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
                    }}
                  >
                    Publish Student Score
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// For compatibility in some rendering structures
const CardHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
    {...props}
  />
));
CardHead.displayName = 'CardHead';
