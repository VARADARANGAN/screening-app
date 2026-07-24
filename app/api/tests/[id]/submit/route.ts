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

      if (question.type === 'coding') {
        try {
          const prompt = `You are an expert programming examiner. Evaluate the following student's code submission for a coding test.

Problem Statement:
${question.question_text}

Maximum Marks: ${pts}

Student's Submitted Code:
${studentAnswer}

Analyze the code and respond strictly in valid JSON format matching this schema without any markdown formatting or extra text:
{
  "detectedLanguage": "string",
  "marksAwarded": number, // integer or decimal
  "isCorrect": boolean,
  "feedback": "string",
  "deductions": "string" // leave empty if full marks
}

Focus on logical correctness. Give partial marks for logically correct solutions with minor syntax mistakes, similar to a human examiner.`;

          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: "application/json",
                }
              })
            });

            if (res.ok) {
              const data = await res.json();
              const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textContent) {
                const aiResult = JSON.parse(textContent);
                aiEvaluationJson = aiResult;
                pointsEarned = Number(aiResult.marksAwarded) || 0;
                isCorrect = Boolean(aiResult.isCorrect);
              } else {
                pointsEarned = 0;
                isCorrect = false;
              }
            } else {
              console.error('[Gemini API Error]', await res.text());
              pointsEarned = 0;
            }
          } else {
            console.warn('GEMINI_API_KEY is not set. Skipping AI evaluation.');
            pointsEarned = 0;
          }
        } catch (e) {
          console.error('[AI Evaluation Error]', e);
          pointsEarned = 0;
        }
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
      }

      score += pointsEarned;
      correctQuestionsCount += pts > 0 ? (pointsEarned / pts) : (isCorrect ? 1 : 0);

      // Store response (using findFirst to prevent duplicate insert on unique constraint)
      const existingResponse = await prisma.testResponse.findFirst({
        where: {
          test_id: id,
          question_id: questionId
        }
      });

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: {
            student_answer: studentAnswer ? String(studentAnswer) : null,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            ai_evaluation_json: aiEvaluationJson ? JSON.parse(JSON.stringify(aiEvaluationJson)) : null,
            submitted_at: new Date()
          }
        });
      } else {
        await prisma.testResponse.create({
          data: {
            test_id: id,
            question_id: questionId,
            student_answer: studentAnswer ? String(studentAnswer) : null,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            ai_evaluation_json: aiEvaluationJson ? JSON.parse(JSON.stringify(aiEvaluationJson)) : null,
            submitted_at: new Date()
          }
        });
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
