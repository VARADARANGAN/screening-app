import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'recruiter' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = await params;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        student: true,
        analytics: true,
        test_responses: {
          include: {
            question: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const SECTIONS = [
      { id: 'ELIGIBILITY', label: 'Eligibility' },
      { id: 'APTITUDE', label: 'Aptitude' },
      { id: 'CODING', label: 'Coding' },
      { id: 'ATTITUDE_AND_OWNERSHIP', label: 'Attitude & Ownership' },
      { id: 'LEARNING_APTITUDE', label: 'Learning Aptitude' },
      { id: 'PROBLEM_SOLVING', label: 'Problem Solving' },
      { id: 'EXECUTION_AND_RELIABILITY', label: 'Execution & Reliability' },
      { id: 'COMMUNICATION_AND_TEAMWORK', label: 'Communication & Teamwork' },
      { id: 'INTEGRITY', label: 'Integrity' },
      { id: 'AI_LITERACY', label: 'AI Literacy' },
    ];

    const sectionScores = SECTIONS.map(sec => {
      const responsesInSection = test.test_responses.filter(r => r.question.section === sec.id);
      
      const totalMarks = responsesInSection.reduce((sum, r) => sum + (r.question.points || 0), 0);
      const marksObtained = responsesInSection.reduce((sum, r) => sum + (Number(r.points_earned) || 0), 0);
      
      return {
        sectionName: sec.label,
        marksObtained,
        totalMarks,
        isCompleted: test.status === 'submitted' || test.status === 'auto_submitted',
        hasQuestions: responsesInSection.length > 0
      };
    }).filter(sec => sec.hasQuestions); // Only return sections they actually had questions for, or should we return all? The prompt said "Display the report section-wise in this exact order... Each section should display..." If they have no questions, maybe we shouldn't display it. Wait, the prompt says "Display the report section-wise in this exact order: 1...10". I will return all 10 sections, but maybe the frontend will handle it. No, returning all 10 is safest, but with 0/0. Wait, actually I'll just return all 10.
    
    // Removing the filter to always return all 10 sections as requested.
    const finalSectionScores = SECTIONS.map(sec => {
      const responsesInSection = test.test_responses.filter(r => r.question.section === sec.id);
      const totalMarks = responsesInSection.reduce((sum, r) => sum + (r.question.points || 0), 0);
      const marksObtained = responsesInSection.reduce((sum, r) => sum + (Number(r.points_earned) || 0), 0);
      return {
        sectionName: sec.label,
        marksObtained,
        totalMarks,
        isCompleted: test.status === 'submitted' || test.status === 'auto_submitted'
      };
    });

    let overallTotalMarks = 0;
    let overallMarksObtained = 0;
    
    test.test_responses.forEach(r => {
      overallTotalMarks += (r.question.points || 0);
      overallMarksObtained += (Number(r.points_earned) || 0);
    });

    const scores = {
      overallScore: test.score ? Number(test.score) : overallMarksObtained,
      overallTotalMarks,
      sectionScores: finalSectionScores
    };

    // Extract submitted coding answers for the report
    const codingAnswers = test.test_responses
      .filter(r => r.question.type === 'coding')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
        aiEvaluation: r.ai_evaluation_json
      }));

    // Extract structured answers
    const structuredAnswers = test.test_responses
      .filter(r => r.question.type === 'structured_response')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        fields: (r.question.options_json as any)?.fields || [],
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
      }));

    // Extract structured plan answers
    const structuredPlanAnswers = test.test_responses
      .filter(r => r.question.type === 'structured_plan')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        labels: (r.question.options_json as any)?.labels || [],
        mode: (r.question.options_json as any)?.mode || 'day',
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
      }));

    // Extract ranking answers
    const rankingAnswers = test.test_responses
      .filter(r => r.question.type === 'ranking')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        correctAnswer: r.question.correct_answer,
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
      }));

    return NextResponse.json({
      success: true,
      data: {
        id: test.id,
        studentName: test.student?.full_name || 'Unknown Student',
        status: test.status,
        startTime: test.start_time,
        endTime: test.end_time,
        submissionTime: test.end_time,
        totalDuration: test.total_duration,
        timeTaken: test.start_time && test.end_time ? Math.round((new Date(test.end_time).getTime() - new Date(test.start_time).getTime()) / 60000) : (test.analytics?.time_taken || null),
        scores,
        codingAnswers,
        structuredAnswers,
        structuredPlanAnswers,
        rankingAnswers
      }
    });

  } catch (error: any) {
    console.error('Fetch Admin Result Details Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result details', details: error.message },
      { status: 500 }
    );
  }
}
