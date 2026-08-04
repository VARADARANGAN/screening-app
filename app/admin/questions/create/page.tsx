'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LatexEditor } from '@/components/ui/latex-editor';
import { mapQuestionPayload } from '@/lib/questionMapper';
import { toast } from 'react-hot-toast';
import { 
  Brain, 
  Code, 
  ClipboardList, 
  Users, 
  GraduationCap, 
  Settings, 
  MessageSquare, 
  Shield, 
  Bot,
  ArrowLeft,
  ArrowRight 
} from 'lucide-react';

// --- Configuration Data ---
const ASSESSMENTS = [
  { id: 'APTITUDE', title: 'Aptitude', desc: 'Quantitative Ability, Logical Reasoning, Verbal Ability.', icon: <Brain className="w-8 h-8" /> },
  { id: 'CODING', title: 'Coding', desc: 'Programming Challenges and Coding MCQs.', icon: <Code className="w-8 h-8" /> },
  { id: 'ELIGIBILITY', title: 'Eligibility', desc: 'Screening questions to determine candidate eligibility.', icon: <ClipboardList className="w-8 h-8" /> },
  { id: 'ATTITUDE_AND_OWNERSHIP', title: 'Attitude & Ownership', desc: 'Evaluate candidate ownership and attitude.', icon: <Users className="w-8 h-8" /> },
  { id: 'LEARNING_APTITUDE', title: 'Learning Aptitude', desc: 'Evaluate learning agility and comprehension.', icon: <GraduationCap className="w-8 h-8" /> },
  { id: 'PROBLEM_SOLVING', title: 'Problem Solving', desc: 'Assess problem solving strategies and logic.', icon: <Brain className="w-8 h-8" /> },
  { id: 'EXECUTION_AND_RELIABILITY', title: 'Execution & Reliability', desc: 'Evaluate task execution and planning.', icon: <Settings className="w-8 h-8" /> },
  { id: 'COMMUNICATION_AND_TEAMWORK', title: 'Communication & Teamwork', desc: 'Assess written communication and teamwork.', icon: <MessageSquare className="w-8 h-8" /> },
  { id: 'INTEGRITY', title: 'Integrity', desc: 'Evaluate ethical behavior and integrity.', icon: <Shield className="w-8 h-8" /> },
  { id: 'AI_LITERACY', title: 'AI Literacy', desc: 'Assess prompt engineering and AI tool proficiency.', icon: <Bot className="w-8 h-8" /> }
];

const QUESTION_TYPES: Record<string, Array<{ id: string, label: string }>> = {
  APTITUDE: [
    { id: 'mcq', label: 'Multiple Choice (MCQ)' }
  ],
  CODING: [
    { id: 'coding', label: 'Coding Challenge' },
    { id: 'coding_mcq', label: 'Coding MCQ' }
  ],
  ELIGIBILITY: [
    { id: 'single_select', label: 'Single Select' },
    { id: 'open_text', label: 'Open Text' }
  ],
  ATTITUDE_AND_OWNERSHIP: [
    { id: 'mcq', label: 'Multiple Choice (MCQ)' },
    { id: 'open_text', label: 'Open Text' },
    { id: 'ranking', label: 'Ranking' }
  ],
  LEARNING_APTITUDE: [
    { id: 'open_text', label: 'Open Text' },
    { id: 'structured_response', label: 'Structured Response' }
  ],
  PROBLEM_SOLVING: [
    { id: 'structured_response', label: 'Structured Response' },
    { id: 'open_text', label: 'Open Text' }
  ],
  EXECUTION_AND_RELIABILITY: [
    { id: 'structured_response', label: 'Structured Response' },
    { id: 'open_text', label: 'Open Text' }
  ],
  COMMUNICATION_AND_TEAMWORK: [
    { id: 'open_text', label: 'Open Text' }
  ],
  INTEGRITY: [
    { id: 'mcq', label: 'Multiple Choice (MCQ)' },
    { id: 'open_text', label: 'Open Text' }
  ],
  AI_LITERACY: [
    { id: 'multi_select', label: 'Multi Select' },
    { id: 'open_text', label: 'Open Text' }
  ]
};

