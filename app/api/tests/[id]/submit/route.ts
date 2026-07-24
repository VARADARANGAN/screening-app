import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    // Verify test ownership
    const test = await prisma.test.findFirst({
      where: {
        id: id,
        student_id: student.id
      }
    });

    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    const data = await request.json();
    const { answers, violations } = data;

    // Store violations
    if (violations && violations.length > 0) {
      for (const v of violations) {
        await prisma.violation.create({
          data: {
            test_id: id,
            violation_type: 'suspicious_activity',
            description: v
          }
        });
      }
    }

    const totalQuestions = await prisma.testQuestion.count({
      where: { test_id: id }
    });
    let score = 0;
    let totalPoints = 0;
    let correctQuestionsCount = 0;

    for (const [questionId, studentAnswer] of Object.entries(answers)) {
      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!question) continue;
      const pts = question.points || 0;
      totalPoints += pts;

      let isCorrect = false;
      let pointsEarned = 0;
      let aiEvaluationJson = null;
      let pointsEarnedToSave: number | null = 0;

      if (question.type === 'coding') {
        try {
          console.log(`[AI Evaluation] [Test: ${id}] [Question: ${questionId}] [Student: ${student.id}] Starting evaluation.`);
          
          const prompt = `You are an expert programming examiner. Evaluate the following student's code submission for a coding test.

Problem Statement:
${question.question_text}

Maximum Marks: ${pts}

Student's Submitted Code:
${studentAnswer}

Analyze the code and respond strictly in valid JSON format matching this schema without any markdown formatting or extra text:
{
  "language": "string", // name of detected programming language
  "marksAwarded": number, // integer or decimal
  "feedback": "string",
  "deductionReason": "string" // leave empty or describe reasons if points were deducted
}

Focus on logical correctness. Give partial marks for logically correct solutions with minor syntax mistakes, similar to a human examiner.`;

          const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            }
          };

          console.log(`[AI Evaluation] [Test: ${id}] Request Payload prepared:`, JSON.stringify(payload));

          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured on the server.');
          }

          const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
          let lastErrorMsg = '';
          let apiSuccess = false;
          let textContent = '';

          for (const model of models) {
            let attempt = 1;
            const maxAttempts = 2; // 2 attempts per model

            while (attempt <= maxAttempts && !apiSuccess) {
              try {
                console.log(`[AI Evaluation] [Test: ${id}] Calling model ${model} (Attempt ${attempt}/${maxAttempts})`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });

                if (res.ok) {
                  const resData = await res.json();
                  textContent = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  console.log(`[AI Evaluation] [Test: ${id}] HTTP 200 Raw Response from ${model}:`, textContent);
                  apiSuccess = true;
                  break;
                } else {
                  const errorText = await res.text();
                  lastErrorMsg = `HTTP ${res.status} error from model ${model}: ${errorText}`;
                  console.error(`[AI Evaluation Error] [Test: ${id}] [Model: ${model}] [Attempt: ${attempt}]`, lastErrorMsg);
                }
              } catch (fetchErr: any) {
                lastErrorMsg = `Fetch exception: ${fetchErr.message || fetchErr}`;
                console.error(`[AI Evaluation Exception] [Test: ${id}] [Model: ${model}] [Attempt: ${attempt}]`, lastErrorMsg);
              }
              attempt++;
            }

            if (apiSuccess) break;
          }

          if (apiSuccess && textContent) {
            let cleanedText = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
            try {
              const aiResult = JSON.parse(cleanedText);
              console.log(`[AI Evaluation] [Test: ${id}] Successfully parsed JSON result.`);
              
              const marksAwarded = Number(aiResult.marksAwarded) || 0;
              
              aiEvaluationJson = {
                detected_language: aiResult.language || aiResult.detectedLanguage || 'N/A',
                marks_awarded: marksAwarded,
                total_marks: pts,
                evaluation_status: 'success',
                ai_feedback: aiResult.feedback || 'No feedback provided.',
                deduction_reason: aiResult.deductionReason || aiResult.deductions || '',
                ai_evaluation_json: aiResult,
                evaluated_at: new Date().toISOString()
              };
              pointsEarned = marksAwarded;
              isCorrect = marksAwarded >= pts * 0.5; // Correct if >= 50% marks
            } catch (parseError: any) {
              const parseErrMsg = `JSON Parse Error: ${parseError.message}. Content: ${cleanedText}`;
              console.error(`[AI Evaluation Parsing Error] [Test: ${id}]`, parseErrMsg);
              pointsEarned = 0;
              isCorrect = false;
              aiEvaluationJson = {
                evaluation_status: 'FAILED',
                error: parseErrMsg,
                evaluated_at: new Date().toISOString()
              };
            }
          } else {
            console.error(`[AI Evaluation Failed] [Test: ${id}] All models/retries failed. Last error:`, lastErrorMsg);
            pointsEarned = 0;
            isCorrect = false;
            aiEvaluationJson = {
              evaluation_status: 'FAILED',
              error: lastErrorMsg || 'Unknown API failure after retries.',
              evaluated_at: new Date().toISOString()
            };
          }
        } catch (e: any) {
          console.error(`[AI Evaluation System Error] [Test: ${id}]`, e);
          pointsEarned = 0;
          isCorrect = false;
          aiEvaluationJson = {
            evaluation_status: 'FAILED',
            error: `System Exception: ${e.message || e}`,
            evaluated_at: new Date().toISOString()
          };
        }

        // If evaluation failed, we save points_earned as null
        const isFailed = aiEvaluationJson?.evaluation_status === 'FAILED';
        pointsEarnedToSave = isFailed ? null : pointsEarned;

        // In score calculation, we add 0 if it failed, but save null in DB
        score += pointsEarned;
        correctQuestionsCount += pts > 0 ? (pointsEarned / pts) : (isCorrect ? 1 : 0);
      } else {
        const isDirectMatch = String(studentAnswer).trim() === String(question.correct_answer).trim();
        let isTextMatch = false;
        if (question.options_json && Array.isArray(question.options_json)) {
          const correctIdx = parseInt(question.correct_answer || '-1');
          if (correctIdx >= 0 && correctIdx < question.options_json.length) {
            const correctOpt = question.options_json[correctIdx];
            const correctOptText = typeof correctOpt === 'object' && correctOpt !== null && 'text' in correctOpt
                                   ? correctOpt.text
                                   : String(correctOpt);
            isTextMatch = String(studentAnswer).trim() === String(correctOptText).trim();
          }
        }
        isCorrect = isDirectMatch || isTextMatch;
        pointsEarned = isCorrect ? pts : 0;
        pointsEarnedToSave = pointsEarned;

        score += pointsEarned;
        correctQuestionsCount += pts > 0 ? (pointsEarned / pts) : (isCorrect ? 1 : 0);
      }

      // Store response (using findFirst to prevent duplicate insert on unique constraint)
      const existingResponse = await prisma.testResponse.findFirst({
        where: {
          test_id: id,
          question_id: questionId
        }
      });

      const dbData = {
        student_answer: studentAnswer ? String(studentAnswer) : null,
        is_correct: isCorrect,
        points_earned: pointsEarnedToSave,
        ai_evaluation_json: aiEvaluationJson ? JSON.parse(JSON.stringify(aiEvaluationJson)) : null,
        submitted_at: new Date()
      };

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: dbData
        });
        console.log(`[AI Evaluation] [Test: ${id}] Successfully updated database response for question ${questionId}`);
      } else {
        await prisma.testResponse.create({
          data: {
            test_id: id,
            question_id: questionId,
            ...dbData
          }
        });
        console.log(`[AI Evaluation] [Test: ${id}] Successfully created database response for question ${questionId}`);
      }
    }

    const { status } = data;
    const updatedTest = await prisma.test.update({
      where: { id: id },
      data: {
        status: status || 'submitted',
        score: correctQuestionsCount,
        end_time: new Date(),
        violations_count: violations ? violations.length : 0
      }
    });

    return NextResponse.json({
      message: 'Test submitted successfully',
      test: updatedTest,
      score: correctQuestionsCount,
      totalQuestions: totalQuestions
    });
  } catch (error: any) {
    console.error('[Submit Test Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit test' },
      { status: 400 }
    );
  }
}
