import 'dotenv/config';
import prisma from '../lib/prisma';
import { processBackgroundEvaluations } from '../lib/services/evaluation-pipeline';

async function runIntegrationTest() {
  console.log('--- STARTING E2E DATABASE INTEGRATION TEST ---');

  try {
    // 1. Create Mock Data
    console.log('\n[1] Creating mock student, test, and questions...');

    // Cleanup old mock data if exists safely handling foreign keys
    const oldAdmin = await prisma.user.findUnique({ where: { email: 'mock_admin@test.com' } });
    const oldStudentUser = await prisma.user.findUnique({ where: { email: 'mock_student@test.com' } });

    if (oldStudentUser) {
      const oldStudentProfile = await prisma.student.findUnique({ where: { user_id: oldStudentUser.id } });
      if (oldStudentProfile) {
        await prisma.test.deleteMany({ where: { student_id: oldStudentProfile.id } });
      }
    }

    if (oldAdmin) {
      await prisma.question.deleteMany({ where: { created_by: oldAdmin.id } });
    }

    await prisma.user.deleteMany({
      where: { email: { in: ['mock_admin@test.com', 'mock_student@test.com'] } }
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'mock_admin@test.com',
        password_hash: 'hashed',
        role: 'admin'
      }
    });

    const studentUser = await prisma.user.create({
      data: {
        email: 'mock_student@test.com',
        password_hash: 'hashed',
        role: 'student',
        student: {
          create: {
            full_name: 'Mock Student'
          }
        }
      },
      include: { student: true }
    });

    const mockStudent = studentUser.student!;

    const openTextQuestion = await prisma.question.create({
      data: {
        type: 'open_text',
        section: 'COMMUNICATION',
        question_text: 'You have three days to learn an unfamiliar technology. How would you approach learning it?',
        points: 10,
        options_json: {},
        created_by: adminUser.id
      }
    });

    const structuredQuestion = await prisma.question.create({
      data: {
        type: 'structured_response',
        section: 'TECHNICAL',
        question_text: 'Design a system architecture for a URL shortener like bit.ly. Detail the database schema, API endpoints, and caching strategy.',
        points: 15,
        options_json: {},
        created_by: adminUser.id
      }
    });

    const mockTest = await prisma.test.create({
      data: {
        student_id: mockStudent.id,
        status: 'submitted',
        total_duration: 60,
        start_time: new Date(),
        end_time: new Date()
      }
    });

    await prisma.testQuestion.createMany({
      data: [
        { test_id: mockTest.id, question_id: openTextQuestion.id, sequence_number: 1 },
        { test_id: mockTest.id, question_id: structuredQuestion.id, sequence_number: 2 }
      ]
    });

    const otResponse = await prisma.testResponse.create({
      data: {
        test_id: mockTest.id,
        question_id: openTextQuestion.id,
        student_answer: 'I would first understand the basics from the official documentation, then build a small project, watch tutorials for concepts I do not understand, and finally practice by solving real-world problems.',
        evaluation_status: 'PENDING'
      }
    });

    const srResponse = await prisma.testResponse.create({
      data: {
        test_id: mockTest.id,
        question_id: structuredQuestion.id,
        student_answer: '1. DB: Users table and URLs table (shortcode, long_url, clicks). 2. API: POST /shorten, GET /{shortcode}. 3. Caching: Use Redis to cache the most accessed shortcodes to reduce DB load. I will use a load balancer in front of my backend instances.',
        evaluation_status: 'PENDING'
      }
    });

    // 2. Trigger Evaluation Pipeline
    console.log('\n[2] Triggering Background Evaluation Pipeline...');

    const payloads = [
      { testId: mockTest.id, questionId: openTextQuestion.id, studentAnswer: otResponse.student_answer || '' },
      { testId: mockTest.id, questionId: structuredQuestion.id, studentAnswer: srResponse.student_answer || '' }
    ];

    await processBackgroundEvaluations(payloads);

    // 3. Verify DB Records
    console.log('\n[3] Verifying Database Records...');

    const aiEvals = await prisma.aIEvaluation.findMany({
      where: { test_id: mockTest.id }
    });

    console.log(`\nFound ${aiEvals.length} AIEvaluation records in DB.`);

    aiEvals.forEach(evalRecord => {
      console.log(`\n--- AIEvaluation Record for Question Type: ${evalRecord.question_type} ---`);
      console.log(`Status: ${evalRecord.evaluation_status}`);
      console.log(`Marks Awarded: ${evalRecord.obtained_marks} / ${evalRecord.maximum_marks}`);
      console.log(`Feedback: ${evalRecord.feedback}`);
      console.log(`Strengths Saved: ${evalRecord.strengths?.length || 0} items`);
      console.log(`Improvements Saved: ${evalRecord.improvements?.length || 0} items`);
      console.log(`Raw Response Persisted: ${evalRecord.raw_response ? 'YES' : 'NO'}`);

      const raw = evalRecord.raw_response as any;
      console.log(`Weaknesses (Raw): ${raw?.weaknesses?.length || 0} items`);
      console.log(`Deduction Reasons (Raw): ${raw?.deductionReasons?.length || 0} items`);
    });

    // 4. Verify Score Calculation
    console.log('\n[4] Verifying Score Calculation...');
    const testAnalytics = await prisma.testAnalytics.findUnique({
      where: { test_id: mockTest.id }
    });

    if (testAnalytics) {
      console.log(`Total Score: ${testAnalytics.total_score}`);
      console.log(`Overall AI Marks: ${testAnalytics.overall_ai_marks}`);
      console.log(`Overall Percentage: ${testAnalytics.overall_percentage}%`);
      console.log(`Section Totals:`, testAnalytics.section_totals);
    } else {
      console.log(`TestAnalytics record not found!`);
    }

    // Cleanup in dependency order to prevent FK violations
    await prisma.test.delete({ where: { id: mockTest.id } });
    await prisma.question.deleteMany({ where: { created_by: adminUser.id } });
    await prisma.user.deleteMany({
      where: { email: { in: ['mock_admin@test.com', 'mock_student@test.com'] } }
    });

    console.log('\n--- E2E INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Integration test failed:', error);
  } finally {
    // Cannot disconnect if using singleton pool, or maybe we can? 
    // Just leave it, the process will exit.
  }
}

runIntegrationTest();
