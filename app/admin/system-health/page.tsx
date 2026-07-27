'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

type CheckStatus = 'ok' | 'warn' | 'error' | 'loading';

interface CheckResult {
  status: CheckStatus;
  message: string;
  detail?: string;
}

interface HealthData {
  checks: Record<string, CheckResult>;
  summary: {
    ok: number;
    warn: number;
    error: number;
    total: number;
    healthPercent: number;
    overallStatus: 'healthy' | 'degraded' | 'critical';
  };
  timestamp: string;
  cached?: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  database: 'Database',
  authentication: 'Authentication',
  aiEngine: 'AI Engine (Groq)',
  questionBank: 'Question Bank',
  sectionCoverage: 'Assessment Sections',
  assessmentEngine: 'Assessment Engine',
  aiEvaluations: 'AI Evaluations',
  resultsScoring: 'Results & Scoring',
  eligibility: 'Eligibility / Hiring Drives',
};

const FEATURE_AUDIT = [
  {
    group: 'Authentication',
    items: [
      { label: 'Register', route: 'POST /api/auth/register', impl: true },
      { label: 'Login', route: 'POST /api/auth/login', impl: true },
      { label: 'Logout', route: 'POST /api/auth/logout', impl: true },
      { label: 'OTP Verify', route: 'POST /api/auth/verify', impl: true },
      { label: 'Reset Password', route: 'POST /api/auth/reset-password', impl: true },
      { label: 'JWT Auth', route: 'lib/auth.ts', impl: true },
      { label: 'RBAC', route: 'All API routes', impl: true },
    ],
  },
  {
    group: 'Admin – Question Bank',
    items: [
      { label: 'Create Question', route: 'GET /admin/questions/create', impl: true },
      { label: 'Edit Question', route: 'GET /admin/questions/edit/[id]', impl: true },
      { label: 'Delete Question', route: 'DELETE /api/questions/[id]', impl: true },
      { label: 'Publish/Unpublish', route: 'PATCH /api/questions/[id]', impl: true },
      { label: 'Excel Bulk Upload', route: 'POST /api/questions/bulk', impl: true },
      { label: 'Validate Excel (frontend)', route: 'QuestionImporter component', impl: true },
      { label: 'Download Template', route: 'QuestionImporter component', impl: true },
    ],
  },
  {
    group: 'Admin – Assessment Management',
    items: [
      { label: 'Hiring Drives', route: 'GET /admin/hiring-drives', impl: true },
      { label: 'Assign Test', route: 'POST /api/tests/assign', impl: true },
      { label: 'Students Viewer', route: 'GET /admin/students', impl: true },
      { label: 'AI Evaluation Manager', route: 'GET /admin/evaluation', impl: true },
      { label: 'Re-evaluate', route: 'POST /api/tests/[id]/reevaluate', impl: true },
    ],
  },
  {
    group: 'Admin – Results',
    items: [
      { label: 'Results Dashboard', route: 'GET /admin/results', impl: true },
      { label: 'Student Report Page', route: 'GET /admin/results/[testId]', impl: true },
      { label: 'Category Scores (Aptitude, Coding, Behaviour, Learning, AI)', route: 'GET /api/admin/results', impl: true },
      { label: 'AI Report (Strengths, Areas, Recommendation)', route: 'GET /api/admin/results/[testId]', impl: true },
    ],
  },
  {
    group: 'Student – Assessment Flow',
    items: [
      { label: 'Dashboard', route: 'GET /student/dashboard', impl: true },
      { label: 'Eligibility Gate', route: 'GET /student/eligibility', impl: true },
      { label: 'Profile Completion', route: 'GET /student/profile', impl: true },
      { label: 'Test Interface', route: 'GET /student/test', impl: true },
      { label: 'Auto-Save Answers', route: 'POST /api/tests/[id]/auto-save', impl: true },
      { label: 'Timer & Anti-Cheat', route: 'test-interface.tsx', impl: true },
      { label: 'Resume After Refresh', route: 'GET /api/tests/active', impl: true },
      { label: 'Submit Test', route: 'POST /api/tests/[id]/submit', impl: true },
      { label: 'Success Page', route: 'GET /student/success', impl: true },
    ],
  },
  {
    group: 'Assessment Sections',
    items: [
      { label: 'Eligibility Questions', route: 'section=ELIGIBILITY', impl: true },
      { label: 'Aptitude (MCQ)', route: 'section=APTITUDE', impl: true },
      { label: 'Coding (Editor + Judge)', route: 'section=CODING + /api/tests/[id]/run-code', impl: true },
      { label: 'Behaviour (Scenario + Descriptive)', route: 'section=BEHAVIOUR', impl: true },
      { label: 'Learning (Case Study + Descriptive)', route: 'section=LEARNING', impl: true },
      { label: 'AI Literacy (MCQ + Scenario + Descriptive)', route: 'section=AI_LITERACY', impl: true },
    ],
  },
  {
    group: 'AI Evaluation Engine',
    items: [
      { label: 'Behaviour Evaluation', route: 'lib/ai/behaviour.prompt.ts', impl: true },
      { label: 'Learning Evaluation', route: 'lib/ai/learning.prompt.ts', impl: true },
      { label: 'AI Literacy Evaluation', route: 'lib/ai/aiLiteracy.prompt.ts', impl: true },
      { label: 'Candidate Intelligence Aggregator', route: 'lib/ai/candidateAggregator.prompt.ts', impl: true },
      { label: 'Parallel Evaluation Pipeline', route: 'lib/services/evaluation-pipeline.ts', impl: true },
      { label: 'Score Calculation', route: 'lib/services/score-calculation.ts', impl: true },
      { label: 'AIEvaluation DB Record', route: 'prisma: AIEvaluation model', impl: true },
    ],
  },
];

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'ok') return <span className="text-emerald-600 text-lg">✅</span>;
  if (status === 'warn') return <span className="text-amber-500 text-lg">⚠️</span>;
  if (status === 'error') return <span className="text-red-600 text-lg">❌</span>;
  return <span className="text-slate-400 text-lg animate-pulse">⏳</span>;
}

