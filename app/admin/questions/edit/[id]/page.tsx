'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { LatexEditor } from '@/components/ui/latex-editor';
import { mapQuestionPayload } from '@/lib/questionMapper';
import { toast } from 'react-hot-toast';

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
  const [options, setOptions] = useState<any[]>([{ text: '' }, { text: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState('0');

  // Structured Response Specific State
  const [structuredFields, setStructuredFields] = useState([{ id: 1, label: '' }, { id: 2, label: '' }, { id: 3, label: '' }]);

  // Structured Plan Specific State
  const [planMode, setPlanMode] = useState('day');
  const [planDays, setPlanDays] = useState(5);
  const [planLabels, setPlanLabels] = useState(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']);

  // Word Limits Specifics
  const [minWords, setMinWords] = useState('');
  const [maxWords, setMaxWords] = useState('');
  const [minCharacters, setMinCharacters] = useState('');
  const [maxCharacters, setMaxCharacters] = useState('');

  // Ranking Specific State
  const [allowPartialMarks, setAllowPartialMarks] = useState(false);

  // Scenario Specifics
  const [scenario, setScenario] = useState('');
  const [caseStudyTitle, setCaseStudyTitle] = useState('');
  const [caseStudyBackground, setCaseStudyBackground] = useState('');
  const [caseStudyContext, setCaseStudyContext] = useState('');
  const [caseStudyProblemStatement, setCaseStudyProblemStatement] = useState('');
  const [caseStudySupportingInfo, setCaseStudySupportingInfo] = useState('');

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

      if (['mcq', 'yes_no', 'single_select', 'multi_select', 'coding_mcq', 'ranking'].includes(q.type)) {
        let parsedOptions = [{ text: '' }, { text: '' }];
        const optionsArray = Array.isArray(q.options_json) 
          ? q.options_json 
          : (q.options_json?.options || null);

        if (Array.isArray(optionsArray)) {
          if (q.type === 'ranking') {
            const correctOrder = q.correct_answer ? JSON.parse(q.correct_answer) : [];
            parsedOptions = optionsArray.map((opt: any) => {
              const text = typeof opt === 'object' && opt !== null && 'text' in opt ? opt.text : String(opt);
              const rank = correctOrder.indexOf(text) !== -1 ? String(correctOrder.indexOf(text) + 1) : '';
              return { text, rank };
            });
            setAllowPartialMarks(!!q.options_json?.allowPartialMarks);
          } else {
            parsedOptions = optionsArray.map((opt: any) => 
              typeof opt === 'object' && opt !== null && 'text' in opt ? opt : { text: String(opt) }
            );
          }
        }
        setOptions(parsedOptions);
        setCorrectAnswer(q.correct_answer || '0');
      } else if (q.type === 'structured_response') {
        const opts = q.options_json || {};
        setStructuredFields(Array.isArray(opts.fields) && opts.fields.length > 0 ? opts.fields : [{ id: 1, label: '' }, { id: 2, label: '' }, { id: 3, label: '' }]);
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
      toast.error('Failed to load question details.');
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

  const handleSave = async (status: 'published' | 'draft') => {
    try {
      const token = localStorage.getItem('token');
      
      const rawData: any = {
        type,
        section,
        questionText,
        points,
        weight,
        isPublished: status === 'published'
      };

      if (['mcq', 'yes_no', 'single_select', 'multi_select', 'coding_mcq', 'ranking'].includes(type)) {
        rawData.options = options;
        if (type !== 'single_select' && type !== 'ranking') {
          if (type === 'multi_select') {
            try {
              const parsed = JSON.parse(correctAnswer);
              if (!Array.isArray(parsed) || parsed.length === 0) {
                toast.error('At least one correct answer must be selected for Multi Select.');
                return;
              }
            } catch {
              toast.error('At least one correct answer must be selected for Multi Select.');
              return;
            }
          }
          rawData.correctAnswer = correctAnswer;
        }
        if (type === 'ranking') {
           rawData.allowPartialMarks = allowPartialMarks;
           const ranks = options.map(o => o.rank).filter(Boolean);
           const uniqueRanks = new Set(ranks);
           if (ranks.length !== options.length || uniqueRanks.size !== options.length) {
              toast.error('Every option must have a unique rank before saving.');
              return;
           }
           const expectedRanks = Array.from({length: options.length}, (_, i) => String(i + 1));
           const sortedRanks = [...ranks].sort((a: any, b: any) => Number(a) - Number(b));
           if (JSON.stringify(sortedRanks) !== JSON.stringify(expectedRanks)) {
              toast.error('Ranks must be exactly 1 to ' + options.length);
              return;
           }
        }
      }

      if (type === 'coding') {
        rawData.constraints = constraints;
        rawData.sampleInput = sampleInput;
        rawData.sampleOutput = sampleOutput;
        rawData.starterCode = '';
        rawData.language = 'javascript';
      }

      if (['scenario', 'ai_scenario'].includes(type)) {
        rawData.scenario = scenario;
      }

      if (['case_study', 'ai_scenario'].includes(type)) {
        rawData.caseStudyTitle = caseStudyTitle;
        rawData.caseStudyBackground = caseStudyBackground;
        rawData.caseStudyContext = caseStudyContext;
        rawData.caseStudyProblemStatement = caseStudyProblemStatement;
        rawData.caseStudySupportingInfo = caseStudySupportingInfo;
      }

      if (['descriptive', 'scenario', 'case_study', 'ai_scenario', 'open_text', 'structured_response', 'structured_plan', 'code_response', 'code_review', 'prompt_writing', 'ranking', 'date'].includes(type)) {
        rawData.minCharacters = minCharacters;
        rawData.maxCharacters = maxCharacters;
        rawData.expectedDuration = expectedDuration;
        rawData.expectedAnswerLength = expectedAnswerLength;
        rawData.isRequired = isRequired;
      }

      if (type === 'structured_response') {
        rawData.fields = structuredFields;
      }

      if (type === 'structured_plan') {
        rawData.planMode = planMode;
        rawData.planDays = planDays;
        rawData.planLabels = planLabels;
      }

      if (['open_text', 'structured_response', 'structured_plan', 'prompt_writing', 'code_review', 'descriptive', 'short_answer'].includes(type)) {
        rawData.minWords = minWords;
        rawData.maxWords = maxWords;
      }

      const payload = mapQuestionPayload(rawData);
      
      // Clean undefined/null fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      console.log('Outgoing payload:', payload);

      await axios.put(`/api/questions/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Question updated successfully');
      router.push('/admin/questions');
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || 'Failed to update question';
      if (e.response?.data?.errors) {
        const validationErrors = e.response.data.errors.map((err: any) => err.message).join('\n');
        toast.error(`Validation Error: ${validationErrors}`);
      } else {
        toast.error(errorMsg);
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading question details...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Top Navbar / Back Button */}
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline"
            onClick={() => router.back()} 
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center cursor-pointer border-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Question</h1>
            <p className="text-slate-500 text-xs mt-1">Modify properties of this global repository question</p>
          </div>
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
                  <option value="single_select">Single Select</option>
                  <option value="multi_select">Multi Select</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="descriptive">Descriptive Assessment</option>
                  <option value="ranking">Ranking</option>
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

            {/* MCQ & SELECT OPTIONS SECTION */}
            {['mcq', 'single_select', 'multi_select'].includes(type) && (
              <div className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">
                  {type === 'single_select' ? 'Options Configuration' : 'Options & Correct Answer Configuration'}
                </h3>
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    {type !== 'single_select' && (
                      type === 'multi_select' ? (
                        <input 
                          type="checkbox" 
                          checked={(() => {
                            try {
                              const parsed = JSON.parse(correctAnswer);
                              return Array.isArray(parsed) && parsed.includes(String(i));
                            } catch {
                              return false;
                            }
                          })()}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(correctAnswer);
                              const arr = Array.isArray(parsed) ? parsed : [];
                              let newArr;
                              if (e.target.checked) {
                                newArr = [...arr, String(i)];
                              } else {
                                newArr = arr.filter(v => v !== String(i));
                              }
                              setCorrectAnswer(JSON.stringify(newArr));
                            } catch {
                              setCorrectAnswer(JSON.stringify([String(i)]));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                        />
                      ) : (
                        <input 
                          type="radio" 
                          name="correct" 
                          checked={correctAnswer === String(i)}
                          onChange={() => setCorrectAnswer(String(i))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                      )
                    )}
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

              {/* RANKING SECTION */}
              {type === 'ranking' && (
                <div className="p-5 border border-slate-150 rounded-xl bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">Options & Correct Rank</h3>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                       <input type="checkbox" checked={allowPartialMarks} onChange={e => setAllowPartialMarks(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                       <span className="font-semibold text-slate-700">Allow Partial Marks</span>
                    </label>
                  </div>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <select 
                        value={opt.rank || ''} 
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[i].rank = e.target.value;
                          setOptions(newOpts);
                        }}
                        className="h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white min-w-[100px] outline-none focus:border-blue-500"
                      >
                        <option value="">Rank ▼</option>
                        {options.map((_, idx) => (
                          <option key={idx + 1} value={String(idx + 1)}>{idx + 1}</option>
                        ))}
                      </select>
                      <Input 
                        value={opt.text} 
                        onChange={(e) => updateOption(i, e.target.value)} 
                        placeholder={`Option ${i + 1}`}
                        className="bg-white border-slate-200"
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500 font-bold px-2">×</button>
                      )}
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
                <h3 className="font-bold text-slate-800 text-sm">Response Fields</h3>
                <div className="space-y-4">
                  {structuredFields.map((field, i) => (
                    <div key={i}>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Field {i + 1} Label</label>
                      <Input 
                        value={field.label} 
                        onChange={(e) => {
                          const newFields = [...structuredFields];
                          newFields[i].label = e.target.value;
                          setStructuredFields(newFields);
                        }} 
                        placeholder={`e.g. Field ${i + 1}`}
                        className="bg-white border-slate-200 max-w-sm"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    {structuredFields.length < 6 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setStructuredFields([...structuredFields, { id: structuredFields.length + 1, label: '' }])} className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
                        + Add Field
                      </Button>
                    )}
                    {structuredFields.length > 2 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setStructuredFields(structuredFields.slice(0, -1))} className="border-slate-200 text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-600">
                        - Remove Last Field
                      </Button>
                    )}
                  </div>
                </div>
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
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer">
                Update Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
