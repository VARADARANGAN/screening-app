'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { QuestionSchema } from '@/lib/validators';
import { mapQuestionPayload } from '@/lib/questionMapper';
import { z } from 'zod';

export function QuestionImporter() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{row: number, field: string, reason: string}[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [importResults, setImportResults] = useState<{ imported: number, failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationErrors([]);
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
      const mappedRows = [];

      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const rowIndex = i + 2; // Excel row number (1-based + 1 for header)
        
        try {
          const payload = mapRowToPayload(row, rowIndex);
          
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
      setImportResults({ imported, failed });
      
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

  const downloadTemplate = () => {
    const headers = [
      'Question Text', 'Question Type', 'Section', 'Points', 'Time Limit', 'Difficulty', 'Correct Answer', 'Explanation',
      'Option 1', 'Option 2', 'Option 3', 'Option 4',
      'Constraints', 'Sample Input', 'Sample Output', 'Starter Code', 'Language'
    ];

    const sampleRows = [
      {
        'Question Text': 'What is 2+2?',
        'Question Type': 'MCQ',
        'Section': 'Aptitude',
        'Points': 10,
        'Time Limit': 60,
        'Difficulty': 'Easy',
        'Option 1': '3',
        'Option 2': '4',
        'Option 3': '5',
        'Option 4': '6',
        'Correct Answer': '1', // Index 1 is Option 2
        'Explanation': 'Basic math'
      },
      {
        'Question Text': 'Write a function to reverse a string.',
        'Question Type': 'Coding',
        'Section': 'Coding',
        'Points': 50,
        'Time Limit': 1800,
        'Difficulty': 'Medium',
        'Constraints': 'O(n) time',
        'Sample Input': '"hello"',
        'Sample Output': '"olleh"',
        'Starter Code': 'function reverse(s) { }',
        'Language': 'javascript'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'Question_Bank_Template.xlsx');
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h2>
          <p className="text-gray-600 mt-1">Upload a populated Excel template to import questions into the bank.</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
          ⬇ Download Template
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center mb-6 bg-slate-50 transition hover:border-blue-400">
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
        {file && <p className="text-sm text-slate-800 mt-2 font-medium">Selected: {file.name}</p>}
      </div>

      {importResults && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
          <h3 className="text-green-800 font-bold mb-1">Import Complete</h3>
          <p className="text-sm text-green-700">Successfully imported {importResults.imported} questions.</p>
          {importResults.failed > 0 && (
            <p className="text-sm text-amber-600 mt-1">Skipped {importResults.failed} invalid rows.</p>
          )}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-t-lg p-3">
            <h3 className="text-red-800 font-bold">Validation Errors ({validationErrors.length})</h3>
            <p className="text-xs text-red-600">Please fix these errors in your Excel file and try again.</p>
          </div>
          <div className="max-h-64 overflow-y-auto border border-t-0 border-red-200 rounded-b-lg">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-100 text-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 w-20">Row</th>
                  <th className="px-4 py-2 w-48">Field</th>
                  <th className="px-4 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.map((err, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-slate-900">{err.row}</td>
                    <td className="px-4 py-2 font-medium">{err.field}</td>
                    <td className="px-4 py-2 text-red-600">{err.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isValidated && validationErrors.length === 0 && !importResults && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          ✅ Validation passed! Ready to import {parsedRows.length} questions.
        </div>
      )}

      <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
        >
          Cancel
        </Button>
        {!isValidated ? (
          <Button
            onClick={validateExcel}
            disabled={!file || isProcessing}
            className="bg-slate-800 hover:bg-slate-900 text-white"
          >
            {isProcessing ? 'Validating...' : 'Validate Excel'}
          </Button>
        ) : (
          <Button
            onClick={importQuestions}
            disabled={isProcessing || importResults !== null}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? 'Importing...' : `Import ${parsedRows.length} Questions`}
          </Button>
        )}
      </div>
    </div>
  );
}
