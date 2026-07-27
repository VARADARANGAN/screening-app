import { ResultsDashboard } from '@/components/admin/results/results-dashboard';

export const metadata = {
  title: 'Results Dashboard - Aptitude Portal',
  description: 'View student assessment results and Candidate Intelligence',
};

export default function ResultsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Results Dashboard</h1>
        <p className="text-gray-600 mt-1">Review category-wise scores and AI Candidate Intelligence.</p>
      </div>
      <ResultsDashboard />
    </div>
  );
}
