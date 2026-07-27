import Groq from 'groq-sdk';
import prisma from '@/lib/prisma';
import { BEHAVIOUR_SYSTEM_PROMPT, getBehaviourUserPrompt } from './behaviour.prompt';
import { LEARNING_SYSTEM_PROMPT, getLearningUserPrompt } from './learning.prompt';
import { AI_LITERACY_SYSTEM_PROMPT, getAILiteracyUserPrompt } from './aiLiteracy.prompt';
import { AGGREGATOR_SYSTEM_PROMPT, getAggregatorUserPrompt } from './candidateAggregator.prompt';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getJsonFromGroq(systemPrompt: string, userPrompt: string, model: string = 'llama3-70b-8192') {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: model,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw error;
  }
}

export async function evaluateCandidate(testId: string) {
  try {
    // 1. Mark or Create evaluation as PROCESSING
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        test_responses: {
          include: { question: true }
        },
        analytics: true,
        student: true
      }
    });

    if (!test) throw new Error('Test not found');

    await prisma.aIEvaluation.upsert({
      where: { test_id: testId },
      create: {
        test_id: testId,
        student_id: test.student_id,
        status: 'PROCESSING'
      },
      update: {
        status: 'PROCESSING',
        error_message: null
      }
    });

    // 2. Group Questions
    const behaviourResponses = test.test_responses.filter(r => r.question.section === 'BEHAVIOUR');
    const learningResponses = test.test_responses.filter(r => r.question.section === 'LEARNING');
    const aiLiteracyResponses = test.test_responses.filter(r => r.question.section === 'AI_LITERACY');

    const formatForAI = (responses: any[]) => responses.map(r => ({
      question: r.question.question_text,
      context: r.question.options_json,
      student_answer: r.student_answer,
      time_taken_mins: r.started_at && r.submitted_at 
        ? Math.round((new Date(r.submitted_at).getTime() - new Date(r.started_at).getTime()) / 60000) 
        : null
    }));

    // 3. Evaluate Modules (Parallel execution for speed)
    const [behaviourEval, learningEval, aiLiteracyEval] = await Promise.all([
      behaviourResponses.length > 0 
        ? getJsonFromGroq(BEHAVIOUR_SYSTEM_PROMPT, getBehaviourUserPrompt(formatForAI(behaviourResponses)))
        : null,
      learningResponses.length > 0
        ? getJsonFromGroq(LEARNING_SYSTEM_PROMPT, getLearningUserPrompt(formatForAI(learningResponses)))
        : null,
      aiLiteracyResponses.length > 0
        ? getJsonFromGroq(AI_LITERACY_SYSTEM_PROMPT, getAILiteracyUserPrompt(formatForAI(aiLiteracyResponses)))
        : null
    ]);

    // 4. Aggregate
    const existingScores = {
      aptitudeScore: test.analytics?.total_score || 0, // In a real scenario, this would be computed from Aptitude section
      // Since coding evaluation might also be async, we just use whatever score is in test.score
      totalTestScore: test.score || 0,
      totalQuestions: test.analytics?.total_questions || 0,
      correctAnswers: test.analytics?.correct_answers || 0
    };

    const aggregatorData = {
      quantitative: existingScores,
      qualitative: {
        behaviour: behaviourEval,
        learning: learningEval,
        aiLiteracy: aiLiteracyEval
      }
    };

    const aggregatedReport = await getJsonFromGroq(AGGREGATOR_SYSTEM_PROMPT, getAggregatorUserPrompt(aggregatorData));

    // 5. Save Final Result
    await prisma.aIEvaluation.update({
      where: { test_id: testId },
      data: {
        behaviour_evaluation: behaviourEval || {},
        learning_evaluation: learningEval || {},
        ai_literacy_evaluation: aiLiteracyEval || {},
        aggregated_report: aggregatedReport,
        status: 'COMPLETED'
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Candidate Evaluation failed:', error);
    await prisma.aIEvaluation.update({
      where: { test_id: testId },
      data: {
        status: 'FAILED',
        error_message: error.message || 'Unknown error occurred'
      }
    });
    return { success: false, error: error.message };
  }
}
