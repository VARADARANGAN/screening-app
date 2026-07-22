import { TestInterface } from '@/components/test/test-interface';

export const metadata = {
  title: 'Test - Aptitude Portal',
  description: 'Take the aptitude test',
};

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TestInterface testId={resolvedParams.id} />;
}
