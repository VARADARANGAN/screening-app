'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { QuestionInput } from '@/lib/validators';

export function QuestionImporter() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const processFile = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (json.length === 0) {
        throw new Error('The file is empty.');
      }

      // Map excel columns to QuestionInput format
      const questions: QuestionInput[] = json.map((row, index) => {
        try {
          const type = (row['Type'] || 'mcq').toLowerCase().replace(' ', '_');
          const difficulty = (row['Difficulty'] || 'medium').toLowerCase();

          let optionsJson = [];
          if (type === 'mcq' || type === 'true_false') {
            if (row['Option 1']) optionsJson.push(String(row['Option 1']));
            if (row['Option 2']) optionsJson.push(String(row['Option 2']));
            if (row['Option 3']) optionsJson.push(String(row['Option 3']));
            if (row['Option 4']) optionsJson.push(String(row['Option 4']));

            if (type === 'true_false' && optionsJson.length === 0) {
              optionsJson = ['True', 'False'];
            }
          }

          return {
            questionText: String(row['Question Text'] || ''),
            type: type as any,
            category: String(row['Category'] || 'General'),
            difficulty: difficulty as any,
            timeLimitSeconds: Number(row['Time Limit']) || 60,
            points: Number(row['Points']) || 1,
            optionsJson: optionsJson.length > 0 ? optionsJson : undefined,
            correctAnswer: row['Correct Answer'] ? String(row['Correct Answer']) : undefined,
            explanation: row['Explanation'] ? String(row['Explanation']) : undefined,
          };
        } catch (err) {
          throw new Error(`Error parsing row ${index + 2}: Ensure all required columns are present.`);
        }
      });

      // Filter out invalid rows quickly
      const validQuestions = questions.filter(q => q.questionText.length >= 10);
      if (validQuestions.length === 0) {
        throw new Error('No valid questions found. Check column headers ("Question Text", "Type", "Category", etc).');
      }

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/questions/bulk', validQuestions, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Successfully imported ${validQuestions.length} questions!`);
      setFile(null);
      // Reset file input visually if needed

      setTimeout(() => {
        router.push('/admin/questions');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Bulk Import Questions</h2>
      <p className="text-gray-600 mb-6">
        Upload an Excel (.xlsx) or CSV file. The first row must contain the following headers:
        <br />
        <span className="font-mono text-sm text-blue-600">Question Text | Type | Category | Difficulty | Branch | Time Limit | Points | Option 1 | Option 2 | Option 3 | Option 4 | Correct Answer | Explanation</span>
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            mb-4 mx-auto"
        />
        {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={processFile}
          disabled={!file || isProcessing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isProcessing ? 'Processing...' : 'Import Questions'}
        </Button>
      </div>
    </div>
  );
}
