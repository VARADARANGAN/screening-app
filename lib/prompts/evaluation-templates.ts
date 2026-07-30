import { EvaluationRequest } from '@/types';

export function getEvaluationPrompt(request: EvaluationRequest): string {
  const { questionType } = request;

  switch (questionType) {
    case 'coding':
      return getCodingPrompt(request);
    case 'code_review':
      return getCodeReviewPrompt(request);
    case 'open_response':
    case 'essay':
    case 'open_text':
      return getOpenResponsePrompt(request);
    case 'structured_response':
      return getStructuredResponsePrompt(request);
    default:
      return getOpenResponsePrompt(request);
  }
}

function getBaseInstructions(request: EvaluationRequest): string {
  let instructions = `You are an expert examiner evaluating a student's answer.
Analyze the submission and respond STRICTLY in valid JSON format matching this schema, without any markdown formatting or extra text:

The AI must meticulously evaluate the answer based on four core pillars:
1. Correctness: Is the answer factually and logically accurate?
2. Completeness: Does the answer address all parts of the question?
3. Relevance: Is the answer directly related to the prompt without unnecessary filler?
4. Quality: Is the answer well-structured, professional, and clear?

{
  "evaluationStatus": "string", // EXACTLY ONE OF: "Correct", "Partially Correct", "Incorrect"
  "marksAwarded": number, // Score awarded (integer or decimal up to 1 decimal place)
  "feedback": "string", // Overall feedback
  "strengths": ["string"], // List of 1-3 strengths in the answer
  "weaknesses": ["string"], // List of any weaknesses
  "deductionReasons": ["string"], // List of specific reasons marks were deducted
  "suggestions": ["string"] // List of 1-3 suggestions for improvement
}

Maximum Marks Possible: ${request.maxMarks}
`;

  if (request.evaluationRubric && request.evaluationRubric.length > 0) {
    instructions += `\nEvaluation Rubric / Criteria:\n`;
    request.evaluationRubric.forEach((criterion, index) => {
      instructions += `${index + 1}. ${criterion}\n`;
    });
  }

  return instructions;
}

function getCodingPrompt(request: EvaluationRequest): string {
  let instructions = `You are an expert technical interviewer and code reviewer evaluating a student's coding submission.
Analyze the submission and respond STRICTLY in valid JSON format matching this schema, without any markdown formatting or extra text.

Evaluate the submitted code based on:
1. Syntax
2. Logic
3. Correctness
4. Completeness
5. Edge cases
6. Best practices

{
  "detectedLanguage": "string", // Automatically detect the programming language (e.g. Python, Java, JavaScript, C, C++, C#, Go, PHP, Ruby, Kotlin, Swift, Rust, TypeScript)
  "evaluationStatus": "string", // EXACTLY ONE OF: "Correct", "Partially Correct", "Incorrect"
  "score": number, // Score awarded (integer or decimal)
  "feedback": "string", // Detailed review
  "strengths": ["string"], // List of 1-3 strengths
  "mistakes": ["string"], // List of logical or syntax mistakes made by the student
  "suggestions": ["string"] // List of suggestions for improvement
}

Maximum Marks Possible: ${request.maxMarks}

Question / Problem Statement:
${request.question}

Student's Submitted Code:
${request.studentAnswer}

IMPORTANT SCORING RULES:
1. Complete & correct logic covering edge cases: Award full marks.
2. Minor syntax errors but correct logic, or missing edge cases: Award partial marks and set status to "Partially Correct". A partially correct solution MUST NOT be marked as fully correct.
3. Incomplete solutions, completely wrong logic, or uncompilable snippets: Award 0 marks and set status to "Incorrect".

Evaluate the code rigorously. Ensure you output standard JSON.`;

  return instructions;
}

function getCodeReviewPrompt(request: EvaluationRequest): string {
  return `${getBaseInstructions(request)}

Code to Review / Question:
${request.question}

Student's Review / Answer:
${request.studentAnswer}

IMPORTANT SCORING RULES:
1. Did the student identify the bugs or security vulnerabilities present in the code?
2. Is the student's suggested fix or explanation correct and idiomatic?
3. Award points based on the severity and accuracy of their findings.

Evaluate their review skills based on accuracy and clarity. Ensure you output standard JSON.`;
}

function getOpenResponsePrompt(request: EvaluationRequest): string {
  return `${getBaseInstructions(request)}

Question:
${request.question}

Student's Answer:
${request.studentAnswer}

Evaluate the student's answer based strictly on:
1. Relevance
2. Correctness
3. Completeness
4. Practicality
5. Communication

If the answer is completely off-topic or wrong, award 0 marks.`;
}

function getStructuredResponsePrompt(request: EvaluationRequest): string {
  return `${getBaseInstructions(request)}

Scenario / Question:
${request.question}

Student's Answer:
${request.studentAnswer}

Evaluate the student's response based strictly on:
1. Structure
2. Logical Flow
3. Coverage
4. Accuracy
5. Completeness
6. Clarity

Pay special attention to how well they adhered to any requested structure, methodologies, or specific points mentioned in the prompt or rubric.`;
}
