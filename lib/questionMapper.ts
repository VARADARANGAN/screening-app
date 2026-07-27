// lib/questionMapper.ts

export function mapQuestionPayload(rawData: any, rowIndex?: number) {
  // Raw data from either the Excel importer or the Create Question Wizard state
  const rawType = String(rawData.type || rawData['Question Type'] || '').trim().toLowerCase();
  const rawSection = String(rawData.section || rawData['Section'] || '').trim().toUpperCase();
  
  // 1. Map to strict DB types
  let type = 'descriptive';
  if (['mcq', 'yes_no', 'coding_mcq'].includes(rawType)) {
    type = 'mcq';
  } else if (['coding'].includes(rawType)) {
    type = 'coding';
  }

  // 2. Map to strict sections
  let section = 'APTITUDE';
  if (rawSection === 'CODING') section = 'CODING';
  if (rawSection === 'BEHAVIOUR') section = 'BEHAVIOUR';
  if (rawSection === 'LEARNING') section = 'LEARNING';
  if (rawSection === 'AI_LITERACY' || rawSection === 'AI LITERACY') section = 'AI_LITERACY';

  // 3. Construct unified optionsJson object
  let optionsJson: any = {};
  let correctAnswer = '';

  if (type === 'mcq') {
    const options: { text: string }[] = [];
    
    // Support wizard structure (rawData.options array) or Excel structure (Option 1, Option 2...)
    if (Array.isArray(rawData.options)) {
      rawData.options.forEach((opt: any) => {
        if (opt && typeof opt.text === 'string' && opt.text.trim()) {
          options.push({ text: opt.text.trim() });
        }
      });
    } else {
      if (rawData['Option 1']) options.push({ text: String(rawData['Option 1']) });
      if (rawData['Option 2']) options.push({ text: String(rawData['Option 2']) });
      if (rawData['Option 3']) options.push({ text: String(rawData['Option 3']) });
      if (rawData['Option 4']) options.push({ text: String(rawData['Option 4']) });
    }

    // Special case for yes_no mapped to mcq
    if (rawType === 'yes_no' && options.length === 0) {
      options.push({ text: 'Yes' }, { text: 'No' });
    }

    optionsJson.options = options;
    
    // Correct Answer parsing
    const rawAnswer = String(rawData.correctAnswer || rawData['Correct Answer'] || '').trim();
    if (rawType === 'yes_no' && !rawAnswer) {
      correctAnswer = '0';
    } else {
      correctAnswer = rawAnswer;
    }
  } else if (type === 'coding') {
    // Support wizard structure or Excel structure
    optionsJson = {
      constraints: String(rawData.constraints || rawData['Constraints'] || ''),
      sampleInput: String(rawData.sampleInput || rawData['Sample Input'] || ''),
      sampleOutput: String(rawData.sampleOutput || rawData['Sample Output'] || ''),
      starterCode: String(rawData.starterCode || rawData['Starter Code'] || ''),
      language: String(rawData.language || rawData['Language'] || 'javascript')
    };
  } else {
    // Descriptive, Case Study, AI Scenario, etc.
    if (['case_study', 'case study'].includes(rawType)) {
      optionsJson.caseStudy = {
        title: String(rawData.caseStudyTitle || rawData['Case Study Title'] || ''),
        background: String(rawData.caseStudyBackground || rawData['Case Study Background'] || ''),
        context: String(rawData.caseStudyContext || rawData['Case Study Context'] || ''),
        problemStatement: String(rawData.caseStudyProblemStatement || rawData['Case Study Problem Statement'] || ''),
        supportingInfo: String(rawData.caseStudySupportingInfo || rawData['Case Study Supporting Information'] || '')
      };
    } else if (['ai_scenario', 'ai scenario'].includes(rawType)) {
      optionsJson.aiScenario = {
        title: String(rawData.caseStudyTitle || rawData['Case Study Title'] || ''),
        background: String(rawData.caseStudyBackground || rawData['Case Study Background'] || ''),
        context: String(rawData.caseStudyContext || rawData['Case Study Context'] || ''),
        problemStatement: String(rawData.caseStudyProblemStatement || rawData['Case Study Problem Statement'] || ''),
        supportingInfo: String(rawData.caseStudySupportingInfo || rawData['Case Study Supporting Information'] || '')
      };
    } else if (['scenario'].includes(rawType)) {
      optionsJson.scenario = String(rawData.scenario || rawData['Scenario'] || '');
    }

    optionsJson.expectedAnswerLength = Number(rawData.expectedAnswerLength || rawData['Expected Answer Length']) || 150;
    
    // Min/max chars from wizard
    if (rawData.minCharacters !== undefined) optionsJson.minCharacters = Number(rawData.minCharacters);
    if (rawData.maxCharacters !== undefined && Number(rawData.maxCharacters) > 0) {
      optionsJson.maxCharacters = Number(rawData.maxCharacters);
    }
  }

  // 4. Construct Final Payload
  const showsMarks = section === 'APTITUDE' || section === 'CODING';
  const defaultDimension = section === 'BEHAVIOUR' ? 'COMMUNICATION' : 'LEARNING';
  
  const payload = {
    ...(rowIndex !== undefined ? { _rowIndex: rowIndex } : {}),
    questionText: String(rawData.questionText || rawData['Question Text'] || ''),
    type,
    section,
    points: showsMarks ? (Number(rawData.points || rawData['Points']) || 0) : 0,
    timeLimitSeconds: (Number(rawData.expectedDuration || rawData['Expected Duration']) ? Number(rawData.expectedDuration || rawData['Expected Duration']) * 60 : Number(rawData.timeLimitSeconds || rawData['Time Limit'])) || 60,
    isPublished: rawData.isPublished !== undefined ? rawData.isPublished : true,
    explanation: (rawData.explanation || rawData['Explanation']) ? String(rawData.explanation || rawData['Explanation']) : undefined,
    assessmentDimension: String(rawData.assessmentDimension || rawData['Assessment Dimension'] || defaultDimension).toUpperCase(),
    expectedDuration: Number(rawData.expectedDuration || rawData['Expected Duration']) || 5,
    optionsJson,
    correctAnswer: correctAnswer || undefined,
    weight: Number(rawData.weight) || 1,
    expectedAnswerLength: Number(rawData.expectedAnswerLength || rawData['Expected Answer Length']) || 150,
    isRequired: rawData.isRequired !== undefined ? rawData.isRequired : true
  };

  return payload;
}