export default function CreateQuestionPage() {
  const router = useRouter();
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  
  // Data State
  const [section, setSection] = useState('');
  const [type, setType] = useState('');
  
  // Question Fields
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState(10);
  const [options, setOptions] = useState<any[]>([{ text: '' }, { text: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState('0');
  
  // Descriptive / Behaviour / Eligibility specifics
  const [isRequired, setIsRequired] = useState(true);
  const [expectedDuration, setExpectedDuration] = useState(5);
  const [expectedAnswerLength, setExpectedAnswerLength] = useState(150);
  const [weight, setWeight] = useState(1);
  const [scenario, setScenario] = useState('');
  
  const [minCharacters, setMinCharacters] = useState(50);
  const [maxCharacters, setMaxCharacters] = useState(0);

  // Case Study specifics
  const [caseStudyTitle, setCaseStudyTitle] = useState('');
  const [caseStudyBackground, setCaseStudyBackground] = useState('');
  const [caseStudyContext, setCaseStudyContext] = useState('');
  const [caseStudyProblemStatement, setCaseStudyProblemStatement] = useState('');
  const [caseStudySupportingInfo, setCaseStudySupportingInfo] = useState('');
  
  // Coding specifics
  const [constraints, setConstraints] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  
  // Structured Response Specifics
  const [structuredFields, setStructuredFields] = useState([{ id: 1, label: '' }, { id: 2, label: '' }, { id: 3, label: '' }]);
  
  // Structured Plan Specifics
  const [planMode, setPlanMode] = useState('day');
  const [planDays, setPlanDays] = useState(5);
  const [planLabels, setPlanLabels] = useState(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']);

  // Word Limits Specifics
  const [minWords, setMinWords] = useState('');
  const [maxWords, setMaxWords] = useState('');

  // Ranking Specifics
  const [allowPartialMarks, setAllowPartialMarks] = useState(false);

  // Resets state when starting over
  const resetForm = () => {
    setStep(1);
    setIsSaved(false);
    setSection('');
    setType('');
    setQuestionText('');
    setPoints(10);
    setOptions([{ text: '' }, { text: '' }]);
    setCorrectAnswer('0');
    setExpectedDuration(5);
    setExpectedAnswerLength(150);
    setWeight(1);
    setScenario('');
    setMinCharacters(50);
    setMaxCharacters(0);
    setCaseStudyTitle('');
    setCaseStudyBackground('');
    setCaseStudyContext('');
    setCaseStudyProblemStatement('');
    setCaseStudySupportingInfo('');
    setConstraints('');
    setSampleInput('');
    setSampleOutput('');
    setStructuredFields([{ id: 1, label: '' }, { id: 2, label: '' }, { id: 3, label: '' }]);
    setPlanMode('day');
    setPlanDays(5);
    setPlanLabels(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']);
    setMinWords('');
    setMaxWords('');
    setAllowPartialMarks(false);
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // Logic flags
  const requiresLatex = (section === 'APTITUDE' || section === 'CODING');
  const showsMarks = (section === 'APTITUDE' || section === 'CODING');

  // Save Function
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
        if (type !== 'ranking') {
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

      if (['scenario', 'case_study', 'ai_scenario', 'open_text', 'structured_response', 'ranking'].includes(type)) {
        rawData.minCharacters = minCharacters;
        rawData.maxCharacters = maxCharacters;
        rawData.expectedDuration = expectedDuration;
        rawData.expectedAnswerLength = expectedAnswerLength;
        rawData.isRequired = isRequired;
      }

      if (type === 'structured_response') {
        rawData.fields = structuredFields;
      }

      if (['open_text', 'structured_response'].includes(type)) {
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



      await axios.post('/api/questions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Question saved successfully');
      setIsSaved(true);
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || 'Failed to save question';
      if (e.response?.data?.errors) {
        const validationErrors = e.response.data.errors.map((err: any) => err.message).join('\n');
        toast.error(`Validation Error: ${validationErrors}`);
      } else {
        toast.error(errorMsg);
      }
    }
  };

  // --- RENDERING HELPERS ---
  const currentSectionMeta = ASSESSMENTS.find(a => a.id === section);

  // Post-save UI
  if (isSaved) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Question Saved Successfully</h2>
            <p className="text-slate-500 text-sm mt-2">The question has been added to the global repository.</p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white w-full shadow-sm">Create Another Question</Button>
            <Button variant="outline" onClick={() => router.push('/admin/questions')} className="w-full">Go to Question Bank</Button>
            <Button variant="ghost" onClick={() => setIsSaved(false)} className="text-slate-500 hover:bg-slate-100">Preview Saved Question</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Top Navbar / Back Button */}
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline"
            onClick={() => router.push('/admin/questions')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center cursor-pointer border-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        {/* Breadcrumb & Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="cursor-pointer hover:text-slate-700 transition-colors" onClick={() => router.push('/admin/questions')}>Question Bank</span>
              <span>›</span>
              <span className={step === 1 ? 'text-blue-600' : 'cursor-pointer hover:text-slate-700 transition-colors'} onClick={() => setStep(1)}>Create Question</span>
              {section && (
                <>
                  <span>›</span>
                  <span className={step === 2 ? 'text-blue-600' : 'cursor-pointer hover:text-slate-700 transition-colors'} onClick={() => setStep(2)}>{currentSectionMeta?.title}</span>
                </>
              )}
              {type && (
                <>
                  <span>›</span>
                  <span className="text-blue-600">{QUESTION_TYPES[section]?.find(t => t.id === type)?.label}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Question</h1>
          </div>
        </div>

        {/* Persistent Progress Indicator */}
        <div className="mb-8 flex items-center justify-between max-w-2xl">
          {[
            { num: 1, label: 'Assessment' },
            { num: 2, label: 'Question Type' },
            { num: 3, label: 'Question Details' },
            { num: 4, label: 'Review & Save' }
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center gap-2 relative z-10 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > s.num ? 'bg-blue-600 text-white' : 
                step === s.num ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold ${step >= s.num ? 'text-slate-700' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < 3 && (
                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                  step > s.num ? 'bg-blue-600' : 'bg-slate-200'
                }`} style={{ width: '100%', left: '50%' }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Assessment Selection */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Select Assessment Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ASSESSMENTS.map(item => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setSection(item.id);
                    setType('');
                    handleNext();
                  }}
                  className={`border ${section === item.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'} p-6 rounded-2xl cursor-pointer transition-all group`}
                >
                  <div className={`mb-3 ${section === item.id ? 'text-blue-600' : 'text-slate-500'}`}>{item.icon}</div>
                  <h3 className={`text-lg font-bold transition-colors ${section === item.id ? 'text-blue-900' : 'text-slate-900 group-hover:text-blue-700'}`}>{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Question Type Selection */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6 max-w-3xl">
            <h2 className="text-xl font-bold text-slate-800">Select Question Type for {currentSectionMeta?.title}</h2>
            
            {/* Contextual Help */}
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl text-blue-800 text-sm">
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Guidance</span>
              {currentSectionMeta?.desc}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUESTION_TYPES[section]?.map(t => (
                <div 
                  key={t.id}
                  onClick={() => {
                    setType(t.id);
                    handleNext();
                  }}
                  className={`border p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    type === t.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span className={`font-semibold ${type === t.id ? 'text-blue-900' : 'text-slate-700'}`}>{t.label}</span>
                  <span className={type === t.id ? 'text-blue-600' : 'text-slate-300'}><ArrowRight className="w-5 h-5" /></span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <Button variant="outline" onClick={handleBack} className="text-slate-600 border-slate-200 border-none"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sections</Button>
            </div>
          </div>
        )}

        {/* STEP 3: Dynamic Question Form */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6 max-w-4xl">
            <h2 className="text-xl font-bold text-slate-800">Question Details</h2>

            <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8 space-y-8">
                
                {/* Question/Problem Statement Field */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {type === 'coding' ? 'Problem Statement' : 'Question Prompt'}
                  </label>
                  {requiresLatex ? (
                    <LatexEditor 
                      value={questionText} 
                      onChange={setQuestionText} 
                      placeholder="Write your content here (LaTeX supported via $...$)"
                      rows={6}
                    />
                  ) : (
                    <Textarea 
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full min-h-[150px] p-4 bg-slate-50 focus:bg-white resize-y text-sm"
                      placeholder="Type your question here..."
                    />
                  )}
                </div>

                {/* Eligibility / Descriptive toggles */}
                {['yes_no', 'numeric', 'scenario', 'case_study', 'ai_scenario', 'practical_prompt', 'practical_task', 'open_text', 'structured_response', 'ranking'].includes(type) && (
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Required Question</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Must the candidate answer this to proceed?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
                {/* MCQ Options */}
                {['mcq', 'coding_mcq', 'single_select', 'multi_select'].includes(type) && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Options & Correct Answer
                    </h3>
                    <div className="space-y-3">
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          {(type === 'multi_select') ? (
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
                                title="Mark as correct answer"
                              />
                            ) : (
                              <input 
                                type="radio" 
                                name="correct" 
                                checked={correctAnswer === String(i)}
                                onChange={() => setCorrectAnswer(String(i))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                title="Mark as correct answer"
                              />
                            )
                          }
                          {requiresLatex ? (
                            <div className="flex-1">
                              <LatexEditor 
                                value={opt.text} 
                                onChange={(val) => {
                                  const newOpts = [...options];
                                  newOpts[i].text = val;
                                  setOptions(newOpts);
                                }} 
                                placeholder={`Option ${i + 1}`}
                                rows={2}
                              />
                            </div>
                          ) : (
                            <Input 
                              value={opt.text} 
                              onChange={(e) => {
                                const newOpts = [...options];
                                newOpts[i].text = e.target.value;
                                setOptions(newOpts);
                              }} 
                              placeholder={`Option ${i + 1}`}
                              className="bg-slate-50 border-slate-200 flex-1"
                            />
                          )}
                          {options.length > 2 && (
                            <button 
                              type="button" 
                              onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, { text: '' }])} className="border-slate-200 text-slate-700 bg-white">
                      + Add Option
                    </Button>
                  </div>
                )}

                {/* Ranking Options */}
                {type === 'ranking' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm">Options & Correct Rank</h3>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                         <input type="checkbox" checked={allowPartialMarks} onChange={e => setAllowPartialMarks(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                         <span className="font-semibold text-slate-700">Allow Partial Marks</span>
                      </label>
                    </div>
                    <div className="space-y-3">
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
                          <div className="flex-1">
                             <Input 
                                value={opt.text} 
                                onChange={(e) => {
                                  const newOpts = [...options];
                                  newOpts[i].text = e.target.value;
                                  setOptions(newOpts);
                                }} 
                                placeholder={`Option ${i + 1}`}
                                className="bg-white border-slate-200"
                             />
                          </div>
                          {options.length > 2 && (
                            <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500 font-bold px-2">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, { text: '', rank: '' }])} className="border-slate-200 text-slate-700 bg-white">
                      + Add Option
                    </Button>
                  </div>
                )}

                {/* Structured Response Fields */}
                {type === 'structured_response' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Response Fields</h3>
                    <div className="space-y-4">
                      {structuredFields.map((field, i) => (
                        <div key={field.id}>
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
                          <Button type="button" variant="outline" size="sm" onClick={() => setStructuredFields([...structuredFields, { id: structuredFields.length + 1, label: '' }])} className="text-slate-600 bg-slate-50 hover:bg-slate-100">
                            + Add Field
                          </Button>
                        )}
                        {structuredFields.length > 2 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => setStructuredFields(structuredFields.slice(0, -1))} className="text-slate-600 bg-slate-50 hover:bg-rose-50 hover:text-rose-600">
                            - Remove Last Field
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}


                {/* Coding Specific Fields */}
                {type === 'coding' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Constraints</label>
                      <LatexEditor value={constraints} onChange={setConstraints} placeholder="Time limits, memory limits, variable bounds..." rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Sample Input</label>
                        <LatexEditor value={sampleInput} onChange={setSampleInput} placeholder="Example input data" rows={3} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Sample Output</label>
                        <LatexEditor value={sampleOutput} onChange={setSampleOutput} placeholder="Expected output" rows={3} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Behaviour / Scenario Fields */}
                {type === 'scenario' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Scenario Context (Optional)</label>
                    <Textarea 
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="w-full min-h-[100px] p-4 bg-slate-50 text-sm focus:bg-white"
                      placeholder="Provide background context for the situation..."
                    />
                  </div>
                )}

                {/* Case Study / AI Scenario Fields */}
                {(type === 'case_study' || type === 'ai_scenario') && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-slate-800 text-lg border-b pb-2">{type === 'case_study' ? 'Case Study Details' : 'Scenario Details'}</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{type === 'case_study' ? 'Case Study Title' : 'Scenario Title'}</label>
                      <Input value={caseStudyTitle} onChange={(e) => setCaseStudyTitle(e.target.value)} placeholder="e.g. Acme Corp Customer Retention" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Background</label>
                      <LatexEditor value={caseStudyBackground} onChange={setCaseStudyBackground} placeholder="Background details..." rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Context</label>
                      <LatexEditor value={caseStudyContext} onChange={setCaseStudyContext} placeholder="Specific situation..." rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Problem Statement</label>
                      <LatexEditor value={caseStudyProblemStatement} onChange={setCaseStudyProblemStatement} placeholder="The core issue..." rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Supporting Information (Optional)</label>
                      <LatexEditor value={caseStudySupportingInfo} onChange={setCaseStudySupportingInfo} placeholder="Data, tables, references..." rows={3} />
                    </div>
                  </div>
                )}

                {/* Word Limits & Scoring Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  
                  {/* Word Limits */}
                  {['open_text', 'structured_response'].includes(type) && (
                    <div className="space-y-4">
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

                  {/* Marks & Weight Section */}
                  <div className="space-y-4">
                    {(showsMarks || ['scenario', 'case_study', 'ai_scenario', 'open_text', 'structured_response', 'code_review', 'prompt_writing', 'ranking', 'date', 'open_response', 'essay'].includes(type)) && (
                      <h3 className="font-bold text-slate-800 text-sm">Scoring</h3>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {showsMarks && (
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Marks</label>
                          <Input type="number" min="1" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="bg-slate-50 font-bold text-lg border-slate-200" />
                        </div>
                      )}
                      {['scenario', 'case_study', 'ai_scenario', 'open_text', 'structured_response', 'code_review', 'prompt_writing', 'ranking', 'date', 'open_response', 'essay'].includes(type) && (
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Weight</label>
                          <Input type="number" min="1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="bg-slate-50 font-bold text-lg border-slate-200" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={handleBack} className="text-slate-600 px-6 border-slate-200 border-none"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-sm transition-colors">Continue to Review <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Save */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6 max-w-4xl">
            <h2 className="text-xl font-bold text-slate-800">Review & Save</h2>
            
            <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardContent className="p-0">
                {/* Header Meta */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-wrap gap-8">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assessment</span>
                    <span className="font-semibold text-slate-800">{currentSectionMeta?.title}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Question Type</span>
                    <span className="font-semibold text-slate-800">{QUESTION_TYPES[section]?.find(t => t.id === type)?.label}</span>
                  </div>
                  {showsMarks && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Marks</span>
                      <span className="font-bold text-indigo-600">{points} Pts</span>
                    </div>
                  )}
                  {['yes_no', 'numeric', 'scenario', 'case_study', 'ai_scenario'].includes(type) && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requirement</span>
                      <span className={`font-semibold ${isRequired ? 'text-rose-600' : 'text-slate-500'}`}>{isRequired ? 'Required' : 'Optional'}</span>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Question Preview</h3>
                    <div className="text-slate-800 text-base leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {questionText || <span className="text-slate-400 italic">No question text provided.</span>}
                    </div>
                  </div>

                  {['mcq', 'coding_mcq', 'single_select', 'multi_select', 'multiple_select'].includes(type) && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Options</h3>
                      <div className="space-y-2">
                        {options.map((opt, i) => {
                          let isCorrect = false;
                          if (type === 'multi_select' || type === 'multiple_select') {
                            try {
                              const parsed = JSON.parse(correctAnswer);
                              isCorrect = Array.isArray(parsed) && parsed.includes(String(i));
                            } catch {}
                          } else {
                            isCorrect = correctAnswer === String(i);
                          }
                          return (
                            <div key={i} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="text-sm font-medium">{opt.text || <span className="italic opacity-50">Empty option</span>}</span>
                                {isCorrect && <span className="ml-auto text-xs font-bold text-emerald-600 uppercase tracking-wider">Correct Answer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {type === 'yes_no' && (
                     <div>
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Options</h3>
                       <div className="flex gap-4">
                         <div className="px-6 py-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 font-bold">Yes (Correct)</div>
                         <div className="px-6 py-3 rounded-xl border bg-slate-50 border-slate-100 text-slate-700 font-bold">No</div>
                       </div>
                     </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-6 pb-12">
              <Button variant="outline" onClick={handleBack} className="text-slate-600 px-6 border-slate-200 border-none"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit</Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => handleSave('draft')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-colors">Save as Draft</Button>
                <Button onClick={() => handleSave('published')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-sm transition-colors">Publish & Save Question</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
