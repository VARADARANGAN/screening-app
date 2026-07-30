import Groq from 'groq-sdk';
import { EvaluationRequest, EvaluationResponse } from '@/types';
import { getEvaluationPrompt } from './prompts/evaluation-templates';

/**
 * Core AI Evaluation Engine
 * Purely responsible for evaluating an answer using an LLM.
 * Fully decoupled from persistence (Prisma) and queue/execution layers.
 */
export async function evaluateAnswer(request: EvaluationRequest): Promise<EvaluationResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return createFailedResponse(request, 'GROQ_API_KEY is not configured on the server.');
  }

  const groq = new Groq({ apiKey });
  // Models to try in fallback order
  const models = ['llama-3.3-70b-versatile', 'llama3-8b-8192'];
  const prompt = getEvaluationPrompt(request);

  let lastErrorMsg = '';
  let textContent = '';
  let modelUsed = '';
  let apiSuccess = false;

  for (const model of models) {
    let attempt = 1;
    const maxAttempts = 2;

    while (attempt <= maxAttempts && !apiSuccess) {
      try {
        console.log(`[AI Evaluation Engine] Calling model ${model} (Attempt ${attempt}/${maxAttempts}) for Question ${request.questionId}`);
        
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        textContent = chatCompletion.choices[0]?.message?.content || '';
        
        if (textContent) {
          apiSuccess = true;
          modelUsed = model;
          break;
        } else {
          lastErrorMsg = `Empty response from model ${model}`;
        }
      } catch (groqErr: any) {
        lastErrorMsg = `Groq exception: ${groqErr.message || groqErr}`;
      }
      attempt++;
    }

    if (apiSuccess) break;
  }

  if (!apiSuccess || !textContent) {
    return createFailedResponse(request, `API Error: ${lastErrorMsg}`);
  }

  return parseLLMResponse(request, textContent, modelUsed);
}

function parseLLMResponse(request: EvaluationRequest, textContent: string, modelUsed: string): EvaluationResponse {
  let cleanedText = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  try {
    const aiResult = JSON.parse(cleanedText);
    
    // Map backwards compatibility for older coding evaluations that might return "marksAwarded"
    const parsedScore = Number(aiResult.score ?? aiResult.marksAwarded ?? 0);
    const cappedScore = Math.min(Math.max(parsedScore, 0), request.maxMarks);

    return {
      questionId: request.questionId,
      score: cappedScore,
      maximumMarks: request.maxMarks,
      feedback: aiResult.feedback || 'No feedback provided.',
      strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths : [],
      improvements: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : (Array.isArray(aiResult.improvements) ? aiResult.improvements : []),
      evaluationStatus: 'COMPLETED',
      evaluatedAt: new Date().toISOString(),
      modelUsed,
      rawJson: {
        ...aiResult,
        detectedLanguage: aiResult.detectedLanguage,
        codingEvaluationStatus: aiResult.evaluationStatus,
        mistakes: Array.isArray(aiResult.mistakes) ? aiResult.mistakes : [],
        weaknesses: Array.isArray(aiResult.weaknesses) ? aiResult.weaknesses : [],
        deductionReasons: Array.isArray(aiResult.deductionReasons) ? aiResult.deductionReasons : [],
        suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : []
      },
      success: true
    };
  } catch (parseError: any) {
    return {
      ...createFailedResponse(request, `Failed to parse AI response: ${parseError.message}`),
      rawJson: { raw_response: textContent }
    };
  }
}

function createFailedResponse(request: EvaluationRequest, errorMsg: string): EvaluationResponse {
  return {
    questionId: request.questionId,
    score: 0,
    maximumMarks: request.maxMarks,
    feedback: '',
    strengths: [],
    improvements: [],
    evaluationStatus: 'FAILED',
    evaluatedAt: new Date().toISOString(),
    error: errorMsg,
    success: false
  };
}
