'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CreateQuestionPage() {
  const router = useRouter();
  const [type, setType] = useState('mcq');
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState(10);
  const [explanation, setExplanation] = useState('');

  // MCQ Specific State
  const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState('0');

  // Coding Specific State
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string; isPublic: boolean }>>([
    { input: '5', expectedOutput: '15', isPublic: true },
    { input: '1', expectedOutput: '1', isPublic: false },
    { input: '100', expectedOutput: '5050', isPublic: false }
  ]);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['javascript', 'python', 'cpp', 'java']);

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isPublic: false }]);
  };

  const handleUpdateTestCase = (index: number, field: 'input' | 'expectedOutput' | 'isPublic', value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleDuplicateTestCase = (index: number) => {
    const target = testCases[index];
    setTestCases([...testCases, { ...target }]);
  };

  const handleDeleteTestCase = (index: number) => {
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const addOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const updateOption = (index: number, val: string) => {
    const newOpts = [...options];
    newOpts[index].text = val;
    setOptions(newOpts);
  };

  const handleToggleLanguage = (lang: string) => {
    if (supportedLanguages.includes(lang)) {
      setSupportedLanguages(supportedLanguages.filter(l => l !== lang));
    } else {
      setSupportedLanguages([...supportedLanguages, lang]);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      let optionsJsonPayload: any = options;
      let finalCorrectAnswer = correctAnswer;

      if (type === 'coding') {
        optionsJsonPayload = {};
        finalCorrectAnswer = '';
      }

      await axios.post('/api/questions', {
        questionText,
        type,
        points: Number(points),
        timeLimitSeconds: 60,
        explanation,
        optionsJson: optionsJsonPayload,
        correctAnswer: finalCorrectAnswer,
        isPublished: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      router.push('/admin/questions');
    } catch (e) {
      alert('Failed to save question');
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Question</h1>
            <p className="text-slate-500 text-xs mt-1">Add reusable MCQ or coding questions to the global repository</p>
          </div>
          <button onClick={() => router.back()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition cursor-pointer">
            ← Back
          </button>
        </div>

        <Card className="border border-slate-150 rounded-2xl shadow-sm overflow-hidden bg-white">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Question Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="coding">Coding Challenge</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1">Universal Repository Question</label>
                <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium">
                  Stored globally and unassigned. Accessible from Test Creation flow.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {type === 'coding' ? 'Problem Statement' : 'Question Prompt'}
              </label>
              <Textarea 
                value={questionText} 
                onChange={(e) => setQuestionText(e.target.value)} 
                placeholder={type === 'coding' ? 'Write the coding problem statement here...' : 'Write your question here...'}
                rows={4}
                className="w-full bg-slate-50 border-slate-200"
              />
            </div>

            {/* MCQ SECTION */}
            {type === 'mcq' && (
              <div className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">MCQ Options Configuration</h3>
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={correctAnswer === String(i)}
                      onChange={() => setCorrectAnswer(String(i))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <Input 
                      value={opt.text} 
                      onChange={(e) => updateOption(i, e.target.value)} 
                      placeholder={`Option ${i + 1}`}
                      className="bg-white border-slate-200"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="border-slate-200 text-slate-700 bg-white">
                  + Add Option
                </Button>
              </div>
            )}



            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Marks</label>
                <Input 
                  type="number" 
                  min="0"
                  max="100"
                  value={points} 
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)} 
                  className="w-full bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Explanation (Optional)</label>
                <Input 
                  value={explanation} 
                  onChange={(e) => setExplanation(e.target.value)} 
                  placeholder="Explain correct answer..."
                  className="w-full bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button onClick={handleSave} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer">
                Save Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
