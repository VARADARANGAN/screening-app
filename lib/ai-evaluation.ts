import Groq from 'groq-sdk';

export interface AIEvaluationResult {
  success: boolean;
  marksAwarded: number;
  totalMarks: number;
  language: string;
  feedback: string;
  deductionReason: string;
  rawJson?: any;
  error?: string;
}

export async function evaluateCodingAnswer(
  problemStatement: string,
  maxMarks: number,
  studentCode: string
): Promise<AIEvaluationResult> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        marksAwarded: 0,
        totalMarks: maxMarks,
        language: 'N/A',
        feedback: '',
        deductionReason: '',
        error: 'GROQ_API_KEY is not configured on the server.'
      };
    }

    const groq = new Groq({ apiKey });
    const models = ['llama-3.3-70b-versatile', 'llama3-8b-8192'];
    
    const prompt = `You are an expert programming examiner. Evaluate the following student's code submission for a coding test.

Problem Statement:
${problemStatement}

Maximum Marks: ${maxMarks}

Student's Submitted Code:
${studentCode}

Analyze the code and respond strictly in valid JSON format matching this schema without any markdown formatting or extra text:
{
  "language": "string", // name of detected programming language
  "marksAwarded": number, // integer or decimal
  "feedback": "string",
  "deductionReason": "string" // leave empty or describe reasons if points were deducted
}

Focus on logical correctness. 
IMPORTANT SCORING RULES:
1. Complete & correct logic: Award full marks.
2. Minor syntax errors but correct logic: Award partial marks (e.g. deduct 1-2 points).
3. Incomplete solutions, completely wrong logic, or uncompilable snippets: Award 0 marks. Do NOT give partial marks for writing boilerplate code or completely wrong logic.`;

    let lastErrorMsg = '';
    let apiSuccess = false;
    let textContent = '';

    for (const model of models) {
      let attempt = 1;
      const maxAttempts = 2; // 2 attempts per model

      while (attempt <= maxAttempts && !apiSuccess) {
        try {
          console.log(`[AI Evaluation Service] Calling model ${model} (Attempt ${attempt}/${maxAttempts})`);
          
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.2,
            response_format: { type: 'json_object' }
          });

          textContent = chatCompletion.choices[0]?.message?.content || '';
          
          if (textContent) {
            apiSuccess = true;
            break;
          } else {
            lastErrorMsg = `Empty response from model ${model}`;
            console.error(`[AI Evaluation Service Error] [Model: ${model}] [Attempt: ${attempt}]`, lastErrorMsg);
          }
        } catch (groqErr: any) {
          lastErrorMsg = `Groq exception: ${groqErr.message || groqErr}`;
          console.error(`[AI Evaluation Service Exception] [Model: ${model}] [Attempt: ${attempt}]`, lastErrorMsg);
        }
        attempt++;
      }

      if (apiSuccess) break;
    }

    if (apiSuccess && textContent) {
      let cleanedText = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        const aiResult = JSON.parse(cleanedText);
        
        return {
          success: true,
          marksAwarded: Number(aiResult.marksAwarded) || 0,
          totalMarks: maxMarks,
          language: aiResult.language || aiResult.detectedLanguage || 'N/A',
          feedback: aiResult.feedback || 'No feedback provided.',
          deductionReason: aiResult.deductionReason || aiResult.deductions || '',
          rawJson: aiResult
        };
      } catch (parseError: any) {
        console.error(`[AI Evaluation Service Parse Error]`, parseError);
        return {
          success: false,
          marksAwarded: 0,
          totalMarks: maxMarks,
          language: 'N/A',
          feedback: '',
          deductionReason: '',
          rawJson: { raw_response: textContent },
          error: `Failed to parse AI response: ${parseError.message}`
        };
      }
    } else {
      console.error(`[AI Evaluation Service Exhausted] Failed after all attempts. Last error: ${lastErrorMsg}`);
      return {
        success: false,
        marksAwarded: 0,
        totalMarks: maxMarks,
        language: 'N/A',
        feedback: '',
        deductionReason: '',
        error: `API Error: ${lastErrorMsg}`
      };
    }
  } catch (error: any) {
    console.error(`[AI Evaluation Service Fatal Error]`, error);
    return {
      success: false,
      marksAwarded: 0,
      totalMarks: maxMarks,
      language: 'N/A',
      feedback: '',
      deductionReason: '',
      error: `System Error: ${error.message || 'Unknown exception during AI call'}`
    };
  }
}
