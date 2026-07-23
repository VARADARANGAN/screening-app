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
import * as XLSX from 'xlsx';

export function QuestionsManager() {
  const { logout } = useAuth();
  const router = useRouter();
  
  // Data state
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  
  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/questions?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedQuestions = response.data.questions || [];
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('[Load Questions Error]', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadQuestions();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete question');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedQuestionIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedQuestionIds(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedQuestionIds.size} selected question(s)?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/questions/bulk-delete', 
        { ids: Array.from(selectedQuestionIds) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedQuestionIds(new Set());
      loadQuestions();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete questions');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('WARNING: Are you sure you want to delete ALL questions in the universal bank? This action cannot be undone!')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/questions/bulk-delete', 
        { deleteAll: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedQuestionIds(new Set());
      loadQuestions();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete all questions');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    
    try {
      let parsedQuestions: any[] = [];
      const extension = uploadFile.name.split('.').pop()?.toLowerCase();
      const token = localStorage.getItem('token');

      if (extension === 'pdf') {
        const formData = new FormData();
        formData.append('file', uploadFile);
        
        const res = await axios.post('/api/questions/parse-pdf', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        parsedQuestions = res.data.questions;
      } else if (extension === 'xlsx' || extension === 'csv') {
        const data = await uploadFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        parsedQuestions = json.map(row => {
          const questionText = row['Question'] || row['Question Text'] || row['QuestionText'] || row['Question 1'] || '';
          
          const optA = row['Option A'] || row['Option 1'] || row['OptionA'] || '';
          const optB = row['Option B'] || row['Option 2'] || row['OptionB'] || '';
          const optC = row['Option C'] || row['Option 3'] || row['OptionC'] || '';
          const optD = row['Option D'] || row['Option 4'] || row['OptionD'] || '';

          const optionsJson = [];
          if (optA) optionsJson.push({ text: String(optA) });
          if (optB) optionsJson.push({ text: String(optB) });
          if (optC) optionsJson.push({ text: String(optC) });
          if (optD) optionsJson.push({ text: String(optD) });

          const rawCorrect = String(row['Correct Answer'] || row['Correct'] || '').trim().toUpperCase();
          let correctAnswer = '0';
          if (rawCorrect === 'A' || rawCorrect === '1') correctAnswer = '0';
          else if (rawCorrect === 'B' || rawCorrect === '2') correctAnswer = '1';
          else if (rawCorrect === 'C' || rawCorrect === '3') correctAnswer = '2';
          else if (rawCorrect === 'D' || rawCorrect === '4') correctAnswer = '3';
          else {
            correctAnswer = rawCorrect;
          }

          const type = String(row['Question Type'] || row['Type'] || 'mcq').toLowerCase().includes('coding') ? 'coding' : 'mcq';

          return {
            questionText: String(questionText).trim(),
            type,
            points: Number(row['Points'] || row['Marks']) || 10,
            optionsJson: optionsJson.length > 0 ? optionsJson : undefined,
            correctAnswer,
            explanation: row['Explanation'] ? String(row['Explanation']) : '',
            isPublished: true
          };
        }).filter(q => q.questionText.length >= 3);
      } else {
        throw new Error('Unsupported file format. Please upload PDF, Excel, or CSV.');
      }

      if (parsedQuestions.length === 0) throw new Error('No valid questions found in file.');

      await axios.post('/api/questions/bulk', parsedQuestions, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Successfully imported ${parsedQuestions.length} questions to the Universal Question Bank!`);
      setIsUploadOpen(false);
      setUploadFile(null);
      loadQuestions();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || e.message || 'Failed to upload and parse file');
    } finally {
      setIsUploading(false);
    }
  };

  // Local filtering logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || q.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleAll = () => {
    if (selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

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
              Question Bank
            </span>
          </div>
          <div>
            <Link href="/admin/tests" className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-4 py-2 rounded-lg transition mr-2">
              Go to Test Management
            </Link>
            <Link href="/admin/dashboard" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition">
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Controls/Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:bg-white"
            >
              <option value="all">All Types</option>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="coding">Coding Challenge</option>
            </select>
        </div>
          <div className="flex gap-3 shrink-0 mt-3 md:mt-0 items-center">
            {selectedQuestionIds.size > 0 && (
              <Button 
                variant="destructive" 
                className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedQuestionIds.size})
              </Button>
            )}
            <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer" onClick={handleDeleteAll}>
              Delete All
            </Button>
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer" onClick={() => setIsUploadOpen(true)}>
              Import Questions
            </Button>
            <Button className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer" onClick={() => router.push('/admin/questions/create')}>
              Create Question
            </Button>
          </div>
        </div>

        {/* Questions Table */}
        <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={filteredQuestions.length > 0 && selectedQuestionIds.size === filteredQuestions.length}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Question Content</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-44">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-28 text-center">Marks</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">Loading questions...</TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">No questions found matching the filters</TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map(q => (
                    <TableRow key={q.id} className="hover:bg-slate-50/50 transition border-b border-slate-100 last:border-b-0">
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedQuestionIds.has(q.id)}
                          onChange={() => toggleSelection(q.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 max-w-lg">
                        <div className="truncate" title={q.question_text}>{q.question_text}</div>
                      </TableCell>
                      <TableCell className="w-44">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          q.type === 'mcq' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {q.type === 'mcq' ? 'Aptitude (MCQ)' : 'Coding'}
                        </span>
                      </TableCell>
                      <TableCell className="w-28 text-center text-slate-800 font-semibold">
                        {q.points || 10}
                      </TableCell>
                      <TableCell className="w-36 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          onClick={() => router.push(`/admin/questions/edit/${q.id}`)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Upload/Import Dialog */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Import Questions</h2>
            <p className="text-xs text-slate-500 mb-4">Upload a PDF, Excel (.xlsx), or CSV file populated with assessment questions.</p>
            <input 
              type="file" 
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 border border-slate-200 rounded-lg bg-slate-50 p-2 cursor-pointer focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" className="border-slate-200" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadSubmit} disabled={!uploadFile || isUploading}>
                {isUploading ? 'Importing...' : 'Upload & Parse'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
