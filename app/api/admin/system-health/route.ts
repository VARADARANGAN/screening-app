import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Cache health results for 30 seconds to avoid hammering the DB
let healthCache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function runChecks() {
  const checks: Record<string, { status: 'ok' | 'error' | 'warn'; message: string; detail?: string }> = {};

  // 1. Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', message: 'PostgreSQL connected' };
  } catch (e: any) {
    checks.database = { status: 'error', message: 'Database unreachable', detail: e.message };
  }

  // 2. Authentication (JWT secret present)
  const jwtSecret = process.env.JWT_SECRET;
  checks.authentication = jwtSecret
    ? { status: 'ok', message: 'JWT_SECRET configured' }
    : { status: 'error', message: 'JWT_SECRET missing from environment' };

  // 3. AI Engine (GROQ key present)
  const groqKey = process.env.GROQ_API_KEY;
  checks.aiEngine = groqKey
    ? { status: 'ok', message: 'GROQ_API_KEY configured' }
    : { status: 'error', message: 'GROQ_API_KEY missing – AI evaluations will fail' };

  // 4. Question Bank
  try {
    const qCount = await prisma.question.count({ where: { is_published: true } });
    const sections = await prisma.question.groupBy({ by: ['section'], where: { is_published: true } });
    const sectionNames = sections.map((s: any) => s.section).filter(Boolean);
    checks.questionBank = qCount > 0
      ? { status: 'ok', message: `${qCount} published questions`, detail: `Sections: ${sectionNames.join(', ') || 'none'}` }
      : { status: 'warn', message: 'No published questions found' };

    // Section coverage
    const requiredSections = ['APTITUDE', 'CODING', 'BEHAVIOUR', 'LEARNING', 'AI_LITERACY'];
    const missingSections = requiredSections.filter(s => !sectionNames.includes(s));
    checks.sectionCoverage = missingSections.length === 0
      ? { status: 'ok', message: 'All assessment sections have questions' }
      : { status: 'warn', message: `Missing sections: ${missingSections.join(', ')}` };
  } catch (e: any) {
    checks.questionBank = { status: 'error', message: 'Failed to query questions', detail: e.message };
    checks.sectionCoverage = { status: 'error', message: 'Could not check' };
  }

  // 5. Assessment Engine (tests exist)
  try {
    const testCount = await prisma.test.count();
    const submittedCount = await prisma.test.count({ where: { is_completed: true } });
    checks.assessmentEngine = { status: 'ok', message: `${testCount} tests total, ${submittedCount} completed` };
  } catch (e: any) {
    checks.assessmentEngine = { status: 'error', message: 'Failed to query tests', detail: e.message };
  }

  // 6. AI Evaluations
  try {
    const evalCount = await prisma.aIEvaluation.count();
    const completedEvals = await prisma.aIEvaluation.count({ where: { status: 'COMPLETED' } });
    const failedEvals = await prisma.aIEvaluation.count({ where: { status: 'FAILED' } });
    checks.aiEvaluations = {
      status: failedEvals > 0 ? 'warn' : 'ok',
      message: `${completedEvals} completed, ${failedEvals} failed of ${evalCount} total`,
      detail: failedEvals > 0 ? 'Check GROQ_API_KEY and model availability' : undefined
    };
  } catch (e: any) {
    checks.aiEvaluations = { status: 'error', message: 'Failed to query evaluations', detail: e.message };
  }

  // 7. Results & Scoring
  try {
    const withScores = await prisma.testAnalytics.count();
    checks.resultsScoring = { status: 'ok', message: `${withScores} test analytics records exist` };
  } catch (e: any) {
    checks.resultsScoring = { status: 'error', message: 'Failed to query analytics', detail: e.message };
  }

  // 8. Hiring Drives / Eligibility
  try {
    const driveCount = await prisma.hiringDrive.count({ where: { is_active: true } });
    checks.eligibility = driveCount > 0
      ? { status: 'ok', message: `${driveCount} active hiring drive(s)` }
      : { status: 'warn', message: 'No active hiring drives – eligibility gate may fail' };
  } catch (e: any) {
    checks.eligibility = { status: 'error', message: 'Failed to query hiring drives', detail: e.message };
  }

  // Calculate overall health
  const statuses = Object.values(checks).map(c => c.status);
  const errorCount = statuses.filter(s => s === 'error').length;
  const warnCount = statuses.filter(s => s === 'warn').length;
  const okCount = statuses.filter(s => s === 'ok').length;
  const total = statuses.length;

  const healthPercent = Math.round(((okCount + warnCount * 0.5) / total) * 100);

  return {
    checks,
    summary: {
      ok: okCount,
      warn: warnCount,
      error: errorCount,
      total,
      healthPercent,
      overallStatus: errorCount > 0 ? 'critical' : warnCount > 0 ? 'degraded' : 'healthy'
    },
    timestamp: new Date().toISOString()
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const now = Date.now();
    if (healthCache && now - healthCache.ts < CACHE_TTL_MS) {
      return NextResponse.json({ ...healthCache.data, cached: true });
    }

    const result = await runChecks();
    healthCache = { data: result, ts: now };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('System health check failed:', error);
    return NextResponse.json(
      { message: 'Health check failed', detail: error.message },
      { status: 500 }
    );
  }
}
