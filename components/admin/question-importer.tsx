'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { QuestionSchema } from '@/lib/validators';
import { mapQuestionPayload } from '@/lib/questionMapper';
import { z } from 'zod';
import * as ExcelJS from 'exceljs';
import { Download, FileSpreadsheet, FileCode2, FileText, LayoutTemplate } from 'lucide-react';

const SUPPORTED_SECTIONS = [
  'Aptitude',
  'Coding',
  'Problem Solving',
  'AI Literacy',
  'Communication & Teamwork',
  'Execution & Reliability',
  'Attitude & Ownership',
  'Integrity',
  'Learning Aptitude',
  'Eligibility'
];

export function QuestionImporter() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, field: string, reason: string}[]>([]);
  const [skippedRows, setSkippedRows] = useState<{row: number, reason: string}[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [importResults, setImportResults] = useState<{ imported: number, failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationErrors([]);
      setSkippedRows([]);
      setIsValidated(false);
      setParsedRows([]);
      setImportResults(null);
    }
  };

  const mapRowToPayload = (row: any, rowIndex: number) => {
    return mapQuestionPayload(row, rowIndex);
  };

  const validateExcel = async () => {
    if (!file) return;
    setIsProcessing(true);
    setValidationErrors([]);
    setSkippedRows([]);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (json.length === 0) {
        setValidationErrors([{ row: 0, field: 'File', reason: 'The file is empty or missing headers.' }]);
        setIsProcessing(false);
        return;
      }

      const errors: {row: number, field: string, reason: string}[] = [];
      const skipped: {row: number, reason: string}[] = [];
      const mappedRows = [];

      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const rowIndex = i + 2; // Excel row number (1-based + 1 for header)
        
        try {
          const payload = mapRowToPayload(row, rowIndex);
          
          // Validate Section
          const sectionVal = row['Section'] || payload.section || '';
          const formattedSection = String(sectionVal).trim();
          const isSectionValid = SUPPORTED_SECTIONS.some(s => s.toLowerCase() === formattedSection.toLowerCase());
          
          if (!isSectionValid) {
            skipped.push({
              row: rowIndex,
              reason: `Invalid Section:\n${formattedSection || 'Empty'}\n\nExpected:\n${SUPPORTED_SECTIONS.slice(0, 5).join('\n')}\n...`
            });
            continue;
          }

          const rowData = { ...payload };
          delete rowData._rowIndex;

          const validation = QuestionSchema.safeParse(rowData);
          if (!validation.success) {
            validation.error.issues.forEach(err => {
              errors.push({
                row: rowIndex,
                field: err.path.join('.'),
                reason: err.message
              });
            });
          }
          
          mappedRows.push(payload);
        } catch (e: any) {
          errors.push({ row: rowIndex, field: 'Parsing', reason: e.message || 'Failed to parse row' });
        }
      }

      setSkippedRows(skipped);

      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsValidated(false);
      } else {
        setParsedRows(mappedRows);
        setIsValidated(true);
      }
    } catch (e: any) {
      setValidationErrors([{ row: 0, field: 'File', reason: 'Failed to read Excel file. Please ensure it is a valid .xlsx file.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const importQuestions = async () => {
    if (!isValidated || parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/questions/bulk', parsedRows, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { imported, failed, errors } = response.data;
      setImportResults({ imported, failed: failed + skippedRows.length });
      
      if (errors && errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setTimeout(() => {
          router.push('/admin/questions');
        }, 3000);
      }
    } catch (e: any) {
      if (e.response?.data?.errors) {
        setValidationErrors(e.response.data.errors);
      } else {
        setValidationErrors([{ row: 0, field: 'Network', reason: e.response?.data?.message || 'Server error during import' }]);
      }
    } finally {
      setIsProcessing(false);
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
    sheet.addRow({
      section: 'Aptitude',
      question: 'What is 2+2?',
      optionA: '2',
      optionB: '3',
      optionC: '4',
      optionD: '5',
      correct: 'C',
      marks: '1'
    });
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
    sheet.addRow({ section: 'Coding', question: 'Write a program to reverse a string', marks: '5' });
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
    sheet.addRow({ section: 'Communication & Teamwork', question: 'Describe your leadership experience.', minWords: '100', maxWords: '300', marks: '5' });
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
    sheet.addRow({ section: 'Execution & Reliability', question: 'How would you complete this project in three days?', field1: 'Day 1', field2: 'Day 2', field3: 'Day 3', marks: '5' });
    sheet.addRow({ section: 'AI Literacy', question: 'Design an AI chatbot.', field1: 'Problem', field2: 'Solution', field3: 'Outcome', marks: '5' });
    await triggerDownload(workbook, 'structured-template.xlsx');
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Import Questions</h2>
          <p className="text-gray-600 mt-1">Download a template or upload your populated Excel file.</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Download Excel Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* MCQ Template */}
          <div onClick={generateMCQTemplate} className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">MCQ Template</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">For Aptitude, Problem Solving and all MCQ questions.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:text-blue-700">
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </div>
          </div>

          {/* Coding Template */}
          <div onClick={generateCodingTemplate} className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Coding Template</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">For coding/programming questions.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </div>
          </div>

          {/* Open Text Template */}
          <div onClick={generateOpenTextTemplate} className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Open Text Template</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">For AI Literacy, Communication, Execution & Reliability, Attitude & Ownership etc.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </div>
          </div>

          {/* Structured Response Template */}
          <div onClick={generateStructuredTemplate} className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Structured Response Template</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">For multi-field questions (Day1/Day2/Day3, Problem/Solution etc.)</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 group-hover:text-amber-700">
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </div>
          </div>

        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Choose Excel File</h3>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center mb-6 bg-slate-50 transition hover:border-blue-400 hover:bg-blue-50/30">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            mb-4 mx-auto cursor-pointer"
        />
        {file ? (
          <p className="text-sm text-slate-800 mt-2 font-medium">Selected: <span className="text-blue-600">{file.name}</span></p>
        ) : (
          <p className="text-xs text-slate-500 mt-2 font-medium">Upload .xlsx file to start parsing</p>
        )}
      </div>

      {importResults && (
        <div className="mb-6 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
            <h3 className="text-emerald-800 font-bold mb-1">Import Complete</h3>
            <p className="text-sm text-emerald-700">Successfully imported <span className="font-bold">{importResults.imported}</span> questions.</p>
            {importResults.failed > 0 && (
              <p className="text-sm text-amber-600 mt-1 font-medium">Skipped {importResults.failed} rows (duplicates or errors).</p>
            )}
          </div>
          {skippedRows.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-amber-800 font-bold mb-2">Skipped Rows ({skippedRows.length})</h3>
              <p className="text-xs text-amber-600 mb-3 font-medium">The following rows were skipped due to invalid sections. The rest of the import proceeded normally.</p>
              <div className="max-h-64 overflow-y-auto border border-amber-200 rounded-lg">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-amber-100/50 text-amber-900 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 w-20">Row</th>
                      <th className="px-4 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skippedRows.map((skip, idx) => (
                      <tr key={idx} className="border-b border-amber-100 last:border-0 bg-white">
                        <td className="px-4 py-2 font-mono text-slate-900 font-medium">{skip.row}</td>
                        <td className="px-4 py-2 whitespace-pre-line text-amber-700 text-xs">{skip.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mb-6 shadow-sm">
          <div className="bg-red-50 border border-red-200 rounded-t-xl p-4">
            <h3 className="text-red-800 font-bold">Validation Errors ({validationErrors.length})</h3>
            <p className="text-xs text-red-600 mt-1 font-medium">Please fix these structural errors in your Excel file and try again.</p>
          </div>
          <div className="max-h-64 overflow-y-auto border border-t-0 border-red-200 rounded-b-xl bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-20 font-semibold border-b border-red-100">Row</th>
                  <th className="px-4 py-3 w-48 font-semibold border-b border-red-100">Field</th>
                  <th className="px-4 py-3 font-semibold border-b border-red-100">Reason</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.map((err, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-900 font-medium">{err.row}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{err.field}</td>
                    <td className="px-4 py-2.5 text-red-600 text-xs">{err.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {isValidated && validationErrors.length === 0 && !importResults && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-sm flex items-center font-medium">
          ✅ Validation passed! Ready to import {parsedRows.length} questions.
          {skippedRows.length > 0 && (
            <span className="text-amber-600 ml-2"> (Skipping {skippedRows.length} rows with invalid sections)</span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-2">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
          className="px-6 rounded-lg font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        {!isValidated ? (
          <Button
            onClick={validateExcel}
            disabled={!file || isProcessing}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-lg font-semibold shadow-sm"
          >
            {isProcessing ? 'Validating...' : 'Validate Excel'}
          </Button>
        ) : (
          <Button
            onClick={importQuestions}
            disabled={isProcessing || importResults !== null}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-semibold shadow-sm"
          >
            {isProcessing ? 'Importing...' : `Upload & Parse`}
          </Button>
        )}
      </div>
    </div>
  );
}