function HealthMeter({ percent, status }: { percent: number; status: string }) {
  const color =
    status === 'healthy' ? 'bg-emerald-500' :
    status === 'degraded' ? 'bg-amber-500' : 'bg-red-500';

  const textColor =
    status === 'healthy' ? 'text-emerald-600' :
    status === 'degraded' ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={status === 'healthy' ? '#10b981' : status === 'degraded' ? '#f59e0b' : '#ef4444'}
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - percent / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className={`absolute text-3xl font-black ${textColor}`}>{percent}%</span>
      </div>
      <p className={`mt-2 text-sm font-bold uppercase tracking-wider ${textColor}`}>
        {status === 'healthy' ? 'System Healthy' : status === 'degraded' ? 'Degraded' : 'Critical Issues'}
      </p>
    </div>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'health' | 'audit'>('health');

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/system-health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealth(res.data);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Health check failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const checks = health?.checks || {};
  const summary = health?.summary;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔬</span>
              <h1 className="text-2xl font-black text-slate-900">System Health Dashboard</h1>
              <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">Dev Only</span>
            </div>
            <p className="text-sm text-slate-500">
              Real-time status of all subsystems. {lastFetched && `Last checked: ${lastFetched}.`}
              {health?.cached && ' (cached)'}
            </p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
          >
            {loading ? '⏳ Checking...' : '🔄 Re-run Checks'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-200 p-1 rounded-lg w-fit">
          {(['health', 'audit'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'health' ? '🩺 Live Health' : '📋 Feature Audit'}
            </button>
          ))}
        </div>

        {activeTab === 'health' && (
          <div>
            {/* Overall health */}
            {summary && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-center gap-8">
                <HealthMeter percent={summary.healthPercent} status={summary.overallStatus} />
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-3xl font-black text-emerald-600">{summary.ok}</div>
                    <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mt-1">Healthy</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-3xl font-black text-amber-600">{summary.warn}</div>
                    <div className="text-xs text-amber-700 font-semibold uppercase tracking-wider mt-1">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="text-3xl font-black text-red-600">{summary.error}</div>
                    <div className="text-xs text-red-700 font-semibold uppercase tracking-wider mt-1">Errors</div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(MODULE_LABELS).map(([key, label]) => {
                const check = checks[key];
                const status = (check?.status as CheckStatus) || 'loading';
                return (
                  <div
                    key={key}
                    className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${
                      status === 'error' ? 'border-red-200 bg-red-50' :
                      status === 'warn' ? 'border-amber-200 bg-amber-50' :
                      'border-slate-200'
                    }`}
                  >
                    <StatusBadge status={status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800">{label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          status === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                          status === 'warn' ? 'bg-amber-100 text-amber-700' :
                          status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                      {check?.message && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{check.message}</p>
                      )}
                      {check?.detail && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{check.detail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            {FEATURE_AUDIT.map((group) => (
              <div key={group.group} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{group.group}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                      <div>
                        <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                        <span className="ml-2 text-xs text-slate-400 font-mono">{item.route}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.impl ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.impl ? '✔ Implemented' : '✖ Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <strong>Note:</strong> This checklist reflects implementation status in code. Live functional verification requires navigating each feature in the browser. Use the 🩺 Live Health tab to check subsystem connectivity.
            </div>
          </div>
        )}

        {/* Footer timestamp */}
        {health?.timestamp && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Last health check completed at {new Date(health.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
