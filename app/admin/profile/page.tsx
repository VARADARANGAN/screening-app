import { AdminProfileForm } from '@/components/admin/profile-form';

export const metadata = {
  title: 'Admin Profile - Aptitude Screening Portal',
  description: 'Manage admin profile information',
};

export default function AdminProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <AdminProfileForm />
    </main>
  );
}
