// lib/questionMapper.ts

export function mapQuestionPayload(rawData: any, rowIndex?: number) {
  // Raw data from either the Excel importer or the Create Question Wizard state
  const rawType = String(rawData.type || rawData['Question Type'] || '').trim().toLowerCase();
  const rawSection = String(rawData.section || rawData['Section'] || '').trim().toUpperCase();
  
  // 1. Map to strict DB types
  let type = rawType;
  if (['yes_no', 'coding_mcq'].includes(rawType)) {
    type = 'mcq';
  } else if (!['mcq', 'coding', 'single_select', 'date', 'open_text', 'ranking', 'structured_response', 'code_response', 'code_review', 'structured_plan', 'multi_select', 'prompt_writing'].includes(type)) {
    type = 'descriptive'; // fallback for unknown types
  }

  // 2. Map to strict sections
  let section = rawSection;
  const ALLOWED_SECTIONS = ['APTITUDE', 'CODING', 'ELIGIBILITY', 'ATTITUDE_AND_OWNERSHIP', 'LEARNING_APTITUDE', 'PROBLEM_SOLVING', 'EXECUTION_AND_RELIABILITY', 'COMMUNICATION_AND_TEAMWORK', 'INTEGRITY', 'AI_LITERACY'];
  if (!ALLOWED_SECTIONS.includes(section)) {
    section = 'APTITUDE'; // fallback
  }

  // 3. Construct unified optionsJson object
  let optionsJson: any = {};
  let correctAnswer = '';

  if (type === 'mcq' || type === 'single_select' || type === 'multi_select') {
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
  } else if (type === 'structured_response') {
    optionsJson = {
      fields: Array.isArray(rawData.fields) ? rawData.fields : []
    };
  } else if (type === 'structured_plan') {
    optionsJson = {
      mode: String(rawData.planMode || 'day'),
      days: Number(rawData.planDays) || 5,
      labels: Array.isArray(rawData.planLabels) ? rawData.planLabels : []
    };
  }

  // Add min/max words for all descriptive types
  if (['open_text', 'structured_response', 'structured_plan', 'prompt_writing', 'code_review', 'descriptive', 'short_answer'].includes(type)) {
    if (rawData.minWords) optionsJson.minWords = Number(rawData.minWords);
    if (rawData.maxWords) optionsJson.maxWords = Number(rawData.maxWords);
  }

  // 4. Construct Final Payload
  const showsMarks = section === 'APTITUDE' || section === 'CODING';
  
  const payload = {
    ...(rowIndex !== undefined ? { _rowIndex: rowIndex } : {}),
    questionText: String(rawData.questionText || rawData['Question Text'] || ''),
    type,
    section,
    points: showsMarks ? (Number(rawData.points || rawData['Points']) || 0) : 0,
    timeLimitSeconds: (Number(rawData.expectedDuration || rawData['Expected Duration']) ? Number(rawData.expectedDuration || rawData['Expected Duration']) * 60 : Number(rawData.timeLimitSeconds || rawData['Time Limit'])) || 60,
    isPublished: rawData.isPublished !== undefined ? rawData.isPublished : true,
    explanation: (rawData.explanation || rawData['Explanation']) ? String(rawData.explanation || rawData['Explanation']) : undefined,
    expectedDuration: Number(rawData.expectedDuration || rawData['Expected Duration']) || 5,
    optionsJson,
    correctAnswer: correctAnswer || undefined,
    weight: Number(rawData.weight) || 1,
    isRequired: rawData.isRequired !== undefined ? rawData.isRequired : true
  };

  return payload;
}
