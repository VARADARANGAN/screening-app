import { ProfileForm } from '@/components/student/profile-form';

export const metadata = {
  title: 'Complete Profile - Aptitude Screening Portal',
  description: 'Complete your profile information',
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ProfileForm />
    </main>
  );
}
