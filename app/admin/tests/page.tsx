'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TestManagementPage() {
  const router = useRouter();

  // Data State
  const [questions, setQuestions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());

  // Custom configuration
  const [customDuration, setCustomDuration] = useState<number | ''>('');

  // Filters State for Questions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Action states
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load questions
      const questionsRes = await axios.get('/api/questions?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedQuestions = questionsRes.data.questions || [];
      setQuestions(fetchedQuestions);
      
      const cats: string[] = Array.from(
        new Set(fetchedQuestions.map((q: any) => q.category).filter(Boolean))
      ) as string[];
      setCategories(cats);

      // Load branches
      const branchesRes = await axios.get('/api/branches');
      setBranches(branchesRes.data.branches || []);

      // Load assigned tests (using evaluation list)
      const evaluationRes = await axios.get('/api/admin/evaluation', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedTests(evaluationRes.data.tests || []);

    } catch (e) {
      console.error('[Load Data Error]', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleQuestion = (id: string) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedQuestionIds(next);
  };

  const handleToggleBranch = (id: string) => {
    const next = new Set(selectedBranchIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBranchIds(next);
  };

  const handleSelectAllBranches = () => {
    if (selectedBranchIds.size === branches.length) {
      setSelectedBranchIds(new Set());
    } else {
      setSelectedBranchIds(new Set(branches.map(b => b.id)));
    }
  };

  const handleSelectAllQuestions = () => {
    const allVisibleSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.has(q.id));
    const next = new Set(selectedQuestionIds);
    if (allVisibleSelected) {
      filteredQuestions.forEach(q => next.delete(q.id));
    } else {
      filteredQuestions.forEach(q => next.add(q.id));
    }
    setSelectedQuestionIds(next);
  };

  const handlePublishTest = async () => {
    if (selectedQuestionIds.size === 0) {
      alert('Please select at least one question.');
      return;
    }
    if (selectedBranchIds.size === 0) {
      alert('Please select at least one target branch.');
      return;
    }

    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/tests/assign', {
        questionIds: Array.from(selectedQuestionIds),
        branchIds: Array.from(selectedBranchIds),
        totalDuration: customDuration !== '' ? Number(customDuration) : totalDurationMinutes,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(response.data.message || 'Test successfully published to students of selected branches!');
      setSelectedQuestionIds(new Set());
      setSelectedBranchIds(new Set());
      setCustomDuration('');
      setActiveTab('history');
      loadData();
    } catch (e: any) {
      console.error('[Assign Test Error]', e);
      alert(e.response?.data?.message || 'Failed to publish/assign test');
    } finally {
      setIsPublishing(false);
    }
  };

  // Local filtering logic for questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || q.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate estimated total duration
  const totalDurationMinutes = Array.from(selectedQuestionIds).reduce((acc, qId) => {
    const q = questions.find(item => item.id === qId);
    return acc + Math.ceil((q?.time_limit_seconds || 60) / 60);
  }, 0);

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
              Test Publisher
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
            onClick={() => setActiveTab('create')}
            className={`py-3.5 px-6 font-bold border-b-2 text-xs uppercase tracking-wider transition ${
              activeTab === 'create' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Create & Publish Test
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-6 font-bold border-b-2 text-xs uppercase tracking-wider transition ${
              activeTab === 'history' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Assignment History & Status
          </button>
        </div>
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Step 1: Select Questions from universal bank */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">1. Select Questions</h2>
                  <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-full border border-indigo-100">
                    {selectedQuestionIds.size} Selected
                  </span>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2.5">
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs bg-slate-50 border-slate-200"
                  />
                  
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="mcq">MCQ</option>
                    <option value="coding">Coding</option>
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Questions List */}
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0">
                      <TableRow>
                        <TableHead className="w-12">
                          <input 
                            type="checkbox"
                            checked={filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.has(q.id))}
                            onChange={handleSelectAllQuestions}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                            title="Select All Questions"
                          />
                        </TableHead>
                        <TableHead>Question Content</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="w-28">Category</TableHead>
                        <TableHead className="w-20 text-center">Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-400">Loading questions...</TableCell>
                        </TableRow>
                      ) : filteredQuestions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-400">No questions found</TableCell>
                        </TableRow>
                      ) : (
                        filteredQuestions.map(q => (
                          <TableRow 
                            key={q.id} 
                            className={`hover:bg-slate-50/50 cursor-pointer ${
                              selectedQuestionIds.has(q.id) ? 'bg-indigo-50/30' : ''
                            }`}
                            onClick={() => handleToggleQuestion(q.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={selectedQuestionIds.has(q.id)}
                                onChange={() => handleToggleQuestion(q.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-slate-800 max-w-xs truncate">
                              {q.question_text}
                            </TableCell>
                            <TableCell className="text-xs uppercase font-semibold text-slate-500">
                              {q.type}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {q.category || 'General'}
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-700">
                              {q.points || 10}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Step 2: Configure & Select Branches */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900">2. Assign & Publish</h2>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Select Target Branches</span>
                    <button 
                      onClick={handleSelectAllBranches}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      {selectedBranchIds.size === branches.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2 max-h-48 overflow-y-auto">
                    {branches.map(b => (
                      <label key={b.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:bg-indigo-50/20 transition">
                        <input
                          type="checkbox"
                          checked={selectedBranchIds.has(b.id)}
                          onChange={() => handleToggleBranch(b.id)}
                          className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="text-sm font-semibold text-slate-700">{b.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">Test Duration (Minutes)</label>
                  <Input
                    type="number"
                    placeholder={`Default: ${totalDurationMinutes} mins`}
                    value={customDuration}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      setCustomDuration(val);
                    }}
                    className="w-full bg-slate-50 border-slate-200 text-sm"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total Questions:</span>
                    <span className="font-bold text-slate-800">{selectedQuestionIds.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Assigned Duration:</span>
                    <span className="font-bold text-indigo-600">
                      {customDuration !== '' ? customDuration : totalDurationMinutes} mins
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Target Branches:</span>
                    <span className="font-bold text-slate-800">{selectedBranchIds.size} branch(es)</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePublishTest}
                  disabled={selectedQuestionIds.size === 0 || selectedBranchIds.size === 0 || isPublishing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  {isPublishing ? 'Publishing Test...' : 'Publish Test Now'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* History of assigned tests */
          <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Student Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Branch</TableHead>
                    <TableHead className="font-semibold text-slate-700">Test Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Assigned Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Submission Date</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Duration</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Score</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">Loading assignment records...</TableCell>
                    </TableRow>
                  ) : assignedTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">No test assignments found</TableCell>
                    </TableRow>
                  ) : (
                    assignedTests.map(t => {
                      const testName = `Campus Recruitment Assessment – ${t.branch || 'General'} 2027`;
                      const durationMinutes = t.totalDuration || Math.round(t.total_duration / 60) || 60;
                      return (
                        <TableRow key={t.id} className="hover:bg-slate-50/30 border-b border-slate-100 last:border-b-0 text-xs">
                          <TableCell className="font-bold text-slate-800">{t.fullName || 'N/A'}</TableCell>
                          <TableCell className="text-slate-750 font-medium">{t.branch}</TableCell>
                          <TableCell className="text-slate-700 font-semibold">{testName}</TableCell>
                          <TableCell className="text-slate-500 font-mono">
                            {new Date(t.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-slate-500 font-mono">
                            {t.submittedAt ? new Date(t.submittedAt).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center text-slate-650 font-mono font-medium">
                            {durationMinutes} mins
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-900">
                            {t.score !== null ? `${t.score}%` : 'Pending'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              t.status === 'evaluated' || t.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              t.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>
                              {t.status === 'submitted' || t.status === 'evaluated' ? 'Completed' : t.status === 'not_started' ? 'Not Started' : t.status}
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
    </div>
  );
}
