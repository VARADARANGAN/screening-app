import { StudentReport } from '@/components/admin/results/student-report';

export const metadata = {
  title: 'Student Report - Aptitude Portal',
  description: 'View detailed student assessment report and Candidate Intelligence',
};

export default function StudentReportPage() {
  return (
    <div className="p-6">
      <StudentReport />
    </div>
  );
}
