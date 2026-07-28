'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LatexEditor } from '@/components/ui/latex-editor';

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState('mcq');
  const [section, setSection] = useState('APTITUDE');
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState(10);

  // Descriptive Specific State
  const [assessmentDimension, setAssessmentDimension] = useState('ATTITUDE');
  const [weight, setWeight] = useState(1);
  const [expectedDuration, setExpectedDuration] = useState(5);
  const [expectedAnswerLength, setExpectedAnswerLength] = useState(150);
  const [isRequired, setIsRequired] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  // MCQ Specific State
  const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState('0');

  // Structured Response Specific State
  const [structuredFields, setStructuredFields] = useState([{ label: '', placeholder: '', helpText: '', required: true, maxLength: '' }]);

  // Structured Plan Specific State
  const [planMode, setPlanMode] = useState('day');
  const [planDays, setPlanDays] = useState(5);
  const [planLabels, setPlanLabels] = useState(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']);

  // Word Limits Specifics
  const [minWords, setMinWords] = useState('');
  const [maxWords, setMaxWords] = useState('');

  // Coding Specific State
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string; isPublic: boolean }>>([]);
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

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const q = data.question;

      setType(q.type || 'mcq');
      setSection(q.section || 'APTITUDE');
      setQuestionText(q.question_text || '');
      setPoints(q.points || 10);
      setAssessmentDimension(q.assessment_dimension || 'ATTITUDE');
      setWeight(q.weight || 1);
      setExpectedDuration(q.expected_duration || 5);
      setExpectedAnswerLength(q.expected_answer_length || 150);
      setIsRequired(q.is_required !== false);
      setDisplayOrder(q.display_order || 0);

      if (q.type === 'mcq') {
        let parsedOptions = [{ text: '' }, { text: '' }];
        const optionsArray = Array.isArray(q.options_json) 
          ? q.options_json 
          : (q.options_json?.options || null);

        if (Array.isArray(optionsArray)) {
          parsedOptions = optionsArray.map((opt: any) => 
            typeof opt === 'object' && opt !== null && 'text' in opt ? opt : { text: String(opt) }
          );
        }
        setOptions(parsedOptions);
        setCorrectAnswer(q.correct_answer || '0');
      } else if (q.type === 'structured_response') {
        const opts = q.options_json || {};
        setStructuredFields(Array.isArray(opts.fields) && opts.fields.length > 0 ? opts.fields : [{ label: '', placeholder: '', helpText: '', required: true, maxLength: '' }]);
      } else if (q.type === 'structured_plan') {
        const opts = q.options_json || {};
        setPlanMode(opts.mode || 'day');
        setPlanDays(opts.days || 5);
        setPlanLabels(Array.isArray(opts.labels) && opts.labels.length > 0 ? opts.labels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']);
      } else if (q.type === 'coding') {
        const opts = q.options_json || {};
        setConstraints(opts.constraints || '');
        setInputFormat(opts.inputFormat || '');
        setOutputFormat(opts.outputFormat || '');
        setSampleInput(opts.sampleInput || '');
        setSampleOutput(opts.sampleOutput || '');
        
        const publics = (opts.publicTestCases || []).map((tc: any) => ({ ...tc, isPublic: true }));
        const hiddens = (opts.hiddenTestCases || []).map((tc: any) => ({ ...tc, isPublic: false }));
        setTestCases([...publics, ...hiddens]);
        
        setSupportedLanguages(opts.supportedLanguages || ['javascript', 'python', 'cpp', 'java']);
      }

      if (['open_text', 'structured_response', 'structured_plan', 'prompt_writing', 'code_review', 'descriptive', 'short_answer'].includes(q.type)) {
        const opts = q.options_json || {};
        setMinWords(opts.minWords || '');
        setMaxWords(opts.maxWords || '');
      }
    } catch (e) {
      console.error('Failed to fetch question', e);
      alert('Failed to load question details.');
    } finally {
      setIsLoading(false);
    }
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
      
      let payload: any = {
        questionText,
        type,
        section,
        points: Number(points),
        timeLimitSeconds: 60,
        isPublished: true
      };

      if (type === 'mcq') {
        payload.optionsJson = options;
        payload.correctAnswer = correctAnswer;
      } else if (type === 'coding') {
        payload.optionsJson = {
          constraints,
          sampleInput,
          sampleOutput,
          starterCode: '',
          supportedLanguages,
          publicTestCases: testCases.filter(t => t.isPublic).map(({ isPublic, ...rest }) => rest),
          hiddenTestCases: testCases.filter(t => !t.isPublic).map(({ isPublic, ...rest }) => rest),
          language: supportedLanguages.length > 0 ? supportedLanguages[0] : 'javascript'
        };
        payload.correctAnswer = '';
      } else if (type === 'structured_response') {
        payload.optionsJson = { fields: structuredFields };
        payload.correctAnswer = '';
      } else if (type === 'structured_plan') {
        payload.optionsJson = { mode: planMode, days: planDays, labels: planLabels };
        payload.correctAnswer = '';
      } else if (type === 'descriptive') {
        payload.optionsJson = {};
        payload.correctAnswer = '';
        payload.assessmentDimension = assessmentDimension;
        payload.weight = Number(weight);
        payload.expectedDuration = Number(expectedDuration);
        payload.expectedAnswerLength = Number(expectedAnswerLength);
        payload.isRequired = isRequired;
        payload.displayOrder = Number(displayOrder);
      }

      if (['open_text', 'structured_response', 'structured_plan', 'prompt_writing', 'code_review', 'descriptive', 'short_answer'].includes(type)) {
        payload.optionsJson = payload.optionsJson || {};
        payload.optionsJson.minWords = minWords;
        payload.optionsJson.maxWords = maxWords;
      }

      await axios.put(`/api/questions/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      router.push('/admin/questions');
    } catch (e) {
      alert('Failed to update question');
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading question details...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Question</h1>
            <p className="text-slate-500 text-xs mt-1">Modify properties of this global repository question</p>
          </div>
          <button onClick={() => router.back()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition cursor-pointer">
            ← Back
          </button>
        </div>

        <Card className="border border-slate-150 rounded-2xl shadow-sm overflow-hidden bg-white">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assessment Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                >
                  <option value="ELIGIBILITY">Eligibility</option>
                  <option value="APTITUDE">Aptitude</option>
                  <option value="CODING">Coding</option>
                  <option value="ATTITUDE">Attitude</option>
                  <option value="LEARNING">Learning</option>
                  <option value="PROBLEM_SOLVING">Problem Solving</option>
                  <option value="EXECUTION">Execution</option>
                  <option value="COMMUNICATION">Communication</option>
                  <option value="INTEGRITY">Integrity</option>
                  <option value="AI_LITERACY">AI Literacy</option>
                  <option value="PRACTICAL">Practical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Question Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="descriptive">Descriptive Assessment</option>
                  <option value="structured_response">Structured Response</option>
                  <option value="structured_plan">Structured Plan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-1">Universal Repository Question</label>
              <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium">
                Stored globally and unassigned. Modifying will affect future test launches.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {type === 'coding' ? 'Problem Statement (Supports Markdown & LaTeX)' : 'Question Prompt (Supports Markdown & LaTeX)'}
              </label>
              <LatexEditor 
                value={questionText} 
                onChange={setQuestionText} 
                placeholder={type === 'coding' ? 'Write the coding problem statement here...' : 'Write your question here using Markdown or LaTeX ($...$)...'}
                rows={6}
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

            {/* STRUCTURED RESPONSE SECTION */}
            {type === 'structured_response' && (
              <div className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Response Structure</h3>
                <div className="space-y-4">
                  {structuredFields.map((field, i) => (
                    <div key={i} className="p-4 border border-slate-200 rounded-xl bg-white space-y-4 relative">
                      {structuredFields.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setStructuredFields(structuredFields.filter((_, idx) => idx !== i))}
                          className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                      <h4 className="font-bold text-slate-700 text-sm">Field {i + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Field Label *</label>
                          <Input 
                            value={field.label} 
                            onChange={(e) => {
                              const newFields = [...structuredFields];
                              newFields[i].label = e.target.value;
                              setStructuredFields(newFields);
                            }} 
                            placeholder="e.g. Topic Learned"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Placeholder</label>
                          <Input 
                            value={field.placeholder} 
                            onChange={(e) => {
                              const newFields = [...structuredFields];
                              newFields[i].placeholder = e.target.value;
                              setStructuredFields(newFields);
                            }} 
                            placeholder="e.g. Enter the topic..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Help Text (Optional)</label>
                          <Input 
                            value={field.helpText} 
                            onChange={(e) => {
                              const newFields = [...structuredFields];
                              newFields[i].helpText = e.target.value;
                              setStructuredFields(newFields);
                            }} 
                            placeholder="e.g. Provide details about..."
                          />
                        </div>
                        <div className="flex items-center justify-between border border-slate-200 p-3 rounded-md">
                           <div className="text-xs font-bold text-slate-600">Required Field</div>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               className="sr-only peer" 
                               checked={field.required} 
                               onChange={(e) => {
                                 const newFields = [...structuredFields];
                                 newFields[i].required = e.target.checked;
                                 setStructuredFields(newFields);
                               }} 
                             />
                             <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                           </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setStructuredFields([...structuredFields, { label: '', placeholder: '', helpText: '', required: true, maxLength: '' }])} className="border-slate-200 text-slate-700 bg-white">
                  + Add Field
                </Button>
              </div>
            )}

            {/* STRUCTURED PLAN SECTION */}
            {type === 'structured_plan' && (
              <div className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Planning Mode</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="planMode" checked={planMode === 'day'} onChange={() => {
                      setPlanMode('day');
                      setPlanLabels(Array.from({ length: planDays }, (_, i) => `Day ${i + 1}`));
                    }} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-slate-700">Day-wise Plan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="planMode" checked={planMode === 'step'} onChange={() => {
                      setPlanMode('step');
                      setPlanLabels(['Step 1', 'Step 2', 'Step 3']);
                    }} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-slate-700">Step-wise Plan</span>
                  </label>
                </div>

                {planMode === 'day' && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Number of Days (1-30)</label>
                    <Input 
                      type="number"
                      min="1" max="30"
                      value={planDays}
                      onChange={(e) => {
                        const days = Math.max(1, Math.min(30, Number(e.target.value)));
                        setPlanDays(days);
                        setPlanLabels(Array.from({ length: days }, (_, i) => `Day ${i + 1}`));
                      }}
                      className="bg-white border-slate-200 max-w-[150px]"
                    />
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm">{planMode === 'day' ? 'Day Labels' : 'Step Labels'}</h4>
                  {planLabels.map((label, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={label}
                        onChange={(e) => {
                          const newLabels = [...planLabels];
                          newLabels[i] = e.target.value;
                          setPlanLabels(newLabels);
                        }}
                        className="bg-white border-slate-200 max-w-sm"
                        placeholder={planMode === 'day' ? `Day ${i + 1}` : `Step ${i + 1}`}
                      />
                      {planMode === 'step' && planLabels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPlanLabels(planLabels.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-rose-500 font-bold p-2 transition-colors"
                        >✕</button>
                      )}
                    </div>
                  ))}
                  {planMode === 'step' && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setPlanLabels([...planLabels, `Step ${planLabels.length + 1}`])} className="text-slate-600 bg-white border-slate-200 hover:bg-slate-50">
                      + Add Step
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* DESCRIPTIVE SECTION */}
            {type === 'descriptive' && (
              <div className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Descriptive Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Dimension</label>
                    <select
                      value={assessmentDimension}
                      onChange={(e) => setAssessmentDimension(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="ATTITUDE">Attitude</option>
                      <option value="LEARNING">Learning</option>
                      <option value="PROBLEM_SOLVING">Problem Solving</option>
                      <option value="EXECUTION">Execution</option>
                      <option value="COMMUNICATION">Communication</option>
                      <option value="INTEGRITY">Integrity</option>
                      <option value="AI_LITERACY">AI Literacy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Weight</label>
                    <Input 
                      type="number" min="1" max="100"
                      value={weight} onChange={(e) => setWeight(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Duration (mins)</label>
                    <Input 
                      type="number" min="1" max="120"
                      value={expectedDuration} onChange={(e) => setExpectedDuration(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Answer Length (words)</label>
                    <Input 
                      type="number" min="10" max="2000"
                      value={expectedAnswerLength} onChange={(e) => setExpectedAnswerLength(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                    <Input 
                      type="number" min="0" max="100"
                      value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div className="flex items-center mt-6">
                    <input 
                      type="checkbox" 
                      id="isRequired"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded mr-2"
                    />
                    <label htmlFor="isRequired" className="text-xs font-semibold text-slate-700">Required Question</label>
                  </div>
                </div>
              </div>
            )}


            {/* Word Limits Section */}
            {['open_text', 'structured_response', 'structured_plan', 'prompt_writing', 'code_review', 'descriptive', 'short_answer'].includes(type) && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Word Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Minimum Words (Optional)</label>
                    <Input 
                      type="number"
                      min="0"
                      value={minWords} 
                      onChange={(e) => setMinWords(e.target.value)} 
                      className="bg-white border-slate-200" 
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Maximum Words (Optional)</label>
                    <Input 
                      type="number"
                      min="0"
                      value={maxWords} 
                      onChange={(e) => setMaxWords(e.target.value)} 
                      className="bg-white border-slate-200" 
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
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
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button onClick={handleSave} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer">
                Update Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
