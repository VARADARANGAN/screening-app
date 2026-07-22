import { QuestionImporter } from '@/components/admin/question-importer';

export const metadata = {
  title: 'Import Questions - Aptitude Screening Portal',
  description: 'Bulk import questions via Excel or CSV',
};

export default function ImportQuestionsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <QuestionImporter />
      </div>
    </main>
  );
}
