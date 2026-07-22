import { QuestionsManager } from '@/components/admin/questions-manager';

export const metadata = {
  title: 'Manage Questions - Aptitude Portal',
  description: 'Manage aptitude test questions',
};

export default function QuestionsPage() {
  return <QuestionsManager />;
}
