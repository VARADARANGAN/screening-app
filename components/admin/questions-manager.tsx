'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Library, BookOpen, Download, FileSpreadsheet, FileCode2, FileText, LayoutTemplate } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { toast } from 'react-hot-toast';

export function QuestionsManager() {
  const { logout } = useAuth();
  const router = useRouter();

  // Data state
  const [questions, setQuestions] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionTypes, setQuestionTypes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [templateType, setTemplateType] = useState<'mcq' | 'coding' | 'open_text' | 'structured_response'>('mcq');
  const [importSummary, setImportSummary] = useState<{ imported: number, duplicates: number, invalidSection: number, missingFields: number, total: number, skippedDetails: {row: number, reason: string}[] } | null>(null);

  const SUPPORTED_SECTIONS = [
    'Aptitude', 'Coding', 'Problem Solving', 'AI Literacy',
    'Communication & Teamwork', 'Execution & Reliability',
    'Attitude & Ownership', 'Integrity', 'Learning Aptitude', 'Eligibility'
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');

      const [statsRes, questionsRes] = await Promise.all([
        axios.get('/api/questions/stats', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        axios.get('/api/questions?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes && statsRes.data) {
        setTotalQuestions(statsRes.data.total || 0);
        setQuestionTypes(statsRes.data.types || {});
      }

      const fetchedQuestions = questionsRes?.data?.questions || [];
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
      toast.success('Question deleted successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete question');
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
      toast.success('Selected questions deleted successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete questions');
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
      toast.success('All questions deleted successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete all questions');
    }
  };

  const triggerDownload = async (workbook: ExcelJS.Workbook, filename: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMCQTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('MCQ Questions');
    sheet.columns = [
      { header: 'Section', key: 'section', width: 25 },
      { header: 'Question', key: 'question', width: 40 },
      { header: 'Option A', key: 'optionA', width: 20 },
      { header: 'Option B', key: 'optionB', width: 20 },
      { header: 'Option C', key: 'optionC', width: 20 },
      { header: 'Option D', key: 'optionD', width: 20 },
      { header: 'Correct Answer', key: 'correct', width: 15 },
      { header: 'Marks', key: 'marks', width: 10 }
    ];
    sheet.addRow({ section: 'Aptitude', question: 'What is 2+2?', optionA: '2', optionB: '3', optionC: '4', optionD: '5', correct: 'C', marks: '10' });
    await triggerDownload(workbook, 'mcq-template.xlsx');
  };

  const generateCodingTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Coding Questions');
    sheet.columns = [
      { header: 'Section', key: 'section', width: 25 },
      { header: 'Question', key: 'question', width: 40 },
      { header: 'Marks', key: 'marks', width: 10 }
    ];
    sheet.addRow({ section: 'Coding', question: 'Write a program to reverse a string', marks: '15' });
    await triggerDownload(workbook, 'coding-template.xlsx');
  };

  const generateOpenTextTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Open Text Questions');
    sheet.columns = [
      { header: 'Section', key: 'section', width: 30 },
      { header: 'Question', key: 'question', width: 40 },
      { header: 'Minimum Words', key: 'minWords', width: 15 },
      { header: 'Maximum Words', key: 'maxWords', width: 15 },
      { header: 'Marks', key: 'marks', width: 10 }
    ];
    sheet.addRow({ section: 'Communication & Teamwork', question: 'Describe your leadership experience.', minWords: '100', maxWords: '300', marks: '10' });
    await triggerDownload(workbook, 'open-text-template.xlsx');
  };

  const generateStructuredTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Structured Responses');
    sheet.columns = [
      { header: 'Section', key: 'section', width: 30 },
      { header: 'Question', key: 'question', width: 40 },
      { header: 'Field 1 Label', key: 'field1', width: 20 },
      { header: 'Field 2 Label', key: 'field2', width: 20 },
      { header: 'Field 3 Label', key: 'field3', width: 20 },
      { header: 'Marks', key: 'marks', width: 10 }
    ];
    sheet.addRow({ section: 'Execution & Reliability', question: 'How would you complete this project in three days?', field1: 'Day 1', field2: 'Day 2', field3: 'Day 3', marks: '15' });
    await triggerDownload(workbook, 'structured-template.xlsx');
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setImportSummary(null);

    try {
      let parsedQuestions: any[] = [];
      let skippedDetails: {row: number, reason: string}[] = [];
      let invalidSectionCount = 0;
      let missingFieldsCount = 0;
      let duplicatesCount = 0;
      let totalProcessed = 0;
      
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
        totalProcessed = parsedQuestions.length;
      } else if (extension === 'xlsx' || extension === 'csv') {
        const data = await uploadFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Header validation
        const jsonWithHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (jsonWithHeaders.length === 0) throw new Error('File is empty.');
        
        const headers = (jsonWithHeaders[0] || []).map(h => String(h).trim());
        
        let requiredHeaders: string[] = [];
        if (templateType === 'mcq') {
           requiredHeaders = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks'];
        } else if (templateType === 'coding' || templateType === 'open_text') {
           requiredHeaders = ['Question', 'Marks'];
        } else if (templateType === 'structured_response') {
           requiredHeaders = ['Question', 'Field 1 Label', 'Marks'];
        }

        const missing = requiredHeaders.filter(req => !headers.some(h => h.toLowerCase() === req.toLowerCase()));
        if (missing.length > 0) {
           throw new Error(`Invalid Template\nMissing Columns:\n${missing.join('\n')}`);
        }

        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        totalProcessed = json.length;

        json.forEach((row, idx) => {
          const rowIndex = idx + 2;
          
          const sectionVal = row['Section'] || '';
          const formattedSection = String(sectionVal).trim();
          
          if (formattedSection) {
            const isSectionValid = SUPPORTED_SECTIONS.some(s => s.toLowerCase() === formattedSection.toLowerCase());
            if (!isSectionValid) {
              invalidSectionCount++;
              skippedDetails.push({ row: rowIndex, reason: `Invalid Section\nSection: ${formattedSection}\nExpected:\nAptitude\nCoding\nAI Literacy\n...` });
              return;
            }
          }

          const questionText = row['Question'] || row['Question Text'] || row['QuestionText'] || row['Question 1'] || '';
          const points = Number(row['Points'] || row['Marks']) || 10;
          const sectionMap = formattedSection ? formattedSection.toUpperCase().replace(/\s*&\s*/g, '_AND_').replace(/\s+/g, '_') : 'APTITUDE';

          if (!questionText || String(questionText).trim().length < 3) {
             missingFieldsCount++;
             skippedDetails.push({ row: rowIndex, reason: 'Missing or too short Question Text.' });
             return;
          }

          if (templateType === 'mcq') {
            const optA = row['Option A'] || row['Option 1'] || row['OptionA'] || '';
            const optB = row['Option B'] || row['Option 2'] || row['OptionB'] || '';
            const optC = row['Option C'] || row['Option 3'] || row['OptionC'] || '';
            const optD = row['Option D'] || row['Option 4'] || row['OptionD'] || '';

            if (!optA || !optB || !optC || !optD || !row['Correct Answer']) {
               missingFieldsCount++;
               skippedDetails.push({ row: rowIndex, reason: 'Missing Options or Correct Answer.' });
               return;
            }

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
            else correctAnswer = rawCorrect;

            parsedQuestions.push({
              questionText: String(questionText).trim(),
              type: 'mcq',
              section: sectionMap,
              points,
              optionsJson,
              correctAnswer,
              explanation: row['Explanation'] ? String(row['Explanation']) : '',
              isPublished: true
            });
          } else if (templateType === 'coding') {
            parsedQuestions.push({
              questionText: String(questionText).trim(),
              type: 'coding',
              section: sectionMap,
              points,
              optionsJson: [],
              isPublished: true
            });
          } else if (templateType === 'open_text') {
            parsedQuestions.push({
              questionText: String(questionText).trim(),
              type: 'open_text',
              section: sectionMap,
              points,
              expectedAnswerLength: (row['Minimum Words'] || row['Maximum Words']) ? `${row['Minimum Words'] || 0}-${row['Maximum Words'] || 300}` : undefined,
              isPublished: true
            });
          } else if (templateType === 'structured_response') {
            const field1 = row['Field 1 Label'];
            const field2 = row['Field 2 Label'];
            const field3 = row['Field 3 Label'];

            if (!field1) {
               missingFieldsCount++;
               skippedDetails.push({ row: rowIndex, reason: 'Missing Field 1 Label.' });
               return;
            }

            const optionsJson = [];
            if (field1) optionsJson.push({ label: String(field1) });
            if (field2) optionsJson.push({ label: String(field2) });
            if (field3) optionsJson.push({ label: String(field3) });

            parsedQuestions.push({
              questionText: String(questionText).trim(),
              type: 'structured_response',
              section: sectionMap,
              points,
              optionsJson,
              isPublished: true
            });
          }
        });
      } else {
        throw new Error('Unsupported file format. Please upload PDF, Excel, or CSV.');
      }

      let imported = 0;
      if (parsedQuestions.length === 0 && skippedDetails.length === 0) throw new Error('No valid questions found in file.');

      if (parsedQuestions.length > 0) {
        const res = await axios.post('/api/questions/bulk', parsedQuestions, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        imported = res.data.imported || 0;
        duplicatesCount = res.data.failed || 0;
        
        if (res.data.errors && res.data.errors.length > 0) {
           res.data.errors.forEach((err: any) => {
              skippedDetails.push({ row: err.row, reason: `Backend Error: ${err.field} - ${err.reason}` });
           });
        }
      }

      setImportSummary({ 
        imported, 
        duplicates: duplicatesCount, 
        invalidSection: invalidSectionCount, 
        missingFields: missingFieldsCount, 
        total: totalProcessed,
        skippedDetails 
      });
      loadQuestions();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || e.response?.data?.message || 'Failed to upload and parse file');
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setUploadFile(null);
    setImportSummary(null);
  };

  // Local filtering logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'all' || q.section === selectedSection;
    return matchesSearch && matchesSection;
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
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
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

            <Link href="/admin/dashboard">
              <Button variant="outline" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center border-none">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Dynamic Stats Overview */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-2">
          <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm min-w-[200px]">
            <div className="bg-blue-50/80 p-2.5 rounded-xl text-blue-600 border border-blue-100/50">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total Questions</p>
              <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{totalQuestions}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex-1 md:flex-none">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Types:</div>
            {Object.keys(questionTypes).length === 0 ? (
              <span className="text-xs font-semibold text-slate-400">None</span>
            ) : (
              Object.entries(questionTypes).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="bg-slate-50 border-slate-200 text-slate-700 px-3 py-1 shadow-sm text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 transition">
                  <span className="uppercase text-[9px] text-slate-500 tracking-wider font-bold">{type}</span>
                  <span className="text-slate-900 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-sm">{count}</span>
                </Badge>
              ))
            )}
          </div>
        </div>

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
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:bg-white"
            >
              <option value="all">All Sections</option>
              <option value="APTITUDE">Aptitude</option>
              <option value="CODING">Coding</option>
              <option value="ELIGIBILITY">Eligibility</option>
              <option value="ATTITUDE_AND_OWNERSHIP">Attitude & Ownership</option>
              <option value="LEARNING_APTITUDE">Learning Aptitude</option>
              <option value="PROBLEM_SOLVING">Problem Solving</option>
              <option value="EXECUTION_AND_RELIABILITY">Execution & Reliability</option>
              <option value="COMMUNICATION_AND_TEAMWORK">Communication & Teamwork</option>
              <option value="INTEGRITY">Integrity</option>
              <option value="AI_LITERACY">AI Literacy</option>
            </select>
          </div>
          <div className="flex gap-3 shrink-0 mt-3 md:mt-0 items-center">
            {selectedQuestionIds.size > 0 && (
              <Button
                variant="destructive"
                className="bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer" onClick={() => router.push('/admin/questions/create')}>
              Create Question
            </Button>
          </div>
        </div>

        {/* Questions Table */}
        <Card className="border border-slate-150 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
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
                    <TableHead className="font-semibold text-slate-700 w-44">Section</TableHead>
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                            {q.type || 'mcq'}
                          </span>
                        </TableCell>
                        <TableCell className="w-44">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100">
                            {(q.section || 'APTITUDE').replace(/_/g, ' ')}
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
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Upload/Import Dialog */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-2">Import Questions</h2>
            
            {!importSummary ? (
              <>
                <p className="text-sm text-slate-500 mb-6">Select a template type and upload your populated Excel file.</p>
                
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 block border-b border-slate-100 pb-2">1. Download Templates</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={generateMCQTemplate} className="group p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm cursor-pointer transition flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm">MCQ</h4>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Aptitude & all MCQs</p>
                      </div>
                      <Download className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div onClick={generateCodingTemplate} className="group p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm cursor-pointer transition flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileCode2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm">Coding</h4>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Programming questions</p>
                      </div>
                      <Download className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div onClick={generateOpenTextTemplate} className="group p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-sm cursor-pointer transition flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm">Open Text</h4>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">AI Literacy, Comms</p>
                      </div>
                      <Download className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div onClick={generateStructuredTemplate} className="group p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-sm cursor-pointer transition flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LayoutTemplate className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm">Structured</h4>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Multi-field questions</p>
                      </div>
                      <Download className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 block border-b border-slate-100 pb-2">2. Select Template Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      type="button"
                      variant={templateType === 'mcq' ? 'default' : 'outline'} 
                      onClick={() => setTemplateType('mcq')}
                      className={`justify-start h-auto py-3 px-4 ${templateType === 'mcq' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600'}`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold">MCQ</span>
                      </div>
                    </Button>
                    <Button 
                      type="button"
                      variant={templateType === 'coding' ? 'default' : 'outline'} 
                      onClick={() => setTemplateType('coding')}
                      className={`justify-start h-auto py-3 px-4 ${templateType === 'coding' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-slate-600'}`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold">Coding</span>
                      </div>
                    </Button>
                    <Button 
                      type="button"
                      variant={templateType === 'open_text' ? 'default' : 'outline'} 
                      onClick={() => setTemplateType('open_text')}
                      className={`justify-start h-auto py-3 px-4 ${templateType === 'open_text' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-slate-600'}`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold">Open Text</span>
                      </div>
                    </Button>
                    <Button 
                      type="button"
                      variant={templateType === 'structured_response' ? 'default' : 'outline'} 
                      onClick={() => setTemplateType('structured_response')}
                      className={`justify-start h-auto py-3 px-4 ${templateType === 'structured_response' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-slate-600'}`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold">Structured Response</span>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="mb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 block border-b border-slate-100 pb-2">3. Choose File</h3>
                </div>

                <input 
                  type="file" 
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 p-4 cursor-pointer focus:outline-none mb-6 transition"
                />

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <Button variant="outline" className="border-slate-200" onClick={closeUploadModal}>Cancel</Button>
                  <Button onClick={handleUploadSubmit} disabled={!uploadFile || isUploading} className="bg-slate-900 text-white hover:bg-slate-800">
                    {isUploading ? 'Importing...' : 'Upload & Parse'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-bold mb-3 text-lg">Import Complete</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-700 font-medium flex items-center"><span className="w-5">✓</span> Imported: {importSummary.imported}</p>
                    {importSummary.duplicates > 0 && <p className="text-sm text-amber-600 font-medium flex items-center"><span className="w-5">⚠</span> Skipped (Duplicates): {importSummary.duplicates}</p>}
                    {importSummary.invalidSection > 0 && <p className="text-sm text-amber-600 font-medium flex items-center"><span className="w-5">⚠</span> Invalid Section: {importSummary.invalidSection}</p>}
                    {importSummary.missingFields > 0 && <p className="text-sm text-red-600 font-medium flex items-center"><span className="w-5">⚠</span> Missing Required Fields: {importSummary.missingFields}</p>}
                    <div className="pt-2 mt-2 border-t border-slate-200 text-sm text-slate-700 font-bold">
                      Total Processed: {importSummary.total}
                    </div>
                  </div>
                </div>

                {importSummary.skippedDetails.length > 0 && (
                  <div className="border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-white">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Skipped Details</h4>
                    <table className="w-full text-xs text-left text-slate-600">
                      <tbody>
                        {importSummary.skippedDetails.map((skip, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 pr-2 font-mono text-slate-900 font-medium w-16 align-top">Row {skip.row}</td>
                            <td className="py-2 whitespace-pre-line text-slate-600 align-top">{skip.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button onClick={closeUploadModal}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
