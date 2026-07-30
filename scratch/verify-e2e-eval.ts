import 'dotenv/config';
import { evaluateAnswer } from '../lib/evaluation-engine';

async function runTest() {
  console.log('--- STARTING E2E AI EVALUATION TEST ---');

  // Test Case 1: Open Text
  const openTextRequest = {
    questionId: 'test-q-1',
    questionType: 'open_text',
    question: 'You have three days to learn an unfamiliar technology. How would you approach learning it?',
    studentAnswer: 'I would first understand the basics from the official documentation, then build a small project, watch tutorials for concepts I do not understand, and finally practice by solving real-world problems.',
    maxMarks: 10
  };

  console.log('\n=======================================');
  console.log('Testing: Open Text Evaluation');
  console.log('Question:', openTextRequest.question);
  console.log('Student Answer:', openTextRequest.studentAnswer);
  console.log('=======================================');

  try {
    const otResponse = await evaluateAnswer(openTextRequest as any);
    console.log('\n[Open Text Result]');
    console.log('Success:', otResponse.success);
    console.log('Score:', otResponse.score, '/', otResponse.maximumMarks);
    console.log('Status:', otResponse.evaluationStatus);
    console.log('Feedback:', otResponse.feedback);
    console.log('Strengths:', otResponse.strengths);
    console.log('Weaknesses:', otResponse.rawJson?.weaknesses);
    console.log('Deduction Reasons:', otResponse.rawJson?.deductionReasons);
    console.log('Suggestions:', otResponse.improvements);
  } catch (err) {
    console.error('Error evaluating Open Text:', err);
  }

  // Test Case 2: Structured Response
  const structuredRequest = {
    questionId: 'test-q-2',
    questionType: 'structured_response',
    question: 'Design a system architecture for a URL shortener like bit.ly. Detail the database schema, API endpoints, and caching strategy.',
    studentAnswer: '1. DB: Users table and URLs table (shortcode, long_url, clicks). 2. API: POST /shorten, GET /{shortcode}. 3. Caching: Use Redis to cache the most accessed shortcodes to reduce DB load. I will use a load balancer in front of my backend instances.',
    maxMarks: 15
  };

  console.log('\n=======================================');
  console.log('Testing: Structured Response Evaluation');
  console.log('Question:', structuredRequest.question);
  console.log('Student Answer:', structuredRequest.studentAnswer);
  console.log('=======================================');

  try {
    const srResponse = await evaluateAnswer(structuredRequest as any);
    console.log('\n[Structured Response Result]');
    console.log('Success:', srResponse.success);
    console.log('Score:', srResponse.score, '/', srResponse.maximumMarks);
    console.log('Status:', srResponse.evaluationStatus);
    console.log('Feedback:', srResponse.feedback);
    console.log('Strengths:', srResponse.strengths);
    console.log('Weaknesses:', srResponse.rawJson?.weaknesses);
    console.log('Deduction Reasons:', srResponse.rawJson?.deductionReasons);
    console.log('Suggestions:', srResponse.improvements);
  } catch (err) {
    console.error('Error evaluating Structured Response:', err);
  }

  console.log('\n--- E2E TEST COMPLETED ---');
}

runTest();
