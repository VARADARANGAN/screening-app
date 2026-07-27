'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LatexEditor } from '@/components/ui/latex-editor';

// --- Configuration Data ---
const ASSESSMENTS = [
  { id: 'ELIGIBILITY', title: 'Eligibility', desc: 'Create recruiter screening questions that determine candidate eligibility before the assessment begins.', icon: '📋' },
  { id: 'APTITUDE', title: 'Aptitude', desc: 'Quantitative Ability, Logical Reasoning, Verbal Ability.', icon: '🧠' },
  { id: 'CODING', title: 'Coding', desc: 'Programming Challenges and Coding MCQs.', icon: '💻' },
  { id: 'BEHAVIOUR', title: 'Behaviour', desc: 'Scenario-based professional behaviour questions.', icon: '🤝' },
  { id: 'LEARNING', title: 'Learning', desc: 'Evaluate learning agility and comprehension.', icon: '📚' },
  { id: 'AI_LITERACY', title: 'AI Literacy', desc: 'Assess prompt engineering and AI tool proficiency.', icon: '🤖' },
  { id: 'PRACTICAL', title: 'Practical', desc: 'Hands-on practical tasks.', icon: '🛠️' },
];

const QUESTION_TYPES: Record<string, Array<{ id: string, label: string }>> = {
  ELIGIBILITY: [
    { id: 'yes_no', label: 'Yes / No' },
    { id: 'mcq', label: 'Multiple Choice (MCQ)' },
    { id: 'numeric', label: 'Numeric Input' },
    { id: 'short_answer', label: 'Short Answer' }
  ],
  APTITUDE: [
    { id: 'mcq', label: 'Multiple Choice (MCQ)' }
  ],
  CODING: [
    { id: 'coding', label: 'Coding Challenge' },
    { id: 'coding_mcq', label: 'Coding MCQ' }
  ],
  BEHAVIOUR: [
    { id: 'descriptive', label: 'Descriptive' },
    { id: 'scenario', label: 'Scenario Based' }
  ],
  LEARNING: [
    { id: 'descriptive', label: 'Descriptive' },
    { id: 'case_study', label: 'Case Study' },
    { id: 'mcq', label: 'MCQ' }
  ],
  AI_LITERACY: [
    { id: 'mcq', label: 'MCQ' },
    { id: 'descriptive', label: 'Descriptive' },
    { id: 'ai_scenario', label: 'Scenario Based' }
  ],
  PRACTICAL: [
    { id: 'practical_task', label: 'Practical Task' },
    { id: 'descriptive', label: 'Descriptive' }
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
  const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
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
      
      let dbType = type;
      if (['numeric', 'short_answer', 'descriptive', 'scenario', 'case_study', 'ai_scenario', 'practical_prompt', 'practical_task'].includes(type)) {
        dbType = 'descriptive';
      } else if (type === 'yes_no' || type === 'coding_mcq') {
        dbType = 'mcq';
      }

      let payload: any = {
        questionText,
        type: dbType,
        section,
        points: showsMarks ? Number(points) : 0,
        timeLimitSeconds: expectedDuration * 60,
        isPublished: status === 'published'
      };

      if (dbType === 'mcq') {
        let finalOptions = options;
        if (type === 'yes_no') {
          finalOptions = [{ text: 'Yes' }, { text: 'No' }];
        }
        payload.optionsJson = finalOptions;
        payload.correctAnswer = type === 'yes_no' ? '0' : correctAnswer;
      } else if (dbType === 'coding') {
        payload.optionsJson = {
          constraints,
          sampleInput,
          sampleOutput
        };
        payload.correctAnswer = '';
      } else {
        // Descriptive and others
        let optionsJson: any = {};
        if (scenario) optionsJson.scenario = scenario;
        if (type === 'case_study') {
          optionsJson.caseStudy = {
            title: caseStudyTitle,
            background: caseStudyBackground,
            context: caseStudyContext,
            problemStatement: caseStudyProblemStatement,
            supportingInfo: caseStudySupportingInfo
          };
        } else if (type === 'ai_scenario') {
          optionsJson.aiScenario = {
            title: caseStudyTitle,
            background: caseStudyBackground,
            context: caseStudyContext,
            problemStatement: caseStudyProblemStatement,
            supportingInfo: caseStudySupportingInfo
          };
        }
        
        optionsJson.minCharacters = Number(minCharacters);
        if (Number(maxCharacters) > 0) {
          optionsJson.maxCharacters = Number(maxCharacters);
        }
        optionsJson.expectedAnswerLength = Number(expectedAnswerLength);

        payload.optionsJson = optionsJson;
        payload.correctAnswer = '';
        // Automatically assign a dimension based on section to avoid breaking backend
        payload.assessmentDimension = section === 'BEHAVIOUR' ? 'COMMUNICATION' : 'LEARNING';
        payload.weight = Number(weight);
        payload.expectedDuration = Number(expectedDuration);
        payload.expectedAnswerLength = Number(expectedAnswerLength);
        payload.isRequired = isRequired;
      }

      await axios.post('/api/questions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSaved(true);
    } catch (e: any) {
      const errorMsg = e.response?.data?.errors 
        ? e.response.data.errors.map((err: any) => err.message).join('\n') 
        : e.response?.data?.message || 'Failed to save question';
      alert(`Error saving question:\n${errorMsg}`);
      console.error(e);
    }
  };

  // --- RENDERING HELPERS ---
  const currentSectionMeta = ASSESSMENTS.find(a => a.id === section);

  // Post-save UI
  if (isSaved) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Question Saved Successfully</h2>
            <p className="text-slate-500 text-sm mt-2">The question has been added to the global repository.</p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={resetForm} className="bg-blue-900 hover:bg-blue-800 text-white w-full">Create Another Question</Button>
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
                step > s.num ? 'bg-emerald-500 text-white' : 
                step === s.num ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold ${step >= s.num ? 'text-slate-700' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < 3 && (
                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                  step > s.num ? 'bg-emerald-500' : 'bg-slate-200'
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
                  <div className="text-3xl mb-3">{item.icon}</div>
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
                    type === t.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className={`font-semibold ${type === t.id ? 'text-indigo-900' : 'text-slate-700'}`}>{t.label}</span>
                  <span className={type === t.id ? 'text-indigo-600' : 'text-slate-300'}>→</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <Button variant="outline" onClick={handleBack} className="text-slate-600 border-slate-200">← Back to Sections</Button>
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
                    <textarea 
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full min-h-[150px] p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y text-sm"
                      placeholder="Type your question here..."
                    />
                  )}
                </div>

                {/* Eligibility / Descriptive toggles */}
                {['yes_no', 'numeric', 'short_answer', 'descriptive', 'scenario', 'case_study', 'ai_scenario', 'practical_prompt', 'practical_task'].includes(type) && (
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
                {['mcq', 'coding_mcq'].includes(type) && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Options & Correct Answer</h3>
                    <div className="space-y-3">
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <input 
                            type="radio" 
                            name="correct" 
                            checked={correctAnswer === String(i)}
                            onChange={() => setCorrectAnswer(String(i))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
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
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, { text: '' }])} className="text-slate-600 bg-slate-50 hover:bg-slate-100">
                      + Add Option
                    </Button>
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
                    <textarea 
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="w-full min-h-[100px] p-4 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

                {/* Config Metadata (Duration/Length) */}
                {['descriptive', 'scenario', 'case_study', 'ai_scenario'].includes(type) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested Duration (mins)</label>
                      <Input type="number" min="1" value={expectedDuration} onChange={(e) => setExpectedDuration(Number(e.target.value))} className="bg-white border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Min Characters</label>
                      <Input type="number" min="0" value={minCharacters} onChange={(e) => setMinCharacters(Number(e.target.value))} className="bg-white border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Max Characters (0=No Limit)</label>
                      <Input type="number" min="0" value={maxCharacters} onChange={(e) => setMaxCharacters(Number(e.target.value))} className="bg-white border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested Words</label>
                      <Input type="number" min="10" value={expectedAnswerLength} onChange={(e) => setExpectedAnswerLength(Number(e.target.value))} className="bg-white border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Weight</label>
                      <Input type="number" min="1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="bg-white border-slate-200" />
                    </div>
                  </div>
                )}

                {/* Marks Logic */}
                {showsMarks && (
                  <div className="w-48">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Marks</label>
                    <Input type="number" min="1" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="bg-slate-50 font-bold text-lg border-slate-200" />
                  </div>
                )}

              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={handleBack} className="text-slate-600 px-6 border-slate-200">← Back</Button>
              <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-2.5 rounded-xl shadow-md transition-colors">Continue to Review →</Button>
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
                  {['yes_no', 'numeric', 'short_answer', 'descriptive', 'scenario', 'case_study', 'ai_scenario'].includes(type) && (
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

                  {['mcq', 'coding_mcq'].includes(type) && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Options</h3>
                      <div className="space-y-2">
                        {options.map((opt, i) => (
                          <div key={i} className={`p-4 rounded-xl border ${correctAnswer === String(i) ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${correctAnswer === String(i) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm font-medium">{opt.text || <span className="italic opacity-50">Empty option</span>}</span>
                              {correctAnswer === String(i) && <span className="ml-auto text-xs font-bold text-emerald-600 uppercase tracking-wider">Correct Answer</span>}
                            </div>
                          </div>
                        ))}
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
              <Button variant="outline" onClick={handleBack} className="text-slate-600 px-6 border-slate-200">← Back to Edit</Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => handleSave('draft')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-colors">Save as Draft</Button>
                <Button onClick={() => handleSave('published')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-md transition-colors">Publish & Save Question</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
